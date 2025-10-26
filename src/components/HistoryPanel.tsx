import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { History, Save, Image as ImageIcon, Layers, Folder, FolderOpen, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { saveImageWithDialog } from '../utils/fileSaver';
import { cn } from '../utils/cn';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Generation, Edit } from '../types';

interface Board {
  id: string;
  name: string;
  emoji?: string;
  itemCount: number;
  createdAt: number;
  updatedAt: number;
}

export const HistoryPanel: React.FC = () => {
  const {
    currentProject,
    canvasImage,
    selectedGenerationId,
    selectedEditId,
    selectGeneration,
    selectEdit,
    showHistory,
    setShowHistory,
    setCanvasImage,
    selectedTool
  } = useAppStore();

  const [activeTab, setActiveTab] = React.useState<'history' | 'boards'>('history');
  const [expandedBoards, setExpandedBoards] = React.useState<string[]>(['uncategorized']);
  const [selectedBoard, setSelectedBoard] = React.useState<string | null>('uncategorized');
  
  // Mock boards data
  const [boards, setBoards] = React.useState<Board[]>([
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      itemCount: 9,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'test-board',
      name: '正式',
      emoji: '📝',
      itemCount: 7,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]);

  const [previewModal, setPreviewModal] = React.useState<{
    open: boolean;
    imageUrl: string;
    title: string;
    description?: string;
  }>({
    open: false,
    imageUrl: '',
    title: '',
    description: ''
  });

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];

  // Get current image dimensions
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  
  React.useEffect(() => {
    if (canvasImage) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = canvasImage;
    } else {
      setImageDimensions(null);
    }
  }, [canvasImage]);

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

  const toggleBoard = (boardId: string) => {
    setExpandedBoards(prev => 
      prev.includes(boardId) 
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    );
  };

  const handleCreateBoard = () => {
    const name = prompt('Enter board name:');
    if (name) {
      const newBoard: Board = {
        id: Date.now().toString(),
        name,
        itemCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setBoards([...boards, newBoard]);
    }
  };

  return (
    <div className="w-80 bg-gray-950 border-l border-gray-800 p-4 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <History className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Your Creations</h3>
            <p className="text-xs text-gray-500">{generations.length + edits.length} items</p>
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
      <div className="flex space-x-1 mb-4 flex-shrink-0 bg-gray-900/30 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'history'
              ? "bg-gray-800 text-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <History className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          History
        </button>
        <button
          onClick={() => setActiveTab('boards')}
          className={cn(
            "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'boards'
              ? "bg-gray-800 text-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
          )}
        >
          <Folder className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Boards
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
                      }}
                    >
                      {generation.outputAssets[0] ? (
                        <img
                          src={generation.outputAssets[0].url}
                          alt={`Generation ${genIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
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
                          setCanvasImage(edit.outputAssets[0].url);
                          selectEdit(edit.id);
                          selectGeneration(null);
                        }
                      }}
                    >
                      {edit.outputAssets[0] ? (
                        <img
                          src={edit.outputAssets[0].url}
                          alt={`Edit ${editIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                        </div>
                      )}
                      
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

      {/* Current Image Info */}
      {(canvasImage || imageDimensions) && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700 flex-shrink-0">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Current Image</h4>
          <div className="space-y-1 text-xs text-gray-500">
            {imageDimensions && (
              <div className="flex justify-between">
                <span>Dimensions:</span>
                <span className="text-gray-300">{imageDimensions.width} × {imageDimensions.height}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="text-gray-300 capitalize">{selectedTool}</span>
            </div>
          </div>
        </div>
      )}

      {/* Generation Details */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700 flex-shrink-0 max-h-80 overflow-y-auto">
        <h4 className="text-xs font-medium text-gray-400 mb-2 sticky top-0 bg-gray-900 pb-2">Generation Details</h4>
        {(() => {
          const gen = generations.find(g => g.id === selectedGenerationId);
          const selectedEdit = edits.find(e => e.id === selectedEditId);
          
          if (gen) {
            return (
              <div className="space-y-3">
                <div className="space-y-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">Prompt:</span>
                    <p className="text-gray-300 mt-1">{gen.prompt}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span>{gen.modelVersion}</span>
                  </div>
                  {gen.parameters.seed && (
                    <div className="flex justify-between">
                      <span>Seed:</span>
                      <span>{gen.parameters.seed}</span>
                    </div>
                  )}
                </div>
                
                {/* Reference Images */}
                {gen.sourceAssets.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Reference Images</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {gen.sourceAssets.map((asset, index) => (
                        <button
                          key={asset.id}
                          onClick={() => setPreviewModal({
                            open: true,
                            imageUrl: asset.url,
                            title: `Reference Image ${index + 1}`,
                            description: 'This reference image was used to guide the generation'
                          })}
                          className="relative aspect-square rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                        >
                          <img
                            src={asset.url}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-1 left-1 bg-gray-900/80 text-xs px-1 py-0.5 rounded text-gray-300">
                            Ref {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (selectedEdit) {
            const parentGen = generations.find(g => g.id === selectedEdit.parentGenerationId);
            return (
              <div className="space-y-3">
                <div className="space-y-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">Edit Instruction:</span>
                    <p className="text-gray-300 mt-1">{selectedEdit.instruction}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>Image Edit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(selectedEdit.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {selectedEdit.maskAssetId && (
                    <div className="flex justify-between">
                      <span>Mask:</span>
                      <span className="text-purple-400">Applied</span>
                    </div>
                  )}
                </div>
                
                {/* Parent Generation Reference */}
                {parentGen && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Original Image</h5>
                    <button
                      onClick={() => setPreviewModal({
                        open: true,
                        imageUrl: parentGen.outputAssets[0]?.url || '',
                        title: 'Original Image',
                        description: 'The base image that was edited'
                      })}
                      className="relative aspect-square w-16 rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                    >
                      <img
                        src={parentGen.outputAssets[0]?.url}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                )}
                
                {/* Mask Visualization */}
                {selectedEdit.maskReferenceAsset && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Masked Reference</h5>
                    <button
                      onClick={() => setPreviewModal({
                        open: true,
                        imageUrl: selectedEdit.maskReferenceAsset!.url,
                        title: 'Masked Reference Image',
                        description: 'This image with mask overlay was sent to the AI model to guide the edit'
                      })}
                      className="relative aspect-square w-16 rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                    >
                      <img
                        src={selectedEdit.maskReferenceAsset.url}
                        alt="Masked reference"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-1 left-1 bg-purple-900/80 text-xs px-1 py-0.5 rounded text-purple-300">
                        Mask
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="space-y-2 text-xs text-gray-500">
                <p className="text-gray-400">Select a generation or edit to view details</p>
              </div>
            );
          }
        })()}
      </div>

      {/* Actions */}
      <div className="space-y-3 flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={async () => {
            // Find the currently displayed image (either generation or edit)
            let imageUrl: string | null = null;
            
            if (selectedGenerationId) {
              const gen = generations.find(g => g.id === selectedGenerationId);
              imageUrl = gen?.outputAssets[0]?.url || null;
            } else {
              // If no generation selected, try to get the current canvas image
              const { canvasImage } = useAppStore.getState();
              imageUrl = canvasImage;
            }
            
            if (imageUrl) {
              await saveImageWithDialog(imageUrl);
            }
          }}
          disabled={!selectedGenerationId && !useAppStore.getState().canvasImage}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
        </>
      )}

      {/* Boards Tab Content */}
      {activeTab === 'boards' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Boards Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800 flex-shrink-0">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              My Boards
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateBoard}
              className="h-6 w-6"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Boards List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {boards.map(board => (
              <div key={board.id} className="mb-2">
                <button
                  onClick={() => {
                    setSelectedBoard(board.id);
                    toggleBoard(board.id);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                    selectedBoard === board.id
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                      : "hover:bg-gray-800/50 text-gray-400 border border-transparent"
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {expandedBoards.includes(board.id) ? (
                      <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    )}
                    {board.emoji ? (
                      <span className="text-base flex-shrink-0">{board.emoji}</span>
                    ) : (
                      <FolderOpen className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{board.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {board.id === 'uncategorized' && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                        AUTO
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{board.itemCount}</span>
                    <span className="text-gray-700">|</span>
                    <span className="text-xs text-gray-500">0</span>
                    <span className="text-gray-700">|</span>
                    <span className="text-xs text-gray-500">1</span>
                  </div>
                </button>

                {/* Board Images - Show when expanded */}
                {expandedBoards.includes(board.id) && (
                  <div className="mt-2 ml-9 grid grid-cols-2 gap-2">
                    {generations.slice(0, board.id === 'uncategorized' ? 4 : 3).map((gen, index) => (
                      <button
                        key={gen.id}
                        onClick={() => {
                          selectGeneration(gen.id);
                          selectEdit(null);
                          if (gen.outputAssets[0]) {
                            setCanvasImage(gen.outputAssets[0].url);
                          }
                        }}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                          selectedGenerationId === gen.id
                            ? "border-purple-500 ring-1 ring-purple-500/30"
                            : "border-gray-800 hover:border-gray-600"
                        )}
                      >
                        {gen.outputAssets[0] ? (
                          <>
                            <img
                              src={gen.outputAssets[0].url}
                              alt={`${board.name} ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {/* Index */}
                            <div className="absolute top-1 left-1 bg-gray-900/90 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              #{index + 1}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Board Info */}
          {selectedBoard && (
            <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 flex-shrink-0">
              <h4 className="text-xs font-medium text-gray-400 mb-2">
                {boards.find(b => b.id === selectedBoard)?.name || 'Board'}
              </h4>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span className="text-gray-300">
                    {boards.find(b => b.id === selectedBoard)?.itemCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-gray-300">
                    {new Date(boards.find(b => b.id === selectedBoard)?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewModal.open}
        onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, open }))}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        description={previewModal.description}
      />
    </div>
  );
};