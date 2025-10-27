import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Folder, FolderOpen, Plus, ChevronDown, ChevronRight, Trash2, Edit2, Upload } from 'lucide-react';
import { blobToBase64 } from '../utils/imageUtils';
import { cn } from '../utils/cn';

interface BoardsViewProps {
  generations: any[];
  edits: any[];
  resolveImageUrl: (imageId: string) => string | null;
  onImageSelect: (imageUrl: string, imageId: string, type: 'generation' | 'edit' | 'asset') => void;
}

export const BoardsView: React.FC<BoardsViewProps> = ({
  generations,
  edits,
  resolveImageUrl,
  onImageSelect
}) => {
  const {
    boards,
    addImageToBoard,
    addBoard,
    updateBoard,
    deleteBoard,
    removeImageFromBoard,
    moveImageToBoard
  } = useAppStore();

  const [expandedBoards, setExpandedBoards] = React.useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = React.useState<string | null>(null);
  const [activeBoardImageMenu, setActiveBoardImageMenu] = React.useState<string | null>(null);
  const boardFileInputsRef = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [boardViewTabs, setBoardViewTabs] = React.useState<Record<string, 'images' | 'videos' | 'assets'>>({});

  const handleBoardFileUpload = React.useCallback(async (
    boardId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        const base64 = await blobToBase64(file);
        const dataUrl = `data:${file.type};base64,${base64}`;
        addImageToBoard(boardId, dataUrl);
        setBoardViewTabs(prev => ({ ...prev, [boardId]: 'assets' }));
      } catch (error) {
        console.error('Failed to upload image to board:', error);
      }
    }

    event.target.value = '';
  }, [addImageToBoard, setBoardViewTabs]);

  React.useEffect(() => {
    if (boards.length === 0) {
      setExpandedBoards([]);
      setSelectedBoard(null);
      setActiveBoardImageMenu(null);
      setBoardViewTabs({});
      return;
    }

    setExpandedBoards(prev => {
      const valid = prev.filter(id => boards.some(b => b.id === id));
      if (valid.length > 0) {
        return valid;
      }
      return [boards[0].id];
    });

    setSelectedBoard(prev => {
      if (prev && boards.some(b => b.id === prev)) {
        return prev;
      }
      return boards[0].id;
    });
    setActiveBoardImageMenu(null);

    setBoardViewTabs(prev => {
      const next: Record<string, 'images' | 'videos' | 'assets'> = {};
      boards.forEach(board => {
        next[board.id] = prev[board.id] || 'images';
      });
      return next;
    });
  }, [boards]);

  const toggleBoard = (boardId: string) => {
    setActiveBoardImageMenu(null);
    setExpandedBoards(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      }
      setBoardViewTabs(current => ({ ...current, [boardId]: current[boardId] || 'images' }));
      return [...prev, boardId];
    });
  };

  const handleCreateBoard = () => {
    const name = prompt('Enter board name:');
    if (name && name.trim()) {
      addBoard({
        id: `board-${Date.now()}`,
        name: name.trim(),
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        imageIds: []
      });
    }
  };

  const handleRenameBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const newName = prompt('Enter new name:', board.name);
    if (newName && newName.trim()) {
      updateBoard(boardId, { name: newName.trim() });
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boardId === 'default') {
      alert('Cannot delete the default board');
      return;
    }
    if (confirm('Are you sure you want to delete this board?')) {
      deleteBoard(boardId);
      if (selectedBoard === boardId) {
        setSelectedBoard(null);
      }
    }
  };

  return (
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
        {boards.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500">
            No boards yet. Create one to start organizing your images.
          </div>
        ) : (
          boards.map(board => {
            const isSelected = selectedBoard === board.id;
            const isExpanded = expandedBoards.includes(board.id);
            const boardItems = board.imageIds
              .map(imageId => {
                const imageUrl = resolveImageUrl(imageId);
                if (!imageUrl) {
                  return null;
                }

                const isGeneration = generations.some(g => g.id === imageId);
                const isEdit = edits.some(e => e.id === imageId);
                const type = isGeneration ? 'generation' : isEdit ? 'edit' : 'asset';

                return {
                  imageId,
                  imageUrl,
                  type,
                  isGeneration,
                  isEdit
                };
              })
              .filter(Boolean) as Array<{
                imageId: string;
                imageUrl: string;
                type: 'generation' | 'edit' | 'asset';
                isGeneration: boolean;
                isEdit: boolean;
              }>;

            const assetItems = boardItems.filter(item => item.type === 'asset');
            const imageItems = boardItems.filter(item => item.type !== 'asset');
            const videoItems: typeof boardItems = []; // Placeholder for future video support
            const imagesCount = imageItems.length;
            const videosCount = videoItems.length;
            const assetsCount = assetItems.length;
            const activeTab = boardViewTabs[board.id] || 'images';
            const itemsToRender = activeTab === 'assets' ? assetItems : activeTab === 'videos' ? videoItems : imageItems;

            return (
              <div key={board.id} className="mb-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={(element) => {
                    boardFileInputsRef.current[board.id] = element;
                  }}
                  onChange={(event) => handleBoardFileUpload(board.id, event)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedBoard(board.id);
                    toggleBoard(board.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedBoard(board.id);
                      toggleBoard(board.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group cursor-pointer",
                    isSelected
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                      : "hover:bg-gray-800/50 text-gray-400 border border-transparent"
                  )}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {isExpanded ? (
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
                    <span className="text-xs text-gray-500" title="Images | Assets">
                      {imagesCount} | {assetsCount}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                        onClick={(event) => {
                          event.stopPropagation();
                          boardFileInputsRef.current[board.id]?.click();
                        }}
                        title="Upload images"
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRenameBoard(board.id);
                        }}
                        title="Rename board"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      {board.id !== 'default' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-500/20"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteBoard(board.id);
                          }}
                          title="Delete board"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <>
                    {/* Tabs - Right below board header */}
                    <div className="mt-2 px-3">
                      <div className="inline-flex rounded-md bg-gray-800/60 p-0.5 border border-gray-700">
                        <button
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                            activeTab === 'images'
                              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                              : 'text-gray-400 hover:text-gray-200'
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            setBoardViewTabs(prev => ({ ...prev, [board.id]: 'images' }));
                          }}
                        >
                          Images
                        </button>
                        <button
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                            activeTab === 'videos'
                              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                              : 'text-gray-400 hover:text-gray-200'
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            setBoardViewTabs(prev => ({ ...prev, [board.id]: 'videos' }));
                          }}
                        >
                          Videos
                        </button>
                        <button
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                            activeTab === 'assets'
                              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                              : 'text-gray-400 hover:text-gray-200'
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            setBoardViewTabs(prev => ({ ...prev, [board.id]: 'assets' }));
                          }}
                        >
                          Assets
                        </button>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="mt-3 px-3">
                      {itemsToRender.length === 0 ? (
                        <div className="text-xs text-gray-500 py-3">
                          {activeTab === 'assets'
                            ? 'No assets uploaded to this board yet.'
                            : activeTab === 'videos'
                            ? 'No videos in this board yet.'
                            : 'No generated images assigned to this board yet.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {itemsToRender.map(item => (
                          <div key={item.imageId} className="relative group">
                            <button
                              onClick={() => {
                                onImageSelect(item.imageUrl, item.imageId, item.type);
                              }}
                              className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-gray-800 hover:border-purple-500 transition-all"
                            >
                              <img
                                src={item.imageUrl}
                                alt="Board item"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-black/50 hover:bg-black/70 text-gray-200"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (boards.length <= 1) {
                                    return;
                                  }
                                  setActiveBoardImageMenu(prev => prev === item.imageId ? null : item.imageId);
                                }}
                                title="Move to another board"
                              >
                                <Folder className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-black/50 hover:bg-red-500/60 text-white"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveBoardImageMenu(null);
                                  removeImageFromBoard(board.id, item.imageId);
                                }}
                                title="Remove from board"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            {activeBoardImageMenu === item.imageId && (
                              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 z-10">
                                <div className="bg-gray-900 rounded-lg p-3 w-full max-h-40 overflow-y-auto">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-300">Move to Board</span>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveBoardImageMenu(null);
                                      }}
                                      className="text-gray-500 hover:text-gray-200"
                                    >
                                      <span className="text-xs">x</span>
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {boards.filter(target => target.id !== board.id).map(target => {
                                      const alreadyInTarget = target.imageIds.includes(item.imageId);
                                      return (
                                        <button
                                          key={target.id}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            moveImageToBoard(target.id, item.imageId);
                                            setActiveBoardImageMenu(null);
                                          }}
                                          disabled={alreadyInTarget}
                                          className={cn(
                                            "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                                            alreadyInTarget
                                              ? "bg-purple-500/20 text-purple-300"
                                              : "text-gray-300 hover:bg-gray-800"
                                          )}
                                        >
                                          <span className="flex items-center space-x-1.5">
                                            {target.emoji ? (
                                              <span>{target.emoji}</span>
                                            ) : (
                                              <Folder className="h-3 w-3 text-gray-500" />
                                            )}
                                            <span className="truncate">{target.name}</span>
                                          </span>
                                          {alreadyInTarget && <span className="text-purple-400">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.type === 'generation' && (
                              <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded bg-blue-600/80 text-white">
                                Gen
                              </div>
                            )}
                            {item.type === 'edit' && (
                              <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded bg-purple-600/80 text-white">
                                Edit
                              </div>
                            )}
                            {item.type === 'asset' && (
                              <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded bg-amber-500/80 text-gray-900">
                                Asset
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Board Info */}
      {selectedBoard && (
        <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700 flex-shrink-0">
          {(() => {
            const board = boards.find(b => b.id === selectedBoard);
            if (!board) {
              return (
                <p className="text-xs text-gray-500">Select a board to view its details.</p>
              );
            }

            return (
              <>
                <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center space-x-1">
                  {board.emoji ? (
                    <span>{board.emoji}</span>
                  ) : (
                    <Folder className="h-3 w-3" />
                  )}
                  <span>{board.name}</span>
                </h4>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="text-gray-300">{board.imageIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-gray-300">
                      {new Date(board.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="text-gray-300">
                      {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
