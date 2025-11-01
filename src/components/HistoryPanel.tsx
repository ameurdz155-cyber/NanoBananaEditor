import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { History, Layers, Folder } from 'lucide-react';
import { cn } from '../utils/cn';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Generation, Edit } from '../types';
import { BoardsView } from './BoardsView';
import { getTranslation } from '../i18n/translations';
import { getImageById } from '../utils/galleryStorage';

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
    return (
      <div className="w-8 bg-gray-950 border-l border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowHistory(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-l-lg border border-r-0 border-gray-700 flex items-center justify-center transition-colors group"
          title="Show History Panel"
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
    <div className="w-80 bg-gray-950 border-l border-gray-800 p-4 flex flex-col h-full overflow-hidden">
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHistory(!showHistory)}
          className="h-8 w-8 hover:bg-gray-800"
          title="Hide History Panel"
        >
          ×
        </Button>
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
            <div className="sticky top-0 bg-gray-950 pb-2 mb-3 z-10 border-b border-gray-800">
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
                          setCanvasImage(generation.outputAssets[0].url);
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
                          setCanvasImage(edit.outputAssets[0].url);
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
            setCanvasImage(imageUrl);
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
    </div>
  );
};