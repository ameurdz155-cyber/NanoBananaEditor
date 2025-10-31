import React, { useState } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw, AlertCircle, Settings, FileText, Sparkles, X, Check, Upload, History, Plus } from 'lucide-react';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';
import { validateApiKey, improvePromptText } from '../services/geminiService';
import { TemplatesView } from './TemplatesView';
import * as Dialog from '@radix-ui/react-dialog';
import { getTranslation } from '../i18n/translations';

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
    uploadedImages,
    addUploadedImage,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    addEditReferenceImage,
    removeEditReferenceImage,
    clearEditReferenceImages,
    canvasImage,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
    apiKeyError,
    setApiKeyError,
    language,
    promptHistory,
    addToPromptHistory,
    deletePromptFromHistory,
  } = useAppStore();

  const t = getTranslation(language);

  const { generate, cancelGeneration } = useImageGeneration();
  const { edit, cancelEdit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [lastSelectedTemplate, setLastSelectedTemplate] = useState<{ name: string; image?: string; emoji?: string } | null>(null);
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageWidth, setImageWidth] = useState<number>(1024);
  const [imageHeight, setImageHeight] = useState<number>(1024);
  const [randomSeed, setRandomSeed] = useState<boolean>(true);

  // Update width/height when aspect ratio changes
  const handleAspectRatioChange = (newRatio: string) => {
    setAspectRatio(newRatio);
    const [w, h] = newRatio.split(':').map(Number);
    const ratio = w / h;
    
    // Keep width, adjust height
    const newHeight = Math.round(imageWidth / ratio / 64) * 64;
    setImageHeight(Math.max(64, Math.min(1536, newHeight)));
  };

  // Update height when width changes (maintain aspect ratio)
  const handleWidthChange = (newWidth: number) => {
    setImageWidth(newWidth);
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    const newHeight = Math.round(newWidth / ratio / 64) * 64;
    setImageHeight(Math.max(64, Math.min(1536, newHeight)));
  };

  // Update width when height changes (maintain aspect ratio)
  const handleHeightChange = (newHeight: number) => {
    setImageHeight(newHeight);
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    const newWidth = Math.round(newHeight * ratio / 64) * 64;
    setImageWidth(Math.max(64, Math.min(1536, newWidth)));
  };

  // Clean up images when switching tools
  React.useEffect(() => {
    // When switching away from mask mode, clear brush strokes
    // This ensures a clean state when switching tools
    return () => {
      // Cleanup if needed
    };
  }, [selectedTool]);


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
      setImprovedPrompt(improved);
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
    
    // Check if prompt contains {prompt} or {photo} placeholders
    if (currentPrompt.includes('{prompt}') || currentPrompt.includes('{photo}')) {
      setApiKeyError('PLACEHOLDER_WARNING');
      return;
    }
    
    // Clear previous errors
    setApiKeyError(null);
    
    // Validate API key before generating
    setIsValidating(true);
    const validation = await validateApiKey();
    setIsValidating(false);
    
    if (!validation.valid) {
      setApiKeyError(validation.error || 'Invalid API key. Please check Settings.');
      return;
    }
    
    // Add to history
    addToPromptHistory(currentPrompt);
    
    if (selectedTool === 'generate') {
      const referenceImages = uploadedImages
        .filter(img => img.includes('base64,'))
        .map(img => img.split('base64,')[1]);
      
      generate({
        prompt: currentPrompt,
        negativePrompt: undefined,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        temperature,
        seed: seed || undefined,
        aspectRatio,
        width: imageWidth,
        height: imageHeight
      });
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      edit(currentPrompt);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // Read file as data URL (includes the data:image/...;base64, prefix)
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          if (selectedTool === 'generate') {
            // Add to reference images (max 2)
            if (uploadedImages.length < 2) {
              addUploadedImage(dataUrl);
            }
          } else if (selectedTool === 'edit') {
            // For edit mode, add to separate edit reference images (max 2)
            if (editReferenceImages.length < 2) {
              addEditReferenceImage(dataUrl);
            }
            // Set as canvas image if none exists
            if (!canvasImage) {
              setCanvasImage(dataUrl);
            }
          } else if (selectedTool === 'mask') {
            // For mask mode, set as canvas image immediately
            clearUploadedImages();
            addUploadedImage(dataUrl);
            setCanvasImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
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

  const tools = [
    { id: 'generate', icon: Wand2, label: t.generate, description: t.createFromText },
    { id: 'edit', icon: Edit3, label: t.edit, description: t.modifyExisting },
    { id: 'mask', icon: MousePointer, label: t.select, description: t.clickToSelect },
  ] as const;

  if (!showPromptPanel) {
    return (
      <div className="w-8 bg-gray-950 border-r border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowPromptPanel(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-r-lg border border-l-0 border-gray-700 flex items-center justify-center transition-colors group"
          title={t.showPromptPanel}
        >
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="w-80 lg:w-72 xl:w-80 h-full bg-gray-950 border-r border-gray-800 p-6 flex flex-col space-y-6 overflow-y-auto sidebar-scrollbar">
      <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">{t.selectMode}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t.chooseHowToCreate}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHintsModal(true)}
              className="h-7 w-7 hover:bg-gray-800"
              title={t.promptTips}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromptPanel(false)}
              className="h-7 w-7 hover:bg-gray-800"
              title={t.hidePromptPanel}
            >
              ×
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
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
              )}
            >
              {selectedTool === tool.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse" />
              )}
              <tool.icon className={cn(
                "h-5 w-5 mb-2 relative z-10 transition-colors",
                selectedTool === tool.id ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              )} />
              <span className={cn(
                "text-xs font-semibold relative z-10 transition-colors",
                selectedTool === tool.id ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-300'
              )}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Template Selector */}
      <div className="rounded-xl border border-gray-800/50 bg-gray-950/80">
        <button
          type="button"
          onClick={() => setShowTemplatesModal(true)}
          className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-left transition-all hover:bg-gray-900/40"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800/50 bg-gray-900 text-gray-400 overflow-hidden">
              {lastSelectedTemplate?.image ? (
                <img 
                  src={lastSelectedTemplate.image} 
                  alt={lastSelectedTemplate.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = lastSelectedTemplate.emoji 
                        ? `<span class="text-lg">${lastSelectedTemplate.emoji}</span>`
                        : `<span class="text-lg font-bold text-purple-400">${lastSelectedTemplate.name.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : lastSelectedTemplate?.emoji ? (
                <span className="text-lg">{lastSelectedTemplate.emoji}</span>
              ) : lastSelectedTemplate ? (
                <span className="text-lg font-bold text-purple-400">
                  {lastSelectedTemplate.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-gray-100">
                {lastSelectedTemplate?.name || t.templates}
              </span>
              <span className="text-[11px] text-gray-500">
                {lastSelectedTemplate ? t.templates : t.clickToManageTemplates}
              </span>
            </div>
          </div>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-gray-500 transition-all",
            showTemplatesModal && "rotate-180 border-gray-700 bg-gray-900 text-gray-200"
          )}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Prompt Input - Enhanced Card Design */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"></span>
            {selectedTool === 'generate' ? t.generateFromText : t.editInstructions}
          </label>
          <button 
            onClick={() => setShowHintsModal(true)}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            title={t.promptTips}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        {/* Mode-specific help text */}
        <div className="mb-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
          {selectedTool === 'generate' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <Sparkles className="h-3 w-3 mr-1.5" />
                {t.generateModeTitle}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.generateModeDescription}
              </p>
              <p className="text-xs text-purple-400 italic">
                {t.generateModeTip}
              </p>
            </div>
          )}
          
          {selectedTool === 'edit' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <Edit3 className="h-3 w-3 mr-1.5" />
                {t.editModeTitle}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.editModeDescription}
              </p>
            </div>
          )}
          
          {selectedTool === 'mask' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <MousePointer className="h-3 w-3 mr-1.5" />
                {t.selectModeTitle}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.selectModeDescription}
              </p>
              <p className="text-xs text-orange-400">
                {t.selectModeWarning}
              </p>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mb-3">
          {selectedTool === 'generate' 
            ? t.enterPromptAndInvoke
            : t.describeChanges}
        </p>
        
        {/* Textarea with History Button */}
        <div className="relative">
          <Textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder={
              selectedTool === 'generate'
                ? t.promptPlaceholderGenerate
                : t.promptPlaceholderEdit
            }
            className="min-h-[120px] resize-none bg-gray-800 border-gray-700 focus:border-purple-500 transition-colors pr-12"
          />
          
          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowPromptHistory(!showPromptHistory)}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-lg transition-all duration-200",
              "hover:bg-gray-700/50 border-2",
              showPromptHistory 
                ? "bg-red-500/20 border-red-500 text-red-400" 
                : "bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-600"
            )}
            title="Prompt History"
            disabled={promptHistory.length === 0}
          >
            <History className="h-4 w-4" />
          </button>
          

        </div>
        

        {/* Improve Prompt Button */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprovePrompt}
            disabled={!currentPrompt.trim() && !isImproving}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-purple-500/30"
          >
            {isImproving ? (
              <>
                <X className="h-3 w-3 mr-2" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                <span>{t.improvePrompt}</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Improved Prompt Modal */}
        <Dialog.Root open={!!improvedPrompt} onOpenChange={(open) => !open && handleRejectImprovedPrompt()}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-purple-500/30 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {t.improvedPromptTitle}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>
              
              <div className="space-y-4">
                {/* Original Prompt */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.originalPrompt}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{currentPrompt}</p>
                </div>
                
                {/* Improved Prompt */}
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                  <h4 className="text-xs font-semibold text-purple-300 mb-2 uppercase tracking-wider">{t.improvedVersion}</h4>
                  <Textarea
                    value={improvedPrompt || ''}
                    onChange={(e) => setImprovedPrompt(e.target.value)}
                    className="min-h-[120px] resize-none bg-gray-800/50 border-purple-500/30 focus:border-purple-500 text-gray-200 text-sm leading-relaxed"
                    placeholder="Improved prompt will appear here..."
                  />
                  <p className="text-xs text-gray-400 mt-2">{t.canEditImproved}</p>
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
                    className="flex-1 border-gray-600 hover:bg-gray-800"
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
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400">{t.needsMoreDetail}</span>
              </>
            ) : currentPrompt.length < 50 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-400">{t.goodPrompt}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-green-400">{t.excellentPrompt}</span>
              </>
            )}
          </div>
          <span className="text-gray-500">{currentPrompt.length} {t.characters}</span>
        </div>
      </div>

      {/* Reference Images Upload */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all flex-shrink-0">
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
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => (
              <div 
                key={index} 
                className="relative group w-14 h-14 rounded-lg border-2 border-gray-700 hover:border-red-500 overflow-hidden bg-gray-800 flex-shrink-0 transition-all"
              >
                <img
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t.removeImage}
                >
                  <X className="h-5 w-5 text-red-400" />
                </button>
              </div>
            ))}
            {/* Add more button */}
            {((selectedTool === 'generate' && uploadedImages.length < 2) ||
              (selectedTool === 'edit' && editReferenceImages.length < 2)) && (
              <button
                onClick={() => document.getElementById('reference-image-upload')?.click()}
                className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-center transition-all text-gray-500 hover:text-gray-300"
                title="Add more images"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 mr-2"></span>
            {selectedTool === 'generate' ? t.addReferenceImages : selectedTool === 'edit' ? t.styleReferences : t.uploadImage}
          </label>
          {((selectedTool === 'generate' && uploadedImages.length > 0) ||
            (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
            <button
              onClick={() => document.getElementById('reference-image-upload')?.click()}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Upload className="h-3 w-3" />
              {t.upload}
            </button>
          )}
        </div>
        
        {selectedTool === 'mask' && (
          <p className="text-xs text-gray-500 mb-3">
            {t.uploadImageForMaskPainting}
          </p>
        )}
        {selectedTool === 'edit' && (
          <p className="text-xs text-gray-500 mb-3">
            {canvasImage ? t.optionalStyleReferencesUpTo2 : t.uploadImageForEditUpTo2}
          </p>
        )}
        {selectedTool === 'generate' && (
          <p className="text-xs text-gray-500 mb-3">
            {t.uploadReferenceImagesUpTo2}
          </p>
        )}

        {/* Empty state */}
        {((selectedTool === 'generate' && uploadedImages.length === 0) ||
          (selectedTool === 'edit' && editReferenceImages.length === 0)) && (
          <button
            onClick={() => document.getElementById('reference-image-upload')?.click()}
            className="w-full py-6 flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 border-dashed hover:border-gray-600 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 mb-3 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">
              📁
            </div>
            <div className="text-xs text-gray-500">Upload Images</div>
          </button>
        )}
      </div>


      {/* API Key Error Message */}
      {apiKeyError && (
        <div className={`glass rounded-xl p-4 mb-4 ${
          apiKeyError === 'PLACEHOLDER_WARNING' 
            ? 'border border-yellow-500/30 bg-yellow-900/20' 
            : 'border border-red-500/30 bg-red-900/20'
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
                    className="mt-2 flex items-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
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

      {/* Generate Button - Inspired by Reference UI */}
      <div className="space-y-2 flex-shrink-0">
        <Button
          onClick={handleGenerate}
          disabled={isValidating || (!isGenerating && !currentPrompt.trim())}
          className="relative w-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          size="lg"
        >
          {isValidating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              <span className="text-white">{t.validating}</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center">
              <X className="h-5 w-5 mr-2" />
              <span className="text-white">{t.stopGeneration}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Wand2 className="h-5 w-5 mr-2" />
              <span className="text-white">
                {selectedTool === 'generate' ? t.invoke : t.applyEdit}
              </span>
            </div>
          )}
        </Button>
        <p className="text-xs text-center text-gray-500">
          {t.pressCtrlEnter}
        </p>
      </div>

      {/* Image Settings Controls - Only show for Generate mode */}
      {selectedTool === 'generate' && (
        <div className="mt-3 p-4 bg-gradient-to-br from-gray-900/40 to-gray-800/40 rounded-xl border border-gray-700/40 space-y-4 backdrop-blur-sm">
          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-semibold text-gray-200 mb-2 block tracking-wide">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(e.target.value)}
              className="w-full h-10 px-3 bg-gray-900/90 border border-gray-700/60 rounded-lg text-sm text-gray-100 font-medium cursor-pointer hover:border-gray-600/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-sm"
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="3:2">3:2 (Classic Photo)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="3:4">3:4 (Portrait)</option>
              <option value="2:3">2:3 (Classic Portrait)</option>
              <option value="9:16">9:16 (Vertical)</option>
              <option value="9:21">9:21 (Tall)</option>
            </select>
          </div>

          {/* Width Control */}
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-200 tracking-wide">Width</label>
              <input
                type="number"
                value={imageWidth}
                onChange={(e) => handleWidthChange(Math.max(64, Math.min(1536, parseInt(e.target.value) || 1024)))}
                className="w-16 h-8 px-2 bg-gray-900/90 border border-gray-700/60 rounded-md text-sm text-gray-100 font-medium text-center hover:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-sm"
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
              className="w-full h-2 bg-gray-700/40 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((imageWidth - 64) / (1536 - 64)) * 100}%, rgb(55, 65, 81) ${((imageWidth - 64) / (1536 - 64)) * 100}%, rgb(55, 65, 81) 100%)`
              }}
            />
          </div>

          {/* Height Control */}
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-200 tracking-wide">Height</label>
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => handleHeightChange(Math.max(64, Math.min(1536, parseInt(e.target.value) || 1024)))}
                className="w-16 h-8 px-2 bg-gray-900/90 border border-gray-700/60 rounded-md text-sm text-gray-100 font-medium text-center hover:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all shadow-sm"
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
              className="w-full h-2 bg-gray-700/40 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((imageHeight - 64) / (1536 - 64)) * 100}%, rgb(55, 65, 81) ${((imageHeight - 64) / (1536 - 64)) * 100}%, rgb(55, 65, 81) 100%)`
              }}
            />
          </div>

          {/* Seed Controls */}
          <div className="pt-3 border-t border-gray-700/40">
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20 space-y-3">
              <label className="text-xs font-semibold text-gray-200 block tracking-wide">{t.seed}</label>
              <input
                type="number"
                value={seed || 0}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
                disabled={randomSeed}
                className="w-full h-10 px-3 bg-gray-900/90 border border-gray-700/60 rounded-lg text-sm text-gray-100 font-medium hover:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
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
                      ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"
                      : "bg-gray-900/90 border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                  )}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,1,1-28-28A28,28,0,0,1,168,148Z"/>
                  </svg>
                  <span>{t.random || 'Random'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRandomSeed(false);
                    setSeed(Math.floor(Math.random() * 4294967295));
                  }}
                  disabled={randomSeed}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-900/90 border border-gray-700/60 rounded-lg text-sm text-gray-300 font-medium hover:text-gray-100 hover:border-gray-600 hover:bg-gray-800/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M240.49,175.51a12,12,0,0,1,0,17l-24,24a12,12,0,0,1-17-17L203,196h-2.09a76.17,76.17,0,0,1-61.85-31.83L97.38,105.78A52.1,52.1,0,0,0,55.06,84H32a12,12,0,0,1,0-24H55.06a76.17,76.17,0,0,1,61.85,31.83l41.71,58.39A52.1,52.1,0,0,0,200.94,172H203l-3.52-3.51a12,12,0,0,1,17-17Zm-95.62-72.62a12,12,0,0,0,16.93-1.13A52,52,0,0,1,200.94,84H203l-3.52,3.51a12,12,0,0,0,17,17l24-24a12,12,0,0,0,0-17l-24-24a12,12,0,0,0-17,17L203,60h-2.09a76,76,0,0,0-57.2,26A12,12,0,0,0,144.87,102.89Zm-33.74,50.22a12,12,0,0,0-16.93,1.13A52,52,0,0,1,55.06,172H32a12,12,0,0,0,0,24H55.06a76,76,0,0,0,57.2-26A12,12,0,0,0,111.13,153.11Z"/>
                  </svg>
                  <span>Shuffle</span>
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
          className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          {showAdvanced ? t.hideAdvancedControls : t.showAdvancedControls}
        </button>
        
        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.clearSession}
        </button>
        
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-300 mb-3">
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
                className="flex-1"
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
              <label className="text-xs text-gray-400 mb-2 block">
                {t.creativity} ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Seed */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                {t.seed}
              </label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={t.random}
                className="w-full h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-gray-800 flex-shrink-0">
        <h4 className="text-xs font-medium text-gray-400 mb-2">{t.shortcuts}</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>{t.saveImage}</span>
            <span>Ctrl + S</span>
          </div>
          <div className="flex justify-between">
            <span>{t.generate}</span>
            <span>Ctrl + Enter</span>
          </div>
          <div className="flex justify-between">
            <span>{t.reRoll}</span>
            <span>Shift + R</span>
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

    {/* Templates Modal */}
    <Dialog.Root open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,26rem)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-900 p-5 shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
                <FileText className="h-4 w-4" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-100">
                {t.templates}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {t.clickToManageTemplates}
          </p>
          <div className="mt-4 h-[60vh] flex min-h-0">
            <TemplatesView onTemplateSelect={(templateInfo) => {
              setLastSelectedTemplate(templateInfo);
              setShowTemplatesModal(false);
            }} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />

    {/* Prompt History Modal */}
    <Dialog.Root open={showPromptHistory} onOpenChange={(open) => {
      setShowPromptHistory(open);
      if (!open) setHistorySearchQuery('');
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border-2 border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden z-50 shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-800/80 to-gray-800/60 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <Dialog.Title className="text-lg font-semibold text-gray-200 flex items-center">
                <History className="h-5 w-5 mr-3 text-red-400" />
                {t.promptHistory}
              </Dialog.Title>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {promptHistory.filter(p => 
                    historySearchQuery.trim() === '' || 
                    p.toLowerCase().includes(historySearchQuery.toLowerCase())
                  ).length} {t.prompts}
                </span>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchPrompts}
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800/70 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-800 transition-all"
                autoFocus
              />
              <svg 
                className="absolute left-3 top-3 h-4 w-4 text-gray-500"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Prompts List */}
          <div className="max-h-[calc(85vh-180px)] overflow-y-auto custom-scrollbar p-4">
            {promptHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-5xl">📝</div>
                </div>
                <h4 className="text-base font-medium text-gray-400 mb-2">{t.noPromptHistoryRecorded}</h4>
                <p className="text-sm text-gray-600">{t.promptsWillAppearHere}</p>
              </div>
            ) : promptHistory
              .filter(prompt => 
                historySearchQuery.trim() === '' || 
                prompt.toLowerCase().includes(historySearchQuery.toLowerCase())
              )
              .length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-base text-gray-400 mb-2">{t.noPromptsFound}</p>
                <p className="text-sm text-gray-600">{t.tryDifferentSearch}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {promptHistory
                  .filter(prompt => 
                    historySearchQuery.trim() === '' || 
                    prompt.toLowerCase().includes(historySearchQuery.toLowerCase())
                  )
                  .map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPrompt(prompt);
                        setShowPromptHistory(false);
                        setHistorySearchQuery('');
                      }}
                      className="w-full text-left p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-purple-400/80 uppercase tracking-wide">
                          Prompt #{promptHistory.length - index}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(prompt);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-opacity p-1 rounded hover:bg-gray-700/50"
                            title={t.copyToClipboard}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePromptFromHistory(index);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1 rounded hover:bg-red-500/10"
                            title={t.deletePrompt}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 group-hover:text-gray-100 leading-relaxed mb-2">
                        {prompt}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                        <span className="text-xs text-gray-500">{t.clickToUsePrompt}</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-700/50 rounded border border-gray-600/50 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Enter
                        </kbd>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {promptHistory.length > 0 && (
            <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 text-center">
                {t.clickPromptToReuse} • <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded border border-gray-600">Esc</kbd> {t.escToClose}
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
};