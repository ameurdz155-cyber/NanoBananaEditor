import React, { useCallback, useRef, useState } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Settings, FileText, Sparkles, X, Check, Upload, History, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';
import { validateApiKey, improvePromptText } from '../services/geminiService';
import { TemplatesView } from './TemplatesView';
import { useTemplateStore } from '../store/useTemplateStore';
import * as Dialog from '@radix-ui/react-dialog';
import { getTranslation } from '../i18n/translations';
import { usePromptPanelResize } from './PromptComposer/usePromptPanelResize';
import { TemplateSelector } from './PromptComposer/TemplateSelector';
import { CreditsDisplay } from './PromptComposer/CreditsDisplay';
import { uploadAsset, getAssetUrl } from '../services/uploadService';
import type { PromptTemplate } from '../types';

const DEFAULT_MODEL_FAMILY = 'gemini';
const DEFAULT_MODEL_NAME = 'models/gemini-2.5-flash-image';

let hasTemplatesModalAutoOpened = false;

const resolveIsDarkMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'light') {
    return false;
  }
  if (savedTheme === 'dark') {
    return true;
  }
  return document.documentElement.classList.contains('dark');
};

const IMPROVED_PROMPT_MARKERS = [
  'improved prompt:',
  'improved version:',
  'enhanced prompt:',
  'refined prompt:',
  'suggested prompt:',
  'optimized prompt:',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeImprovedPrompt = (originalPrompt: string, rawImproved: string): string => {
  if (!rawImproved) return rawImproved;

  let result = rawImproved.trim();
  if (!result) return result;

  const leadingBlockMatch = /original\s+prompt:[\s\S]*?(improved\s+(prompt|version|text|description|suggestion):)/i.exec(result);
  if (leadingBlockMatch) {
    const { index } = leadingBlockMatch;
    const capturedMarker = leadingBlockMatch[1];
    if (typeof index === 'number') {
      const sliceIndex = index + leadingBlockMatch[0].length - capturedMarker.length;
      result = result.slice(sliceIndex).trim();
    }
  }

  const lowerResult = result.toLowerCase();
  const markerEntry = IMPROVED_PROMPT_MARKERS
    .map((marker) => {
      const idx = lowerResult.indexOf(marker);
      return idx >= 0 ? { marker, index: idx } : null;
    })
    .filter((entry): entry is { marker: string; index: number } => entry !== null)
    .sort((a, b) => a.index - b.index)[0];

  if (markerEntry) {
    result = result.slice(markerEntry.index + markerEntry.marker.length).trim();
  }

  const normalizedOriginal = originalPrompt.trim();
  if (normalizedOriginal) {
    const normalizedOriginalLower = normalizedOriginal.toLowerCase();

    if (result.toLowerCase().startsWith(normalizedOriginalLower)) {
      result = result.slice(normalizedOriginal.length).trim();
    }

    const labeledOriginalRegex = new RegExp(`^original\s+prompt:\s*${escapeRegExp(normalizedOriginal)}\s*`, 'i');
    result = result.replace(labeledOriginalRegex, '').trim();

    const bareOriginalRegex = new RegExp(`^${escapeRegExp(normalizedOriginal)}[\s:,-]*`, 'i');
    result = result.replace(bareOriginalRegex, '').trim();
  }

  return result || rawImproved.trim();
};

export const PromptComposer: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedTool,
    setSelectedTool,
    temperature,
    setTemperature,
    seed,
    setSeed,
    isGenerating,
  isValidating,
    uploadedImages,
    addUploadedImage,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    addEditReferenceImage,
    removeEditReferenceImage,
    clearEditReferenceImages,
    uploadHistory,
    canvasImage,
    setCanvasImage,
    showPromptPanel,
  promptPanelWidth,
  setPromptPanelWidth,
    setShowPromptPanel,
    clearBrushStrokes,
    apiKeyError,
    setApiKeyError,
    language,
    promptHistory,
    addToPromptHistory,
    deletePromptFromHistory,
    currentProject,
    selectedTemplate,
    setSelectedTemplate,
    setGenerationProgress,
    setLastGenerationParameters,
    modelFamily,
    modelName,
    setModelFamily,
    setModelName,
  iterations,
  setIsValidating,
  } = useAppStore();

  const t = getTranslation(language);

  const { generate, cancelGeneration } = useImageGeneration();
  const { edit, cancelEdit } = useImageEditing();

  // Get all templates (default + custom)
  const backendTemplates = useTemplateStore((state) => state.templates);
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);
  const isTemplatesLoading = useTemplateStore((state) => state.loading.templates);

  const hasRequestedTemplatesRef = React.useRef(false);

  React.useEffect(() => {
    if (backendTemplates.length > 0 || isTemplatesLoading || hasRequestedTemplatesRef.current) {
      return;
    }

    hasRequestedTemplatesRef.current = true;
    fetchTemplates().catch((error) => {
      console.error('Failed to load templates for composer:', error);
      // Allow future retries if a different component triggers another fetch.
    });
  }, [backendTemplates.length, fetchTemplates, isTemplatesLoading]);

  const allTemplates = React.useMemo<PromptTemplate[]>(() => backendTemplates, [backendTemplates]);

  // Find the currently selected template
  const currentTemplate = React.useMemo<PromptTemplate | null>(() => {
    if (!selectedTemplate) {
      return null;
    }
    const foundTemplate = allTemplates.find((template) => template.id === selectedTemplate);
    return foundTemplate ?? null;
  }, [selectedTemplate, allTemplates]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(() => {
    if (!hasTemplatesModalAutoOpened) {
      hasTemplatesModalAutoOpened = true;
      return true;
    }
    return false;
  });
  const [isImproving, setIsImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [lastSelectedTemplate, setLastSelectedTemplate] = useState<{
    id: string;
    name: string;
    image?: string;
    emoji?: string;
    positivePrompt: string;
    negativePrompt?: string;
  } | null>(null);
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageWidth, setImageWidth] = useState<number>(1024);
  const [imageHeight, setImageHeight] = useState<number>(1024);
  const [randomSeed, setRandomSeed] = useState<boolean>(true);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [isTemplatePromptActive, setIsTemplatePromptActive] = useState(false);
  const [savedPromptBeforeTemplate, setSavedPromptBeforeTemplate] = useState<string>('');
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(resolveIsDarkMode);

  const widthSliderBackground = React.useMemo(() => {
    const progress = ((imageWidth - 64) / (1536 - 64)) * 100;
    const trackColor = isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(226, 232, 240)';
    return `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${progress}%, ${trackColor} ${progress}%, ${trackColor} 100%)`;
  }, [imageWidth, isDarkMode]);

  const heightSliderBackground = React.useMemo(() => {
    const progress = ((imageHeight - 64) / (1536 - 64)) * 100;
    const trackColor = isDarkMode ? 'rgb(55, 65, 81)' : 'rgb(226, 232, 240)';
    return `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${progress}%, ${trackColor} ${progress}%, ${trackColor} 100%)`;
  }, [imageHeight, isDarkMode]);

  const filteredPromptHistory = React.useMemo(() => {
    const query = historySearchQuery.trim().toLowerCase();
    if (!query) {
      return promptHistory;
    }
    return promptHistory.filter((prompt) => prompt.toLowerCase().includes(query));
  }, [promptHistory, historySearchQuery]);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const historyPopoverRef = useRef<HTMLDivElement | null>(null);
  const historyButtonRef = useRef<HTMLButtonElement | null>(null);
  const historySearchInputRef = useRef<HTMLInputElement | null>(null);
  const [historyPopoverPosition, setHistoryPopoverPosition] = React.useState({ top: 80, left: 16 });
  const validationAbortRef = useRef(false);

  // Use the panel resize hook
  const { handleResizeMouseDown, handleResizeTouchStart } = usePromptPanelResize({
    setPromptPanelWidth,
    showPromptPanel,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleThemeChange = () => {
      setIsDarkMode(resolveIsDarkMode());
    };

    window.addEventListener('themeChange', handleThemeChange);
    handleThemeChange();

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleChange = () => setIsMobileViewport(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  React.useEffect(() => {
    if (!showPromptHistory || isMobileViewport) {
      return;
    }

    const updatePosition = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const buttonRect = historyButtonRef.current?.getBoundingClientRect();
      const popoverWidth = historyPopoverRef.current?.offsetWidth ?? 320;
      const popoverHeight = historyPopoverRef.current?.offsetHeight ?? 360;
      const margin = 16;
      const topMargin = 80;

      if (!buttonRect) {
        setHistoryPopoverPosition({
          top: topMargin,
          left: Math.max(margin, window.innerWidth - popoverWidth - margin),
        });
        return;
      }

      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - popoverWidth;

      const fitsBelow = top + popoverHeight + margin <= window.innerHeight;
      const fitsAbove = buttonRect.top - popoverHeight - 8 >= topMargin;

      if (!fitsBelow && fitsAbove) {
        top = buttonRect.top - popoverHeight - 8;
      } else if (!fitsBelow && !fitsAbove) {
        top = Math.max(topMargin, Math.min(buttonRect.bottom + 8, window.innerHeight - popoverHeight - margin));
      }

      const maxLeft = window.innerWidth - popoverWidth - margin;
      if (left < margin) {
        left = margin;
      }
      if (left > maxLeft) {
        left = maxLeft;
      }

      if (top < topMargin) {
        top = topMargin;
      }

      setHistoryPopoverPosition({ top, left });
    };

    updatePosition();
    const timer = window.setTimeout(updatePosition, 100);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showPromptHistory, isMobileViewport, filteredPromptHistory.length, historySearchQuery, promptPanelWidth]);

  // Update width/height when aspect ratio changes
  const handleAspectRatioChange = (newRatio: string) => {
    setAspectRatio(newRatio);
    
    // Skip dimension adjustment for auto mode
    if (newRatio === 'auto') {
      return;
    }
    
    const [w, h] = newRatio.split(':').map(Number);
    const ratio = w / h;
    
    // Keep width, adjust height
    const newHeight = Math.round(imageWidth / ratio / 64) * 64;
    setImageHeight(Math.max(64, Math.min(1536, newHeight)));
  };

  // Update height when width changes (maintain aspect ratio)
  const handleWidthChange = (newWidth: number) => {
    setImageWidth(newWidth);
    
    // Skip aspect ratio adjustment for auto mode
    if (aspectRatio === 'auto') {
      return;
    }
    
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    const newHeight = Math.round(newWidth / ratio / 64) * 64;
    setImageHeight(Math.max(64, Math.min(1536, newHeight)));
  };

  React.useEffect(() => {
    if (modelFamily !== DEFAULT_MODEL_FAMILY) {
      setModelFamily(DEFAULT_MODEL_FAMILY);
    }
    if (modelName !== DEFAULT_MODEL_NAME) {
      setModelName(DEFAULT_MODEL_NAME);
    }
  }, [modelFamily, modelName, setModelFamily, setModelName]);

  // Update width when height changes (maintain aspect ratio)
  const handleHeightChange = (newHeight: number) => {
    setImageHeight(newHeight);
    
    // Skip aspect ratio adjustment for auto mode
    if (aspectRatio === 'auto') {
      return;
    }
    
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    const newWidth = Math.round(newHeight * ratio / 64) * 64;
    setImageWidth(Math.max(64, Math.min(1536, newWidth)));
  };

  const handleViewTemplate = () => {
    const templateForView = currentTemplate ?? lastSelectedTemplate;
    if (!templateForView) {
      return;
    }

    if (isTemplatePromptActive) {
      setCurrentPrompt(savedPromptBeforeTemplate);
      setIsTemplatePromptActive(false);
      setShowNegativePrompt(false);
      setNegativePrompt('');
      return;
    }

    setSavedPromptBeforeTemplate(currentPrompt);
    setCurrentPrompt((templateForView.positivePrompt || '').trim());
    setIsTemplatePromptActive(true);

    if (templateForView.negativePrompt && templateForView.negativePrompt.trim()) {
      setShowNegativePrompt(true);
      setNegativePrompt(templateForView.negativePrompt.trim());
    } else {
      setShowNegativePrompt(false);
      setNegativePrompt('');
    }
  };

  const handleFlattenTemplate = (
    positivePrompt: string,
    negativePromptValue: string,
    shouldShowNegative: boolean
  ) => {
    setCurrentPrompt(positivePrompt);

    if (shouldShowNegative && negativePromptValue) {
      setShowNegativePrompt(true);
      setNegativePrompt(negativePromptValue);
    } else {
      setShowNegativePrompt(false);
      setNegativePrompt('');
    }

    setIsTemplatePromptActive(false);
    setSavedPromptBeforeTemplate('');
    setSelectedTemplate(null);
    setLastSelectedTemplate(null);
    setShowTemplatesModal(false);
  };

  const handleClearTemplateSelection = () => {
    if (isTemplatePromptActive) {
      setCurrentPrompt(savedPromptBeforeTemplate);
    }
    setIsTemplatePromptActive(false);
    setSavedPromptBeforeTemplate('');
    setShowNegativePrompt(false);
    setNegativePrompt('');
    setSelectedTemplate(null);
    setLastSelectedTemplate(null);
    setShowTemplatesModal(false);
  };

  React.useEffect(() => {
    if (selectedTemplate && !currentTemplate && !lastSelectedTemplate) {
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, currentTemplate, lastSelectedTemplate, setSelectedTemplate]);

  // Clean up images when switching tools
  React.useEffect(() => {
    // When switching away from mask mode, clear brush strokes
    // This ensures a clean state when switching tools
    return () => {
      // Cleanup if needed
    };
  }, [selectedTool]);

  const handleGenerateRef = useRef<() => Promise<void>>(async () => {});
  const isGeneratingRef = useRef(isGenerating);
  const isValidatingRef = useRef(isValidating);

  React.useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  React.useEffect(() => {
    isValidatingRef.current = isValidating;
  }, [isValidating]);

  // Listen for triggerGenerate and cancelGeneration events from Header button
  React.useEffect(() => {
    const handleTriggerGenerate = () => {
      handleGenerateRef.current();
    };

    const handleCancelGeneration = () => {
      if (isGeneratingRef.current || isValidatingRef.current) {
        handleGenerateRef.current();
      }
    };

    const handleResetTemplateSelector = () => {
      // Reset template selection state
      setLastSelectedTemplate(null);
      setIsTemplatePromptActive(false);
      setSavedPromptBeforeTemplate('');
    };
    
    window.addEventListener('triggerGenerate', handleTriggerGenerate);
    window.addEventListener('cancelGeneration', handleCancelGeneration);
    window.addEventListener('resetTemplateSelector', handleResetTemplateSelector);
    
    return () => {
      window.removeEventListener('triggerGenerate', handleTriggerGenerate);
      window.removeEventListener('cancelGeneration', handleCancelGeneration);
      window.removeEventListener('resetTemplateSelector', handleResetTemplateSelector);
    };
  }, []);


  const handleImprovePrompt = async () => {
    // If already improving, stop the improvement
    if (isImproving) {
      setIsImproving(false);
      return;
    }

    if (!currentPrompt.trim()) return;
    
    setIsImproving(true);
    setApiKeyError(null);
    
    try {
  const improved = await improvePromptText(currentPrompt, language);
  const cleaned = sanitizeImprovedPrompt(currentPrompt, improved);
  setImprovedPrompt(cleaned);
    } catch (error: any) {
      console.error('Failed to improve prompt:', error);
      setApiKeyError(error.message || 'Failed to improve prompt. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleAcceptImprovedPrompt = () => {
    if (improvedPrompt) {
      setCurrentPrompt(improvedPrompt);
      setImprovedPrompt(null);
    }
  };

  const handleRejectImprovedPrompt = () => {
    setImprovedPrompt(null);
  };

  const handleGenerate = async () => {
    // If validation is in progress, cancel it and exit early
    if (isValidating) {
      validationAbortRef.current = true;
      setIsValidating(false);
      setApiKeyError(null);
      return;
    }

    // If already generating, stop the generation
    if (isGenerating) {
      if (selectedTool === 'generate') {
        cancelGeneration();
      } else {
        cancelEdit();
      }
      return;
    }

    if (!currentPrompt.trim()) return;

    const activeModelFamily = DEFAULT_MODEL_FAMILY;
    const activeModelName = DEFAULT_MODEL_NAME;

    if (modelFamily !== activeModelFamily) {
      setModelFamily(activeModelFamily);
    }
    if (modelName !== activeModelName) {
      setModelName(activeModelName);
    }
    
    // Log the selected model when generate is clicked
    console.log('🎨 Generation Started with Model:', {
      modelFamily: activeModelFamily,
      modelName: activeModelName,
      fullModelPath: activeModelName,
      tool: selectedTool,
      prompt: currentPrompt.substring(0, 50) + '...'
    });
    
    // Check if prompt contains {prompt} or {photo} placeholders
    if (currentPrompt.includes('{prompt}') || currentPrompt.includes('{photo}')) {
      setApiKeyError('PLACEHOLDER_WARNING');
      return;
    }
    
    // Clear previous errors
    setApiKeyError(null);
    
    // Validate API key before generating
    validationAbortRef.current = false;
    setIsValidating(true);
  const validation = await validateApiKey({ timeoutMs: 6000 });

    if (validationAbortRef.current) {
      validationAbortRef.current = false;
      return;
    }

    setIsValidating(false);

    if (!validation.valid) {
      setApiKeyError(validation.error || 'Invalid API key. Please check Settings.');
      return;
    }
    
    // Add to history
    addToPromptHistory(currentPrompt);
    
    if (selectedTool === 'generate') {
      setLastGenerationParameters({ width: imageWidth, height: imageHeight, aspectRatio });

      const referenceImages = uploadedImages
        .filter(img => img.includes('base64,'))
        .map(img => img.split('base64,')[1]);

      const totalIterations = Math.max(1, iterations);
      
      // Generate multiple images based on iterations
      try {
        for (let i = 0; i < totalIterations; i++) {
          const currentIteration = i + 1;
          setGenerationProgress({ current: currentIteration, total: totalIterations });
          await generate({
            prompt: currentPrompt,
            negativePrompt: negativePrompt.trim() || undefined,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            temperature,
            seed: seed || undefined,
            aspectRatio,
            width: imageWidth,
            height: imageHeight,
            iterationIndex: currentIteration,
            totalIterations,
            referenceCount: referenceImages.length,
            modelType: activeModelFamily,
            modelName: activeModelName,
          });
          
          // Add a small delay between iterations to avoid overwhelming the API
          if (i < totalIterations - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Generation failed during iterations:', error);
      } finally {
        setGenerationProgress({ current: 0, total: 0 });
      }
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      edit(currentPrompt);
    }
  };

  handleGenerateRef.current = handleGenerate;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // Upload to backend and get asset URL instead of storing base64
        const uploadResult = await uploadAsset(file);
        const assetUrl = getAssetUrl(uploadResult.asset_id);
        
        // Create a data URL for preview (smaller thumbnail)
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewDataUrl = e.target?.result as string;
          
          // Store the asset URL (not base64) for better performance
          if (selectedTool === 'generate') {
            // Add to reference images (unlimited)
            addUploadedImage(assetUrl);
          } else if (selectedTool === 'edit') {
            // For edit mode, add to separate edit reference images (unlimited)
            addEditReferenceImage(assetUrl);
            // Set as canvas image if none exists
            if (!canvasImage) {
              setCanvasImage(assetUrl, 'upload');
            }
          } else if (selectedTool === 'mask') {
            // For mask mode, set as canvas image immediately
            clearUploadedImages();
            addUploadedImage(assetUrl);
            setCanvasImage(assetUrl, 'upload');
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Fallback to base64 if upload fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          if (selectedTool === 'generate') {
            addUploadedImage(dataUrl);
          } else if (selectedTool === 'edit') {
            addEditReferenceImage(dataUrl);
            if (!canvasImage) {
              setCanvasImage(dataUrl, 'upload');
            }
          } else if (selectedTool === 'mask') {
            clearUploadedImages();
            addUploadedImage(dataUrl);
            setCanvasImage(dataUrl, 'upload');
          }
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleClearSession = () => {
    setCurrentPrompt('');
    clearUploadedImages();
    clearEditReferenceImages();
    clearBrushStrokes();
    setCanvasImage(null);
    setSeed(null);
    setTemperature(0.7);
    setShowClearConfirm(false);
  };

  const handleClearHistory = useCallback(() => {
    for (let i = promptHistory.length - 1; i >= 0; i--) {
      deletePromptFromHistory(i);
    }
    setHistorySearchQuery('');
  }, [promptHistory, deletePromptFromHistory, setHistorySearchQuery]);

  const improvedPromptDescriptionId = React.useId();
  const referenceModalDescriptionId = React.useId();
  const templatesModalDescriptionId = React.useId();

  const sanitizeImageSrc = React.useCallback((src: string): string | null => {
    if (!src || typeof src !== 'string') {
      return null;
    }

    const trimmed = src.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith('data:image')) {
      const [metadata, base64] = trimmed.split(',', 2);
      if (!base64) {
        return null;
      }

  const sanitizedData = base64.replace(/[^A-Za-z0-9+/=_-]/g, '');
      if (!sanitizedData) {
        return null;
      }

      const paddingNeeded = sanitizedData.length % 4;
      const paddedData =
        paddingNeeded === 0 ? sanitizedData : sanitizedData.padEnd(sanitizedData.length + (4 - paddingNeeded), '=');

      return `${metadata},${paddedData}`;
    }

    try {
      const parsed = new URL(trimmed);
      return parsed.href;
    } catch (error) {
      if (trimmed.startsWith('/')) {
        return trimmed;
      }
      return null;
    }
  }, []);

  const tools = [
    { id: 'generate', icon: Wand2, label: t.generate, description: t.createFromText },
    { id: 'edit', icon: Edit3, label: t.edit, description: t.modifyExisting },
    { id: 'mask', icon: MousePointer, label: t.select, description: t.clickToSelect },
  ] as const;

  if (!showPromptPanel) {
    return null;
  }

  return (
    <>
      <div
      ref={panelRef}
  className="relative h-full flex-shrink-0 bg-vis-panel border-r border-vis-border overflow-visible"
      style={{ width: `${Math.round(promptPanelWidth)}px` }}
    >
      <div
        className="absolute inset-y-0 -right-1 w-3 cursor-col-resize group z-20"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        aria-label="Resize prompt panel"
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 right-0 w-1 bg-gray-700/40 group-hover:bg-purple-500/70 transition-all" />
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-0.5 h-16 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setShowPromptPanel(false);
          }}
          title={t.hidePromptPanel}
          className="absolute top-6 -right-3 h-8 w-8 rounded-full border border-vis-border bg-gray-900/70 text-vis-text-secondary hover:bg-gray-800/90 hover:text-vis-teal-300 transition-all duration-200 z-[9999] opacity-60 hover:opacity-100 pointer-events-auto shadow-vis-glow-teal"
          aria-label={t.hidePromptPanel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-full overflow-visible">
        <div className="h-full p-6 flex flex-col space-y-6 overflow-y-auto sidebar-scrollbar">
          <div className="bg-gray-900/70 rounded-xl p-4 border border-vis-border-light flex-shrink-0 shadow-vis-glow-teal">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-vis-teal-300">{t.selectMode}</h3>
                <p className="text-xs text-vis-text-secondary mt-0.5">{t.chooseHowToCreate}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHintsModal(true)}
                  className="h-7 w-7 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
                  title={t.promptTips}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden',
                    selectedTool === tool.id
                      ? 'bg-gradient-to-br from-vis-teal-500/20 to-vis-cyan-500/20 border-vis-teal-400 shadow-vis-glow-teal'
                      : 'bg-gray-800/50 border-vis-border hover:bg-gray-800/70 hover:border-vis-border-light'
                  )}
                >
                  {selectedTool === tool.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-vis-teal-500/10 to-vis-cyan-500/10 animate-pulse" />
                  )}
                  <tool.icon className={cn(
                    "h-5 w-5 mb-2 relative z-10 transition-colors",
                    selectedTool === tool.id ? 'text-vis-teal-300' : 'text-vis-text-secondary group-hover:text-vis-teal-400'
                  )} />
                  <span className={cn(
                    "text-xs font-semibold relative z-10 transition-colors",
                    selectedTool === tool.id ? 'text-vis-teal-200' : 'text-vis-text-secondary group-hover:text-vis-text-primary'
                  )}>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Template Selector */}
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            currentTemplate={currentTemplate}
            lastSelectedTemplate={lastSelectedTemplate}
            isTemplatePromptActive={isTemplatePromptActive}
            savedPromptBeforeTemplate={savedPromptBeforeTemplate}
            currentPrompt={currentPrompt}
            onShowTemplatesModal={() => setShowTemplatesModal(true)}
            onViewTemplate={handleViewTemplate}
            onFlattenTemplate={handleFlattenTemplate}
            onClearTemplate={handleClearTemplateSelection}
            t={t}
          />

          {/* Credits Display */}
          <CreditsDisplay
            credits={0}
            onPurchase={() => {
              console.log('Purchase initiated from PromptComposer');
              // TODO: Integrate with your payment system
            }}
          />

          {/* Prompt Input - Enhanced Card Design */}
          <div className="bg-gray-900/70 rounded-xl p-4 border border-vis-border-light hover:border-vis-teal-500/50 transition-all duration-200 flex-shrink-0 shadow-vis-glow-teal">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-vis-teal-300 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400 mr-2"></span>
            {selectedTool === 'generate' ? t.generateFromText : t.editInstructions}
          </label>
          <button 
            onClick={() => setShowHintsModal(true)}
            className="text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
            title={t.promptTips}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        {/* Mode-specific help text */}
  <div className="mb-3 p-3 bg-gray-800/50 border border-vis-border rounded-lg">
          {selectedTool === 'generate' && (
            <div className="space-y-1.5">
              <p className="text-xs text-vis-cyan-300 font-medium flex items-center">
                <Sparkles className="h-3 w-3 mr-1.5" />
                {t.generateModeTitle}
              </p>
              <p className="text-xs text-vis-text-secondary leading-relaxed">
                {t.generateModeDescription}
              </p>
              <p className="text-xs text-vis-purple-300 italic">
                {t.generateModeTip}
              </p>
            </div>
          )}
          
          {selectedTool === 'edit' && (
            <div className="space-y-1.5">
              <p className="text-xs text-vis-cyan-300 font-medium flex items-center">
                <Edit3 className="h-3 w-3 mr-1.5" />
                {t.editModeTitle}
              </p>
              <p className="text-xs text-vis-text-secondary leading-relaxed">
                {t.editModeDescription}
              </p>
            </div>
          )}
          
          {selectedTool === 'mask' && (
            <div className="space-y-1.5">
              <p className="text-xs text-vis-cyan-300 font-medium flex items-center">
                <MousePointer className="h-3 w-3 mr-1.5" />
                {t.selectModeTitle}
              </p>
              <p className="text-xs text-vis-text-secondary leading-relaxed">
                {t.selectModeDescription}
              </p>
              <p className="text-xs text-orange-400">
                {t.selectModeWarning}
              </p>
            </div>
          )}
        </div>
        
  <p className="text-xs text-vis-text-secondary mb-3">
          {selectedTool === 'generate' 
            ? t.enterPromptAndInvoke
            : t.describeChanges}
        </p>
        
        {/* Textarea with History Button */}
  <div className="relative overflow-visible">
        <div className="relative">
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
          selectedTool === 'generate'
            ? t.promptPlaceholderGenerate
            : t.promptPlaceholderEdit
          }
          className="min-h-[150px] resize-y bg-gray-950/90 border border-vis-border focus:border-vis-teal-400/70 focus:ring-1 focus:ring-vis-teal-400/30 transition-all duration-200 pr-20 pb-12 text-[13px] leading-relaxed text-vis-text-primary placeholder:text-vis-text-muted"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <button
          type="button"
          onClick={() => setShowPromptHistory(!showPromptHistory)}
          ref={historyButtonRef}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md text-vis-text-secondary transition-all duration-200",
            showPromptHistory
            ? "bg-red-500/15 text-red-200 shadow-[0_0_12px_rgba(248,113,113,0.35)]"
            : "hover:text-vis-teal-300 hover:bg-gray-800/50"
          )}
          title={t.promptHistory}
          >
          <span className="sr-only">{t.promptHistory}</span>
          <History className="h-3.5 w-3.5" />
          </button>
          <button
          type="button"
          onClick={() => {
            if (!showNegativePrompt) {
            setShowNegativePrompt(true);
            const templateForNegative = currentTemplate ?? lastSelectedTemplate;
            const negativeSource = templateForNegative?.negativePrompt;
            if (negativeSource) {
              const negText = negativeSource.replace('{prompt}', '').replace('{photo}', '').trim();
              if (negText) {
              setNegativePrompt(negText);
              }
            }
            } else {
            setShowNegativePrompt(false);
            }
          }}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200',
            isDarkMode ? 'text-gray-400' : 'text-slate-500',
            showNegativePrompt
            ? isDarkMode
              ? 'bg-orange-500/15 text-orange-200 shadow-[0_0_12px_rgba(251,146,60,0.35)]'
              : 'bg-orange-100 text-orange-600 shadow-[0_0_18px_rgba(251,146,60,0.25)] border border-orange-300/60'
            : isDarkMode
              ? 'hover:text-gray-100 hover:bg-gray-800'
              : 'hover:text-slate-900 hover:bg-orange-100/40'
          )}
          title={showNegativePrompt ? t.hideNegativePrompt : t.addNegativePrompt}
          aria-label={showNegativePrompt ? t.hideNegativePrompt : t.addNegativePrompt}
          >
          {showNegativePrompt ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="sr-only">{t.negativePromptLabel}</span>
          </button>
        </div>
        <div className="absolute bottom-3 right-3">
          <button
            type="button"
            onClick={handleImprovePrompt}
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm backdrop-blur-sm border',
              isImproving
                ? isDarkMode
                  ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40 shadow-[0_0_12px_rgba(234,179,8,0.35)]'
                  : 'bg-yellow-200/60 text-yellow-700 border-yellow-400/70 shadow-[0_0_12px_rgba(202,138,4,0.25)]'
                : isDarkMode
                  ? 'bg-gray-950/60 text-yellow-300 border-yellow-400/40 hover:text-yellow-200 hover:bg-yellow-500/10'
                  : 'bg-yellow-50 text-yellow-600 border-yellow-400/60 hover:text-yellow-700 hover:bg-yellow-100/70'
            )}
            title={isImproving ? (t.cancel || 'Cancel') : (t.improvePrompt || 'Improve Prompt')}
            aria-label={isImproving ? (t.cancel || 'Cancel') : (t.improvePrompt || 'Improve Prompt')}
          >
            {isImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="sr-only">{isImproving ? (t.cancel || 'Cancel') : (t.improvePrompt || 'Improve Prompt')}</span>
          </button>
        </div>
        </div>
        {showPromptHistory && (
        <div
          ref={historyPopoverRef}
          className={cn(
            'rounded-xl border border-gray-800 bg-gray-950 shadow-[0_20px_45px_-24px_rgba(0,0,0,0.85)] p-4 z-50 flex flex-col',
            isMobileViewport
              ? 'fixed inset-x-5 bottom-24 max-h-[60vh] overflow-y-auto'
              : 'fixed w-80 max-h-[85vh]'
          )}
          style={
            isMobileViewport
              ? undefined
              : {
                  top: `${historyPopoverPosition.top}px`,
                  left: `${historyPopoverPosition.left}px`,
                }
          }
        >
          <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-vis-teal-300">{t.promptHistory}</p>
          <button
            type="button"
            onClick={() => setShowPromptHistory(false)}
            className="h-6 w-6 flex items-center justify-center rounded-md text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/50 transition-colors"
          >
            <span className="sr-only">Close history</span>
            <X className="h-3.5 w-3.5" />
          </button>
          </div>
          <div className="mt-3 space-y-2">
          <div className="relative">
            <input
            ref={historySearchInputRef}
            type="text"
            placeholder={t.searchPrompts}
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            disabled={promptHistory.length === 0}
            className="w-full pl-9 pr-8 py-2 bg-gray-950/90 border border-vis-border rounded-lg text-sm text-vis-text-primary placeholder-vis-text-muted disabled:opacity-50 focus:outline-none focus:border-vis-teal-400/70 focus:ring-1 focus:ring-vis-teal-400/30 focus:bg-gray-900/90 transition-all"
            />
            <svg
            className="absolute left-2.5 top-3 h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {historySearchQuery && (
            <button
              type="button"
              onClick={() => setHistorySearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
            >
              <span className="sr-only">Clear search</span>
              <X className="h-4 w-4" />
            </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={promptHistory.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-vis-border bg-gray-950/90 py-2 text-xs font-semibold text-vis-text-primary hover:border-red-500/60 hover:text-red-300 hover:bg-gray-900/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.clearHistory}
          </button>
          </div>
          <div
            className={cn(
              'mt-3 border-t border-vis-border pt-3 overflow-y-auto sidebar-scrollbar',
              isMobileViewport ? 'max-h-48' : 'flex-1'
            )}
          >
          {promptHistory.length === 0 ? (
            <div className="py-6 text-center text-sm text-vis-text-muted">
            {t.noPromptHistoryRecorded}
            </div>
          ) : filteredPromptHistory.length === 0 ? (
            <div className="py-6 text-center text-sm text-vis-text-muted">
            {t.noPromptsFound ?? 'No prompts found.'}
            </div>
          ) : (
            <div className="space-y-2">
            {filteredPromptHistory.map((prompt, index) => {
              const originalIndex = promptHistory.indexOf(prompt);
              const displayNumber = originalIndex >= 0 ? promptHistory.length - originalIndex : promptHistory.length - index;

              return (
              <button
                key={`${prompt}-${index}`}
                type="button"
                onClick={() => {
                setCurrentPrompt(prompt);
                setShowPromptHistory(false);
                }}
                className="w-full rounded-lg bg-gray-800/50 px-3 py-2 text-left text-sm text-vis-text-primary hover:bg-gray-800/70 hover:border-vis-teal-500/30 border border-transparent transition-all"
              >
                <p className="text-[11px] uppercase tracking-wide text-vis-teal-400 mb-1">
                {t.promptNumber}{displayNumber}
                </p>
                <p className="text-xs text-vis-text-secondary leading-relaxed line-clamp-3">
                {prompt}
                </p>
              </button>
              );
            })}
            </div>
          )}
          </div>
          <div className="mt-3 border-t border-vis-border pt-2 text-center text-[11px] text-vis-text-muted">
          <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded border border-vis-border mr-1 text-vis-text-secondary">alt+up/down</kbd>
          {t.switchBetweenPrompts}
          </div>
        </div>
        )}
      </div>

        {showNegativePrompt && (
          <div className="mt-3">
            <label className="text-xs font-semibold text-orange-400 mb-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-2"></span>
              {t.negativePromptLabel}
            </label>
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t.enterNegativePrompt}
              className="min-h-[100px] resize-none bg-gray-950/90 border border-vis-border focus:border-orange-400/70 focus:ring-1 focus:ring-orange-400/30 transition-all duration-200 text-[13px] leading-relaxed text-vis-text-primary placeholder:text-vis-text-muted"
            />
          </div>
        )}
        

        {/* Improved Prompt Modal */}
        <Dialog.Root open={!!improvedPrompt} onOpenChange={(open) => !open && handleRejectImprovedPrompt()}>
          <Dialog.Portal>
            <Dialog.Overlay
              className={cn(
                'fixed inset-0 backdrop-blur-sm z-50 transition-colors',
                isDarkMode ? 'bg-black/50' : 'bg-black/30'
              )}
            />
            <Dialog.Content
              aria-describedby={improvedPromptDescriptionId}
              className={cn(
                'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50 transition-colors',
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-purple-500/30 shadow-2xl'
                  : 'bg-white border border-purple-200/70 shadow-xl'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'
                    )}
                  >
                    <Sparkles className={cn('h-5 w-5', isDarkMode ? 'text-purple-400' : 'text-purple-500')} />
                  </div>
                  <Dialog.Title
                    className={cn(
                      'text-xl font-bold bg-clip-text',
                      isDarkMode ? 'text-transparent bg-gradient-to-r from-purple-400 to-pink-400' : 'text-purple-600'
                    )}
                  >
                    {t.improvedPromptTitle}
                  </Dialog.Title>
                </div>
                <Dialog.Description id={improvedPromptDescriptionId} className="sr-only">
                  {t.improvedPromptTitle} — {t.canEditImproved}
                </Dialog.Description>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 transition-colors',
                      isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100 text-gray-500'
                    )}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                {/* Original Prompt */}
                <div
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <h4
                    className={cn(
                      'text-xs font-semibold mb-2 uppercase tracking-wider',
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    )}
                  >
                    {t.originalPrompt}
                  </h4>
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    )}
                  >
                    {currentPrompt}
                  </p>
                </div>

                {/* Improved Prompt */}
                <div
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    isDarkMode
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30'
                      : 'bg-gradient-to-br from-purple-100/70 via-white to-pink-100/60 border-purple-200'
                  )}
                >
                  <h4
                    className={cn(
                      'text-xs font-semibold mb-2 uppercase tracking-wider',
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    )}
                  >
                    {t.improvedVersion}
                  </h4>
                  <Textarea
                    value={improvedPrompt || ''}
                    onChange={(e) => setImprovedPrompt(e.target.value)}
                    className={cn(
                      'min-h-[120px] resize-none text-sm leading-relaxed transition-all duration-200 border focus-visible:outline-none',
                      isDarkMode
                        ? 'bg-gray-800/50 border-purple-500/30 text-gray-200 placeholder:text-gray-400 focus:border-purple-500 focus-visible:bg-gray-900/70 focus-visible:border-purple-400/60 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-offset-gray-900'
                        : 'bg-white border-purple-300/50 text-gray-700 placeholder:text-gray-500 focus:border-purple-400 focus-visible:bg-purple-50 focus-visible:border-purple-400/70 focus-visible:shadow-[0_0_18px_rgba(168,85,247,0.15)] ring-offset-white'
                    )}
                    placeholder="Improved prompt will appear here..."
                  />
                  <p
                    className={cn(
                      'text-xs mt-2 flex items-center gap-1.5',
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    )}
                  >
                    <span aria-hidden="true">✏️</span>
                    {t.canEditImproved}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    size="lg"
                    onClick={handleAcceptImprovedPrompt}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t.acceptAndUse}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleRejectImprovedPrompt}
                    className={cn(
                      'flex-1 transition-colors',
                      isDarkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t.keepOriginal}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        
        {/* Prompt Quality Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {currentPrompt.length < 20 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <span className="text-red-400">{t.needsMoreDetail}</span>
              </>
            ) : currentPrompt.length < 50 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                <span className="text-yellow-400">{t.goodPrompt}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-vis-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                <span className="text-vis-teal-400">{t.excellentPrompt}</span>
              </>
            )}
          </div>
          <span className="text-vis-text-muted">{currentPrompt.length} {t.characters}</span>
        </div>
      </div>

      {/* Reference Images Upload */}
      <div className="bg-gray-900/70 rounded-xl p-4 border border-vis-border-light hover:border-vis-cyan-500/50 transition-all duration-200 flex-shrink-0 shadow-vis-glow-cyan">
        <input
          type="file"
          id="reference-image-upload"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Thumbnails at top if images exist */}
        {((selectedTool === 'generate' && uploadedImages.length > 0) ||
          (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
          <div className="flex gap-2 mb-3">
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => {
              const safeImage = sanitizeImageSrc(image);
              if (!safeImage) {
                return null;
              }

              return (
                <div
                  key={index}
                  className="relative group w-14 h-14 rounded-lg border-2 border-vis-border hover:border-red-500 overflow-hidden bg-gray-800/50 flex-shrink-0 transition-all"
                >
                  <img
                    src={safeImage}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    onClick={() => (selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index))}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.removeImage}
                  >
                    <X className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              );
            })}
            {/* Add more button */}
            <button
              onClick={() => document.getElementById('reference-image-upload')?.click()}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-vis-border hover:border-vis-cyan-400 bg-gray-800/30 hover:bg-gray-800/50 flex items-center justify-center transition-all text-vis-text-secondary hover:text-vis-cyan-300"
              title="Add more images"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <label
            className={cn(
              'text-sm font-semibold flex items-center transition-colors',
              isDarkMode ? 'text-vis-cyan-300' : 'text-purple-600'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full mr-2',
                isDarkMode ? 'bg-gradient-to-r from-vis-cyan-400 to-vis-teal-400' : 'bg-gradient-to-r from-purple-400 to-pink-400'
              )}
            ></span>
            {selectedTool === 'generate' ? t.addReferenceImages : selectedTool === 'edit' ? t.styleReferences : t.uploadImage}
          </label>
          <button
            onClick={() => setShowReferenceModal(true)}
            className={cn(
              'text-xs font-medium flex items-center gap-1 transition-colors',
              isDarkMode
                ? 'text-vis-cyan-400 hover:text-vis-cyan-300'
                : 'text-purple-500 hover:text-purple-600'
            )}
          >
            <History className="h-3 w-3" />
            {t.referenceLibrary}
          </button>
        </div>
        
        {selectedTool === 'mask' && (
          <p className="text-xs text-vis-text-secondary mb-3">
            {t.uploadImageForMaskPainting}
          </p>
        )}
        {selectedTool === 'edit' && (
          <p className="text-xs text-vis-text-secondary mb-3">
            {canvasImage ? t.uploadImageOptionalEdit : t.uploadImageToEdit}
          </p>
        )}
        {selectedTool === 'generate' && (
          <p className="text-xs text-vis-text-secondary mb-3">
            {t.uploadImageToGuideStyle}
          </p>
        )}

        {/* Empty state */}
        {((selectedTool === 'generate' && uploadedImages.length === 0) ||
          (selectedTool === 'edit' && editReferenceImages.length === 0)) && (
          <button
            onClick={() => document.getElementById('reference-image-upload')?.click()}
            className="w-full py-6 flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-vis-border border-dashed hover:border-vis-cyan-400/50 transition-all duration-200 cursor-pointer group"
          >
            <Upload className="h-5 w-5 text-vis-text-secondary group-hover:text-vis-cyan-400 mb-2 transition-colors" />
            <div className="text-xs text-vis-text-secondary group-hover:text-vis-cyan-300 transition-colors">{t.uploadImages}</div>
          </button>
        )}

        {/* Upload History - Show previously uploaded images */}
        {uploadHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-vis-border">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-vis-text-secondary tracking-wide">
                {t.previousUploads}
              </label>
              <span className="text-xs text-vis-text-muted">
                {t.clickToAdd}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {uploadHistory
                .filter(img => {
                  // Filter out images already in current references
                  const currentImages = selectedTool === 'generate' ? uploadedImages : editReferenceImages;
                  return !currentImages.includes(img);
                })
                .slice(0, 10) // Show max 10 history items
                .map((image, index) => {
                  const safeImage = sanitizeImageSrc(image);
                  if (!safeImage) {
                    return null;
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (selectedTool === 'generate') {
                          addUploadedImage(image);
                        } else {
                          addEditReferenceImage(image);
                        }
                      }}
                      className="relative w-14 h-14 rounded-lg border-2 border-vis-border hover:border-vis-cyan-400 overflow-hidden bg-gray-800/50 flex-shrink-0 transition-all group"
                      title={t.clickToAddToReferences}
                    >
                      <img
                        src={safeImage}
                        alt={`History ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-vis-cyan-500/0 group-hover:bg-vis-cyan-500/20 transition-all" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>


      {/* API Key Error Message */}
      {apiKeyError && (
        <div className={`rounded-xl p-4 mb-4 border backdrop-blur-sm ${
          apiKeyError === 'PLACEHOLDER_WARNING' 
            ? 'border-yellow-500/30 bg-yellow-900/20' 
            : 'border-red-500/30 bg-red-900/20'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              apiKeyError === 'PLACEHOLDER_WARNING' ? 'text-yellow-400' : 'text-red-400'
            }`} />
            <div className="flex-1">
              {apiKeyError === 'PROHIBITED_CONTENT' ? (
                <>
                  <p className="text-sm text-red-300 font-semibold mb-1">{t.prohibitedContent}</p>
                  <p className="text-xs text-red-200">{t.prohibitedContentMessage}</p>
                </>
              ) : apiKeyError === 'PLACEHOLDER_WARNING' ? (
                <>
                  <p className="text-sm text-yellow-300 font-semibold mb-1">{t.placeholderWarning}</p>
                  <p className="text-xs text-yellow-200">{t.placeholderWarningMessage}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-red-300 font-medium">{apiKeyError}</p>
                  <button
                    onClick={() => {
                      const event = new CustomEvent('openSettings');
                      window.dispatchEvent(event);
                    }}
                    className="mt-2 flex items-center text-xs text-vis-teal-400 hover:text-vis-teal-300 transition-colors"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Open Settings to configure API key
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Iterations Input - Hidden per user request */}

      {/* Generate Button - Hidden per user request */}

      {/* Image Settings Controls - Only show for Generate mode */}
      {selectedTool === 'generate' && (
        <div className="mt-3 p-4 rounded-xl border space-y-4 transition-colors shadow-lg" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--surface-border)' }}>
          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-semibold mb-2 block tracking-wide transition-colors" style={{ color: 'var(--text-primary)' }}>
              {t.aspectRatioLabel}
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg text-sm font-medium cursor-pointer transition-all shadow-sm focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-400/30 focus:outline-none"
              style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
            >
              <option value="auto">Auto</option>
              <option value="1:1">1:1 ({t.square})</option>
              <option value="21:9">21:9 ({t.ultrawide})</option>
              <option value="16:9">16:9 ({t.widescreen})</option>
              <option value="3:2">3:2 ({t.classicPhoto})</option>
              <option value="4:3">4:3 ({t.standard})</option>
              <option value="3:4">3:4 ({t.portrait})</option>
              <option value="2:3">2:3 ({t.classicPortrait})</option>
              <option value="9:16">9:16 ({t.vertical})</option>
              <option value="9:21">9:21 ({t.tall})</option>
            </select>
          </div>

          {/* Width Control */}
          <div className="rounded-lg p-3 border transition-colors" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-wide transition-colors" style={{ color: 'var(--text-primary)' }}>
                {t.width}
              </label>
              <input
                type="number"
                value={imageWidth}
                onChange={(e) => handleWidthChange(Math.max(64, Math.min(1536, parseInt(e.target.value) || 1024)))}
                className="w-16 h-8 px-2 border rounded-md text-sm font-medium text-center transition-all shadow-sm focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-400/30 focus:outline-none"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                min="64"
                max="1536"
              />
            </div>
            <input
              type="range"
              min="64"
              max="1536"
              step="64"
              value={imageWidth}
              onChange={(e) => handleWidthChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: widthSliderBackground
              }}
            />
          </div>

          {/* Height Control */}
          <div className="rounded-lg p-3 border transition-colors" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-wide transition-colors" style={{ color: 'var(--text-primary)' }}>
                {t.height}
              </label>
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => handleHeightChange(Math.max(64, Math.min(1536, parseInt(e.target.value) || 1024)))}
                className="w-16 h-8 px-2 border rounded-md text-sm font-medium text-center transition-all shadow-sm focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-400/30 focus:outline-none"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                min="64"
                max="1536"
              />
            </div>
            <input
              type="range"
              min="64"
              max="1536"
              step="64"
              value={imageHeight}
              onChange={(e) => handleHeightChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: heightSliderBackground
              }}
            />
          </div>

          {/* Seed Controls */}
          <div className="pt-3 border-t transition-colors" style={{ borderColor: 'var(--surface-border)' }}>
            <div className="rounded-lg p-3 border space-y-3 transition-colors" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}>
              <label className="text-xs font-semibold block tracking-wide transition-colors" style={{ color: 'var(--text-primary)' }}>
                {t.seed}
              </label>
              <input
                type="number"
                value={seed || 0}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
                disabled={randomSeed}
                className="w-full h-10 px-3 border rounded-lg text-sm font-medium transition-all shadow-sm focus:border-vis-teal-400 focus:ring-2 focus:ring-vis-teal-400/30 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRandomSeed(!randomSeed);
                    if (!randomSeed) setSeed(null);
                  }}
                  className={cn(
                    "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-medium text-sm",
                    randomSeed
                      ? "bg-gradient-to-br from-vis-cyan-400 to-vis-teal-500 text-white shadow-vis-glow-cyan"
                      : "bg-gray-900/90 border border-vis-border text-vis-text-secondary hover:text-vis-teal-300 hover:border-vis-border-light"
                  )}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,1,1-28-28A28,28,0,0,1,168,148Z"/>
                  </svg>
                  <span>{t.random}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRandomSeed(false);
                    setSeed(Math.floor(Math.random() * 4294967295));
                  }}
                  disabled={randomSeed}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-900/90 border border-vis-border rounded-lg text-sm text-vis-text-primary font-medium hover:text-vis-teal-300 hover:border-vis-border-light hover:bg-gray-800/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M240.49,175.51a12,12,0,0,1,0,17l-24,24a12,12,0,0,1-17-17L203,196h-2.09a76.17,76.17,0,0,1-61.85-31.83L97.38,105.78A52.1,52.1,0,0,0,55.06,84H32a12,12,0,0,1,0-24H55.06a76.17,76.17,0,0,1,61.85,31.83l41.71,58.39A52.1,52.1,0,0,0,200.94,172H203l-3.52-3.51a12,12,0,0,1,17-17Zm-95.62-72.62a12,12,0,0,0,16.93-1.13A52,52,0,0,1,200.94,84H203l-3.52,3.51a12,12,0,0,0,17,17l24-24a12,12,0,0,0,0-17l-24-24a12,12,0,0,0-17,17L203,60h-2.09a76,76,0,0,0-57.2,26A12,12,0,0,0,144.87,102.89Zm-33.74,50.22a12,12,0,0,0-16.93,1.13A52,52,0,0,1,55.06,172H32a12,12,0,0,0,0,24H55.06a76,76,0,0,0,57.2-26A12,12,0,0,0,111.13,153.11Z"/>
                  </svg>
                  <span>{t.shuffle}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-vis-text-secondary hover:text-vis-teal-300 transition-colors duration-200"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          {showAdvanced ? t.hideAdvancedControls : t.showAdvancedControls}
        </button>
        
        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-sm text-vis-text-secondary hover:text-red-400 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.clearSession}
        </button>
        
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-vis-border">
            <p className="text-xs text-vis-text-primary mb-3">
              {t.clearSessionConfirm}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSession}
                className="flex-1"
              >
                {t.yesClear}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border-vis-border hover:border-vis-teal-400 text-vis-text-primary hover:text-vis-teal-300"
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Temperature */}
            <div>
              <label className="text-xs text-vis-text-secondary mb-2 block">
                {t.creativity} ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800/50 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-vis-border flex-shrink-0">
        <h4 className="text-xs font-medium text-vis-text-secondary mb-2">{t.shortcuts}</h4>
        <div className="space-y-1 text-xs text-vis-text-muted">
          <div className="flex justify-between">
            <span>{t.saveImage}</span>
            <span>Ctrl + S</span>
          </div>
          <div className="flex justify-between">
            <span>{t.generate}</span>
            <span>Ctrl + Enter</span>
          </div>
          <div className="flex justify-between">
            <span>{t.startUpscaling}</span>
            <span>Ctrl + Alt + U</span>
          </div>
          <div className="flex justify-between">
            <span>{t.editMode}</span>
            <span>E</span>
          </div>
          <div className="flex justify-between">
            <span>{t.history}</span>
            <span>H</span>
          </div>
          <div className="flex justify-between">
            <span>{t.togglePanel}</span>
            <span>P</span>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>

    {/* Templates Modal */}
    <Dialog.Root open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/65 backdrop-blur-md z-50" />
        <Dialog.Content
          aria-describedby={templatesModalDescriptionId}
          className="fixed top-1/2 left-1/2 z-50 w-[min(95vw,80rem)] h-[90vh] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-vis-border-light bg-gradient-to-br from-gray-950 via-gray-900 to-gray-900 p-8 shadow-vis-glow-teal focus:outline-none flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vis-teal-600/20 text-vis-teal-300">
                <FileText className="h-4 w-4" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-vis-teal-200">
                {t.templates}
              </Dialog.Title>
              <Dialog.Description id={templatesModalDescriptionId} className="sr-only">
                {t.templates} — {t.viewTemplatePrompt}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/50">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
        
          <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-1">
            <TemplatesView onTemplateSelect={(templateInfo) => {
              setLastSelectedTemplate(templateInfo ?? null);
              setShowTemplatesModal(false);
            }} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />

    {/* Reference Images Modal */}
    <Dialog.Root open={showReferenceModal} onOpenChange={setShowReferenceModal}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 backdrop-blur-sm z-50 transition-colors',
            isDarkMode ? 'bg-black/60' : 'bg-black/30'
          )}
        />
        <Dialog.Content
          aria-describedby={referenceModalDescriptionId}
          className="fixed top-1/2 left-1/2 w-full max-w-2xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 transform rounded-2xl overflow-hidden border transition-colors shadow-lg z-[60]"
          style={{
            background: 'var(--modal-surface-background)',
            borderColor: 'var(--modal-surface-border)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b transition-colors"
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderColor: 'var(--surface-border)'
            }}
          >
            <div>
              <Dialog.Title className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {t.referenceImagesTitle}
              </Dialog.Title>
              <Dialog.Description id={referenceModalDescriptionId} className="sr-only">
                {t.referenceLibrary}: {t.uploadImageToGuideStyle}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition-colors hover:bg-gray-800"
                style={{ color: 'var(--text-primary)' }}
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div
            className="p-6 overflow-y-auto custom-scrollbar transition-colors"
            style={{ 
              maxHeight: 'calc(85vh - 140px)',
              backgroundColor: 'var(--surface-primary)'
            }}
          >
            {/* Current References */}
            {((selectedTool === 'generate' && uploadedImages.length > 0) ||
              (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {`${t.currentReferences} (${(selectedTool === 'generate' ? uploadedImages : editReferenceImages).length})`}
                </h3>
                <div
                  className={`flex gap-3 ${
                    (selectedTool === 'generate' ? uploadedImages : editReferenceImages).length > 3
                      ? 'overflow-x-auto custom-scrollbar pb-2'
                      : 'flex-wrap'
                  }`}
                  style={(selectedTool === 'generate' ? uploadedImages : editReferenceImages).length > 3 ? { maxHeight: '140px' } : {}}
                >
                  {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => {
                    const safeImage = sanitizeImageSrc(image);
                    if (!safeImage) {
                      return null;
                    }

                    return (
                      <div key={index} className="relative group flex-shrink-0">
                        <div className="w-24 h-24 rounded-lg border-2 overflow-hidden transition-colors border-green-500" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                          <img
                            src={safeImage}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <button
                          onClick={() => (selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                          #{index + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload New */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center transition-colors" style={{ color: 'var(--text-primary)' }}>
                <Upload className="h-4 w-4 mr-2 text-purple-500" />
                {t.uploadNewImage}
              </h3>
              <input
                type="file"
                id="reference-modal-upload"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('reference-modal-upload')?.click()}
                className="w-full py-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all group hover:opacity-80"
                style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}
              >
                <Plus className="h-6 w-6 mb-2 transition-colors text-purple-500 group-hover:text-purple-600" />
                <span className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  {t.clickToUploadImage}
                </span>
              </button>
            </div>

            {/* Recent Work */}
            {currentProject && currentProject.generations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  {t.recentWork}
                </h3>
                <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {currentProject.generations
                    .filter(gen => gen.outputAssets && gen.outputAssets.length > 0)
                    .slice(0, 20)
                    .flatMap((generation) =>
                      generation.outputAssets.map((asset, assetIdx) => {
                        const safeImage = sanitizeImageSrc(asset.url);
                        if (!safeImage) {
                          return null;
                        }

                        return (
                          <button
                            key={`${generation.id}-${assetIdx}`}
                            onClick={() => {
                              if (selectedTool === 'generate') {
                                addUploadedImage(asset.url);
                              } else {
                                addEditReferenceImage(asset.url);
                              }
                            }}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105"
                            style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}
                          >
                            <img
                              src={safeImage}
                              alt="Generated"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded font-medium bg-purple-500">
                              {t.genLabel}
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          </button>
                        );
                      })
                    )}
                </div>
              </div>
            )}

            {/* Upload History */}
            {uploadHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {`${t.previousUploads} (${uploadHistory.length})`}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {uploadHistory
                    .filter(img => {
                      const currentImages = selectedTool === 'generate' ? uploadedImages : editReferenceImages;
                      return !currentImages.includes(img);
                    })
                    .map((image, index) => {
                      const safeImage = sanitizeImageSrc(image);
                      if (!safeImage) {
                        return null;
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (selectedTool === 'generate') {
                              addUploadedImage(image);
                            } else {
                              addEditReferenceImage(image);
                            }
                          }}
                          className="relative aspect-square rounded-lg border-2 overflow-hidden transition-all group"
                          style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--surface-border)' }}
                        >
                          <img
                            src={safeImage}
                            alt={`History ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 transition-all flex items-center justify-center bg-purple-500/0 group-hover:bg-purple-500/20">
                            <Plus className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </button>
                      );
                    })}
                </div>
                {uploadHistory.filter(img => {
                  const currentImages = selectedTool === 'generate' ? uploadedImages : editReferenceImages;
                  return !currentImages.includes(img);
                }).length === 0 && (
                  <p className={cn('text-sm text-center py-6', isDarkMode ? 'text-vis-text-muted' : 'text-purple-600')}>
                    {t.allImagesAdded}
                  </p>
                )}
              </div>
            )}

            {uploadHistory.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl transition-colors" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                  📁
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {t.noUploadHistoryYet}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {t.uploadImageToSeeHistory}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 border-t transition-colors"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--surface-border)'
            }}
          >
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              {t.unlimitedUploads}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
};