import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/useAppStore';
import {
  History,
  Layers,
  Folder,
  Download,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Generation, Edit } from '../types';
import { BoardsView } from './BoardsView';
import { getTranslation } from '../i18n/translations';
import { getImageById } from '../utils/galleryStorage';
import { saveImageWithDialog } from '../utils/fileSaver';

export const HistoryPanel: React.FC = () => {
  const {
    currentProject,
    selectedGenerationId,
    selectedEditId,
    selectGeneration,
    selectEdit,
    showHistory,
    setShowHistory,
    setCanvasImage,
    setCurrentPrompt,
    language,
    boards,
    selectedTool,
    addUploadedImage,
    addEditReferenceImage,
    addImageToBoard,
    removeImageFromBoard,
    deleteGeneration,
    deleteEdit,
    toggleFavoriteImage,
    isFavoriteImage,
    setActivePrimarySection,
    setSelectedTool,
    setSeed,
    setTemperature,
    setLastGenerationParameters,
  } = useAppStore();

  const t = getTranslation(language);

  const [activeTab, setActiveTab] = React.useState<'history' | 'boards'>('boards');

  const [previewModal, setPreviewModal] = React.useState<{
    open: boolean;
    imageUrl: string;
    title: string;
    description?: string;
    metadata?: {
      timestamp?: number;
      aspectRatio?: string;
      seed?: number | null;
      temperature?: number;
      negativePrompt?: string;
      maskUsed?: boolean;
      width?: number;
      height?: number;
      referenceCount?: number;
      iterationIndex?: number;
      totalIterations?: number;
    };
  }>({
    open: false,
    imageUrl: '',
    title: '',
    description: '',
    metadata: undefined
  });

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];

  const [galleryImages, setGalleryImages] = React.useState<Record<string, string>>({});
  const [imageContextMenu, setImageContextMenu] = React.useState<{
    open: boolean;
    x: number;
    y: number;
    type: 'generation' | 'edit' | null;
    itemId: string | null;
    imageUrl: string;
  }>({ open: false, x: 0, y: 0, type: null, itemId: null, imageUrl: '' });
  const imageMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [showBoardPicker, setShowBoardPicker] = React.useState(false);

  const closeContextMenu = React.useCallback(() => {
    setImageContextMenu(prev => prev.open ? { ...prev, open: false } : prev);
    setShowBoardPicker(false);
  }, []);

  const currentGeneration = React.useMemo(() => {
    if (imageContextMenu.type !== 'generation' || !imageContextMenu.itemId) {
      return null;
    }
    return generations.find(g => g.id === imageContextMenu.itemId) || null;
  }, [generations, imageContextMenu.itemId, imageContextMenu.type]);

  const currentEdit = React.useMemo(() => {
    if (imageContextMenu.type !== 'edit' || !imageContextMenu.itemId) {
      return null;
    }
    return edits.find(e => e.id === imageContextMenu.itemId) || null;
  }, [edits, imageContextMenu.itemId, imageContextMenu.type]);

  const parentGeneration = React.useMemo(() => {
    if (!currentEdit?.parentGenerationId) return null;
    return generations.find(g => g.id === currentEdit.parentGenerationId) || null;
  }, [currentEdit, generations]);

  const promptText = React.useMemo(() => {
    if (currentGeneration?.prompt) return currentGeneration.prompt;
    if (currentEdit?.instruction) return currentEdit.instruction;
    return '';
  }, [currentEdit, currentGeneration]);

  const isFavorite = React.useMemo(() => {
    if (!imageContextMenu.itemId) return false;
    return isFavoriteImage(imageContextMenu.itemId);
  }, [imageContextMenu.itemId, isFavoriteImage]);

  const MenuSection = ({ title }: { title: string }) => (
    <div className="px-3 pt-2 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </span>
    </div>
  );

  interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    trailing?: React.ReactNode;
    destructive?: boolean;
  }

  const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, disabled, trailing, destructive }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      className={cn(
        'w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-colors',
        disabled
          ? 'text-gray-500 cursor-not-allowed'
          : destructive
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            : 'text-gray-200 hover:bg-gray-900'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  );

  const openMetadata = React.useCallback(
    (type: 'generation' | 'edit', itemId: string, fallbackUrl?: string) => {
      if (type === 'generation') {
        const generation = generations.find(g => g.id === itemId);
        if (!generation) return;
        const index = generations.findIndex(g => g.id === generation.id);
        setPreviewModal({
          open: true,
          imageUrl: fallbackUrl || generation.outputAssets[0]?.url || '',
          title: index >= 0 ? `Generation #${index + 1}` : t.viewDetails,
          description: generation.prompt,
          metadata: {
            timestamp: generation.timestamp,
            aspectRatio: generation.parameters?.aspectRatio,
            width: generation.parameters?.width,
            height: generation.parameters?.height,
            seed: generation.parameters?.seed,
            temperature: generation.parameters?.temperature,
            negativePrompt: generation.negativePrompt,
            referenceCount: generation.parameters?.referenceCount,
            iterationIndex: generation.parameters?.iterationIndex,
            totalIterations: generation.parameters?.totalIterations
          }
        });
        return;
      }

      const edit = edits.find(e => e.id === itemId);
      if (!edit) return;
      const index = edits.findIndex(e => e.id === edit.id);
      setPreviewModal({
        open: true,
        imageUrl: fallbackUrl || edit.outputAssets[0]?.url || '',
        title: index >= 0 ? `Edit #${index + 1}` : t.viewDetails,
        description: edit.instruction,
        metadata: {
          timestamp: edit.timestamp,
          maskUsed: !!edit.maskAssetId
        }
      });
    },
    [edits, generations, setPreviewModal, t.viewDetails]
  );

  const locateImage = React.useCallback(
    (type: 'generation' | 'edit', itemId: string) => {
      setActiveTab('history');
      setShowHistory(true);
      if (type === 'generation') {
        selectGeneration(itemId);
        selectEdit(null);
      } else {
        selectEdit(itemId);
        selectGeneration(null);
      }
    },
    [selectEdit, selectGeneration, setActiveTab, setShowHistory]
  );

  const handleSetCanvasImage = () => {
    if (!imageContextMenu.imageUrl) return;
    setCanvasImage(imageContextMenu.imageUrl, 'history');
    closeContextMenu();
  };

  const handleOpenCanvasWorkspace = () => {
    if (!imageContextMenu.imageUrl) return;
    setCanvasImage(imageContextMenu.imageUrl, 'history');
    setActivePrimarySection('canvas');
    closeContextMenu();
  };

  const handleAddAsReference = () => {
    if (!imageContextMenu.imageUrl) return;
    if (selectedTool === 'edit') {
      addEditReferenceImage(imageContextMenu.imageUrl);
    } else {
      addUploadedImage(imageContextMenu.imageUrl);
    }
    closeContextMenu();
  };

  const handleAsMaskLayer = () => {
    if (!imageContextMenu.imageUrl) return;
    addEditReferenceImage(imageContextMenu.imageUrl);
    setSelectedTool('mask');
    setActivePrimarySection('canvas');
    closeContextMenu();
  };

  const handleLoadWorkflow = () => {
    console.info('Load workflow requested for image', imageContextMenu.itemId);
    closeContextMenu();
  };

  const handleRecallMetadata = () => {
    const source = currentGeneration || parentGeneration;
    if (!source) {
      closeContextMenu();
      return;
    }

    const params = source.parameters;
    if (params?.width && params?.height) {
      setLastGenerationParameters({
        width: params.width,
        height: params.height,
        aspectRatio: params.aspectRatio
      });
    }
    if (typeof params?.seed === 'number') {
      setSeed(params.seed);
    }
    if (typeof params?.temperature === 'number') {
      setTemperature(params.temperature);
    }
    if (source.prompt) {
      setCurrentPrompt(source.prompt);
    }
    closeContextMenu();
  };

  const handleMetadataOverview = () => {
    if (!imageContextMenu.type || !imageContextMenu.itemId) {
      closeContextMenu();
      return;
    }
    openMetadata(imageContextMenu.type, imageContextMenu.itemId, imageContextMenu.imageUrl);
    closeContextMenu();
  };

  const handleSendToUpscale = () => {
    if (!imageContextMenu.imageUrl) return;
    setCanvasImage(imageContextMenu.imageUrl, 'upscale');
    setActivePrimarySection('upscaling');
    closeContextMenu();
  };

  const handleUseForPromptTemplate = () => {
    if (!promptText) {
      closeContextMenu();
      return;
    }
    setCurrentPrompt(promptText);
    setActivePrimarySection('generate');
    closeContextMenu();
  };

  const handleNewCanvasFromImage = () => {
    if (!imageContextMenu.imageUrl) return;
    setCanvasImage(imageContextMenu.imageUrl, 'history');
    setSelectedTool('edit');
    setActivePrimarySection('canvas');
    closeContextMenu();
  };

  const handleBoardSelection = (boardId: string, alreadyInBoard: boolean) => {
    if (!imageContextMenu.itemId) return;
    if (alreadyInBoard) {
      removeImageFromBoard(boardId, imageContextMenu.itemId);
    } else {
      addImageToBoard(boardId, imageContextMenu.itemId);
    }
    setShowBoardPicker(false);
    closeContextMenu();
  };

  const handleToggleFavorite = () => {
    if (!imageContextMenu.itemId) return;
    toggleFavoriteImage(imageContextMenu.itemId);
    closeContextMenu();
  };

  const handleLocateInGallery = () => {
    if (!imageContextMenu.itemId || !imageContextMenu.type) return;
    locateImage(imageContextMenu.type, imageContextMenu.itemId);
    closeContextMenu();
  };

  const handleCopyPrompt = async () => {
    if (!promptText) {
      closeContextMenu();
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
    } catch (error) {
      console.warn('Failed to copy prompt to clipboard:', error);
    }
    closeContextMenu();
  };

  const handleDownloadImage = () => {
    if (!imageContextMenu.imageUrl) return;
    void saveImageWithDialog(imageContextMenu.imageUrl, `${imageContextMenu.type || 'image'}-image`);
    closeContextMenu();
  };

  const handleRemoveImage = () => {
    if (imageContextMenu.type === 'generation' && imageContextMenu.itemId) {
      deleteGeneration(imageContextMenu.itemId);
    }
    if (imageContextMenu.type === 'edit' && imageContextMenu.itemId) {
      deleteEdit(imageContextMenu.itemId);
    }
    setPreviewModal(prev => prev.imageUrl === imageContextMenu.imageUrl ? { ...prev, open: false } : prev);
    closeContextMenu();
  };

  // Load gallery images from IndexedDB on mount and when boards change
  useEffect(() => {
    const loadGalleryImages = async () => {
      const imageMap: Record<string, string> = {};
      
      // Get all image IDs from all boards
      const allImageIds = boards.flatMap(board => board.imageIds);
      
      // Fetch each image from IndexedDB
      for (const imageId of allImageIds) {
        const image = await getImageById(imageId);
        if (image) {
          imageMap[imageId] = image.url;
        }
      }
      
      setGalleryImages(imageMap);
    };
    
    loadGalleryImages();
    
    // Listen for gallery updates
    const handleGalleryUpdate = () => {
      console.log('Gallery updated, reloading images...');
      loadGalleryImages();
    };
    
    window.addEventListener('galleryUpdated', handleGalleryUpdate);
    return () => window.removeEventListener('galleryUpdated', handleGalleryUpdate);
  }, [boards]);

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      if (event.button !== 0) return;
      closeContextMenu();
    };
    const handleScroll = () => closeContextMenu();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    window.addEventListener('pointerdown', handlePointer);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('keydown', handleKey);
    };
  }, [closeContextMenu]);

  React.useLayoutEffect(() => {
    if (!imageContextMenu.open || !imageMenuRef.current) return;
    const rect = imageMenuRef.current.getBoundingClientRect();
    const padding = 12;
    const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
    const maxY = Math.max(padding, window.innerHeight - rect.height - padding);
    const clampedX = Math.min(Math.max(padding, imageContextMenu.x), maxX);
    const clampedY = Math.min(Math.max(padding, imageContextMenu.y), maxY);
    if (clampedX !== imageContextMenu.x || clampedY !== imageContextMenu.y) {
      setImageContextMenu(prev => ({ ...prev, x: clampedX, y: clampedY }));
    }
  }, [imageContextMenu.open, imageContextMenu.x, imageContextMenu.y]);

  const resolveImageUrl = React.useCallback((imageId: string) => {
    if (imageId.startsWith('data:') || imageId.startsWith('blob:') || imageId.startsWith('http')) {
      return imageId;
    }

    // Check gallery images first (from IndexedDB)
    if (galleryImages[imageId]) {
      return galleryImages[imageId];
    }

    const generation = generations.find(g => g.id === imageId);
    if (generation?.outputAssets[0]?.url) {
      return generation.outputAssets[0].url;
    }

    const edit = edits.find(e => e.id === imageId);
    if (edit?.outputAssets[0]?.url) {
      return edit.outputAssets[0].url;
    }

    return null;
  }, [generations, edits, galleryImages]);

  if (!showHistory) {
    return null;
  }

  return (
    <div className="w-64 bg-gray-950 border-l border-gray-800 p-4 flex flex-col h-full overflow-visible relative">
      {/* Hide Button - Positioned Outside */}
      <button
        onClick={() => setShowHistory(false)}
        className="inline-flex items-center justify-center font-semibold duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden absolute top-6 -left-3 h-8 w-8 rounded-full border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors z-[9999] opacity-60 hover:opacity-100 pointer-events-auto shadow-lg"
        title="Hide History Panel"
        aria-label="Hide History Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="m9 18 6-6-6-6"></path>
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <History className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">{t.myCreations}</h3>
            <p className="text-xs text-gray-500">{generations.length + edits.length} {t.items}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 mb-4 flex-shrink-0 bg-gray-900/30 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-2 py-2 rounded-md text-xs font-medium transition-all",
            activeTab === 'history'
              ? "bg-gray-800 text-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <History className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
          {t.history}
        </button>
        <button
          onClick={() => setActiveTab('boards')}
          className={cn(
            "px-2 py-2 rounded-md text-xs font-medium transition-all",
            activeTab === 'boards'
              ? "bg-gray-800 text-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <Folder className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
          {t.boards}
        </button>
      </div>

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <>
          {/* Full History Grid - Scrollable */}
          <div className="mb-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div
              className="sticky top-0 bg-gray-950 pb-2 mb-3 z-10 border-b"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Gallery
            </h4>
            <span className="text-xs text-gray-500">
              {generations.length + edits.length} total
            </span>
          </div>
        </div>
        {generations.length === 0 && edits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <div className="text-4xl">🎨</div>
            </div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">No creations yet</h4>
            <p className="text-xs text-gray-600">Your generated images will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {/* Combine and sort generations and edits by timestamp */}
            {[
              ...generations.map(g => ({ type: 'generation' as const, item: g, timestamp: g.timestamp })),
              ...edits.map(e => ({ type: 'edit' as const, item: e, timestamp: e.timestamp }))
            ]
              .sort((a, b) => b.timestamp - a.timestamp) // Reverse chronological (newest first)
              .map(({ type, item, timestamp }) => {
                if (type === 'generation') {
                  const generation = item as Generation;
                  const genIndex = generations.findIndex(g => g.id === generation.id);
                  return (
                    <button
                      key={generation.id}
                      className={cn(
                        'relative aspect-square rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden group',
                        selectedGenerationId === generation.id
                          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20'
                          : 'border-gray-800 hover:border-gray-700 hover:shadow-md'
                      )}
                      onClick={() => {
                        selectGeneration(generation.id);
                        selectEdit(null);
                        if (generation.outputAssets[0]) {
                          setCanvasImage(generation.outputAssets[0].url, 'history');
                        }
                        // Set prompt in prompt composer
                        if (generation.prompt) {
                          setCurrentPrompt(generation.prompt);
                        }
                        // Open modal with prompt details
                        setPreviewModal({
                          open: true,
                          imageUrl: generation.outputAssets[0]?.url || '',
                          title: `Generation #${genIndex + 1}`,
                          description: generation.prompt,
                          metadata: {
                            timestamp: generation.timestamp,
                            aspectRatio: generation.parameters?.aspectRatio,
                            width: generation.parameters?.width,
                            height: generation.parameters?.height,
                            seed: generation.parameters?.seed,
                            temperature: generation.parameters?.temperature,
                            negativePrompt: generation.negativePrompt,
                            referenceCount: generation.parameters?.referenceCount,
                            iterationIndex: generation.parameters?.iterationIndex,
                            totalIterations: generation.parameters?.totalIterations
                          }
                        });
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setShowBoardPicker(false);
                        setImageContextMenu({
                          open: true,
                          x: event.clientX,
                          y: event.clientY,
                          type: 'generation',
                          itemId: generation.id,
                          imageUrl: generation.outputAssets[0]?.url || ''
                        });
                      }}
                    >
                      {generation.outputAssets[0] && generation.outputAssets[0].url ? (
                        <img
                          src={generation.outputAssets[0].url}
                          alt={`Generation ${genIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            // Hide broken images
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback
                            if (target.nextSibling) {
                              (target.nextSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center" style={{ display: generation.outputAssets[0] && generation.outputAssets[0].url ? 'none' : 'flex' }}>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                      </div>

                      {generation.tags?.includes('upscall') && (
                        <div className="absolute top-2 left-2 bg-teal-400/90 text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-md text-black border border-teal-300/70 shadow-sm">
                          Upscall
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Generation Label */}
                      <div className="absolute top-2 left-2 bg-gray-900/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md border border-gray-700 font-medium">
                        #{genIndex + 1}
                      </div>
                      
                      {/* Timestamp */}
                      <div className="absolute bottom-2 right-2 bg-gray-900/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  );
                } else {
                  const edit = item as Edit;
                  const editIndex = edits.findIndex(e => e.id === edit.id);
                  return (
                    <button
                      key={edit.id}
                      className={cn(
                        'relative aspect-square rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden group',
                        selectedEditId === edit.id
                          ? 'border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20'
                          : 'border-gray-800 hover:border-gray-700 hover:shadow-md'
                      )}
                      onClick={() => {
                        if (edit.outputAssets[0]) {
                          setCanvasImage(edit.outputAssets[0].url, 'history');
                          selectEdit(edit.id);
                          selectGeneration(null);
                        }
                        // Set instruction in prompt composer
                        if (edit.instruction) {
                          setCurrentPrompt(edit.instruction);
                        }
                        // Open modal with prompt details
                        setPreviewModal({
                          open: true,
                          imageUrl: edit.outputAssets[0]?.url || '',
                          title: `Edit #${editIndex + 1}`,
                          description: edit.instruction,
                          metadata: {
                            timestamp: edit.timestamp,
                            maskUsed: !!edit.maskAssetId
                          }
                        });
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setShowBoardPicker(false);
                        setImageContextMenu({
                          open: true,
                          x: event.clientX,
                          y: event.clientY,
                          type: 'edit',
                          itemId: edit.id,
                          imageUrl: edit.outputAssets[0]?.url || ''
                        });
                      }}
                    >
                      {edit.outputAssets[0] && edit.outputAssets[0].url ? (
                        <img
                          src={edit.outputAssets[0].url}
                          alt={`Edit ${editIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            // Hide broken images
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback
                            if (target.nextSibling) {
                              (target.nextSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center" style={{ display: edit.outputAssets[0] && edit.outputAssets[0].url ? 'none' : 'flex' }}>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                      </div>
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Edit Label with Badge */}
                      <div className="absolute top-2 left-2 bg-purple-900/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md border border-purple-700 font-medium text-purple-200">
                        Edit #{editIndex + 1}
                      </div>
                      
                      {/* Mask indicator */}
                      {edit.maskAssetId && (
                        <div className="absolute top-2 right-2 bg-purple-500/90 backdrop-blur-sm text-xs p-1.5 rounded-md">
                          <Layers className="h-3 w-3 text-white" />
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div className="absolute bottom-2 right-2 bg-gray-900/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  );
                }
              })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Boards Tab Content */}
      {activeTab === 'boards' && (
        <BoardsView
          generations={generations}
          edits={edits}
          resolveImageUrl={resolveImageUrl}
          onImageSelect={(imageUrl, imageId, type) => {
            const origin = type === 'asset' ? 'asset' : 'history';
            setCanvasImage(imageUrl, origin);
            if (type === 'generation') {
              selectGeneration(imageId);
              selectEdit(null);
            } else if (type === 'edit') {
              selectEdit(imageId);
              selectGeneration(null);
            } else {
              selectGeneration(null);
              selectEdit(null);
            }
          }}
          onInspectImage={(type, itemId, imageUrl) => openMetadata(type, itemId, imageUrl)}
          onLocateImage={locateImage}
        />
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewModal.open}
        onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, open }))}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        description={previewModal.description}
        metadata={previewModal.metadata}
      />

      {imageContextMenu.open && imageContextMenu.type && imageContextMenu.itemId && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] min-w-[220px] rounded-xl border border-gray-800 bg-gray-950/95 shadow-2xl backdrop-blur p-2"
          ref={imageMenuRef}
          style={{ left: imageContextMenu.x, top: imageContextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MenuItem
            icon={<PlusCircle className="h-4 w-4 text-cyan-400" />}
            label={t.addAsReference}
            onClick={handleAddAsReference}
            disabled={!imageContextMenu.imageUrl}
          />
          <MenuItem
            icon={<Download className="h-4 w-4 text-gray-300" />}
            label={t.downloadImage}
            onClick={handleDownloadImage}
            disabled={!imageContextMenu.imageUrl}
          />
          <MenuItem
            icon={<Trash2 className="h-4 w-4" />}
            label={t.removeImage}
            onClick={handleRemoveImage}
            destructive
          />
        </div>,
        document.body
      )}
    </div>
  );
};