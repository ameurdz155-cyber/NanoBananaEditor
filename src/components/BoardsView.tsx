import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Folder, FolderOpen, Plus, ChevronDown, ChevronRight, Trash2, Edit2, Upload, X, AlertCircle } from 'lucide-react';
import { blobToBase64 } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import { getTranslation } from '../i18n/translations';
import * as Dialog from '@radix-ui/react-dialog';
import { Input } from './ui/Input';

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
    selectedBoardId,
    setSelectedBoardId,
    addImageToBoard,
    addBoard,
    updateBoard,
    deleteBoard,
    removeImageFromBoard,
    moveImageToBoard,
    language,
  } = useAppStore();

  const t = getTranslation(language);

  const [activeBoardImageMenu, setActiveBoardImageMenu] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'images' | 'assets'>('images');
  const [showCreateBoardModal, setShowCreateBoardModal] = React.useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = React.useState(false);
  const [showDeleteBoardModal, setShowDeleteBoardModal] = React.useState(false);
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(null);
  const [newBoardName, setNewBoardName] = React.useState('');
  const [editBoardName, setEditBoardName] = React.useState('');
  const [createBoardError, setCreateBoardError] = React.useState('');
  const [editBoardError, setEditBoardError] = React.useState('');
  const boardFileInputsRef = React.useRef<Record<string, HTMLInputElement | null>>({});

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
        setActiveTab('assets');
      } catch (error) {
        console.error('Failed to upload image to board:', error);
      }
    }

    event.target.value = '';
  }, [addImageToBoard]);

  React.useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId, setSelectedBoardId]);

  const handleCreateBoard = () => {
    setCreateBoardError('');
    setShowCreateBoardModal(true);
  };

  const handleConfirmCreateBoard = () => {
    if (newBoardName && newBoardName.trim()) {
      // Check if board name already exists
      const isDuplicate = boards.some(
        board => board.name.toLowerCase() === newBoardName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        setCreateBoardError('A board with this name already exists');
        return;
      }
      
      // Generate unique ID using timestamp and random number
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const uniqueId = `board-${timestamp}-${random}`;
      
      addBoard({
        id: uniqueId,
        name: newBoardName.trim(),
        description: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        imageIds: []
      });
      setNewBoardName('');
      setCreateBoardError('');
      setShowCreateBoardModal(false);
    }
  };

  const handleRenameBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    setEditingBoardId(boardId);
    setEditBoardName(board.name);
    setEditBoardError('');
    setShowEditBoardModal(true);
  };

  const handleConfirmEditBoard = () => {
    if (editingBoardId && editBoardName && editBoardName.trim()) {
      // Check if board name already exists (excluding current board)
      const isDuplicate = boards.some(
        board => board.id !== editingBoardId && 
                 board.name.toLowerCase() === editBoardName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        setEditBoardError('A board with this name already exists');
        return;
      }
      
      updateBoard(editingBoardId, { name: editBoardName.trim() });
      setEditBoardName('');
      setEditingBoardId(null);
      setEditBoardError('');
      setShowEditBoardModal(false);
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boardId === 'default') {
      alert(t.cannotDeleteDefault);
      return;
    }
    setDeletingBoardId(boardId);
    setShowDeleteBoardModal(true);
  };

  const handleConfirmDeleteBoard = () => {
    if (deletingBoardId) {
      deleteBoard(deletingBoardId);
      if (selectedBoardId === deletingBoardId) {
        setSelectedBoardId(boards.length > 1 ? boards[0].id : null);
      }
      setDeletingBoardId(null);
      setShowDeleteBoardModal(false);
    }
  };

  // Get items for the selected board
  const selectedBoardData = boards.find(b => b.id === selectedBoardId);
  const boardItems = selectedBoardData ? selectedBoardData.imageIds
    .map(imageId => {
      const imageUrl = resolveImageUrl(imageId);
      if (!imageUrl) return null;

      // Check if imageId is a direct URL (asset) or a generation/edit ID
      const isDirectUrl = imageId.startsWith('data:') || imageId.startsWith('blob:') || imageId.startsWith('http');
      
      let isGeneration = false;
      let isEdit = false;
      let type: 'generation' | 'edit' | 'asset' = 'asset';
      
      if (!isDirectUrl) {
        // Only check generations/edits if it's not a direct URL
        isGeneration = generations.some(g => g.id === imageId);
        isEdit = edits.some(e => e.id === imageId);
        type = isGeneration ? 'generation' : isEdit ? 'edit' : 'asset';
      } else {
        // If it's a direct URL, check if it belongs to any generation or edit output
        isGeneration = generations.some(g => g.outputAssets.some((a: any) => a.url === imageId));
        isEdit = edits.some(e => e.outputAssets.some((a: any) => a.url === imageId));
        type = isGeneration ? 'generation' : isEdit ? 'edit' : 'asset';
      }

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
    }> : [];

  const assetItems = boardItems.filter(item => item.type === 'asset');
  const imageItems = boardItems.filter(item => item.type !== 'asset');
  const itemsToRender = activeTab === 'assets' ? assetItems : imageItems;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Boards Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800 flex-shrink-0">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {t.boards}
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
      <div className="flex-shrink-0 mb-3">
        {boards.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            {t.noImagesYet}
          </div>
        ) : (
          <div className="space-y-1">
            {boards.map(board => {
              const isSelected = selectedBoardId === board.id;
              return (
                <div key={board.id}>
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
                    onClick={() => setSelectedBoardId(board.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedBoardId(board.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group cursor-pointer",
                      isSelected
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                        : "hover:bg-gray-800/50 text-gray-400 border border-transparent"
                    )}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {isSelected ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      )}
                      {board.emoji ? (
                        <span className="text-base flex-shrink-0">{board.emoji}</span>
                      ) : (
                        <FolderOpen className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {board.id === 'default' ? t.myCreations : board.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                        onClick={(event) => {
                          event.stopPropagation();
                          boardFileInputsRef.current[board.id]?.click();
                        }}
                        title={t.uploadImages}
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
                        title={t.renameBoard}
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
                          title={t.deleteBoard}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Static Tabs Section - Only show when a board is selected */}
      {selectedBoardId && (
        <>
          <div className="flex-shrink-0 mb-3">
            <div className="flex w-full rounded-md bg-gray-800/60 p-0.5 border border-gray-700">
              <button
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                  activeTab === 'images'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                )}
                onClick={() => setActiveTab('images')}
              >
                {t.images}
              </button>
              <button
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                  activeTab === 'assets'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                )}
                onClick={() => setActiveTab('assets')}
              >
                {t.assets}
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {itemsToRender.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-800 flex items-center justify-center">
                  {activeTab === 'assets' ? '📁' : '🖼️'}
                </div>
                <div className="text-xs text-gray-500">
                  {activeTab === 'assets'
                    ? t.uploadImages
                    : t.createImagesMessage}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {itemsToRender.map(item => (
                  <div key={item.imageId} className="relative group">
                    <button
                      onClick={() => onImageSelect(item.imageUrl, item.imageId, item.type)}
                      className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-gray-800 hover:border-cyan-500 transition-all"
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
                          if (boards.length <= 1) return;
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
                          if (selectedBoardId) {
                            removeImageFromBoard(selectedBoardId, item.imageId);
                          }
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
                              <span className="text-xs">×</span>
                            </button>
                          </div>
                          <div className="space-y-1">
                            {boards.filter(target => target.id !== selectedBoardId).map(target => {
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

      {/* Create Board Modal */}
      <Dialog.Root open={showCreateBoardModal} onOpenChange={setShowCreateBoardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Plus className="h-5 w-5 text-purple-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {t.createBoard}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  {t.boardName}
                </label>
                <Input
                  value={newBoardName}
                  onChange={(e) => {
                    setNewBoardName(e.target.value);
                    setCreateBoardError('');
                  }}
                  placeholder={t.enterBoardName}
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBoardName.trim()) {
                      handleConfirmCreateBoard();
                    }
                  }}
                />
                {createBoardError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {createBoardError}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleConfirmCreateBoard}
                  disabled={!newBoardName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  {t.create}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setShowCreateBoardModal(false);
                    setNewBoardName('');
                    setCreateBoardError('');
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-800"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Board Modal */}
      <Dialog.Root open={showEditBoardModal} onOpenChange={setShowEditBoardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Edit2 className="h-5 w-5 text-purple-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {t.renameBoard}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  {t.boardName}
                </label>
                <Input
                  value={editBoardName}
                  onChange={(e) => {
                    setEditBoardName(e.target.value);
                    setEditBoardError('');
                  }}
                  placeholder={t.enterBoardName}
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editBoardName.trim()) {
                      handleConfirmEditBoard();
                    }
                  }}
                />
                {editBoardError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {editBoardError}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleConfirmEditBoard}
                  disabled={!editBoardName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  {t.save}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setShowEditBoardModal(false);
                    setEditBoardName('');
                    setEditingBoardId(null);
                    setEditBoardError('');
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-800"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Board Confirmation Modal */}
      <Dialog.Root open={showDeleteBoardModal} onOpenChange={setShowDeleteBoardModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-600/20 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  {t.deleteBoard}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  {t.confirmDelete}
                </p>
                {deletingBoardId && (() => {
                  const board = boards.find(b => b.id === deletingBoardId);
                  return board ? (
                    <p className="text-sm font-semibold text-red-400 mt-2">
                      "{board.name}"
                    </p>
                  ) : null;
                })()}
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleConfirmDeleteBoard}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
                >
                  {t.yesClear || 'Yes, Delete'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteBoardModal(false);
                    setDeletingBoardId(null);
                  }}
                  className="flex-1 border-gray-600 hover:bg-gray-800"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
 
