import React from 'react';
import ReactDOM from 'react-dom';
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

  // Context menu state for right-click on boards
  const [contextMenu, setContextMenu] = React.useState<{
    open: boolean;
    x: number;
    y: number;
    boardId: string | null;
  }>({ open: false, x: 0, y: 0, boardId: null });

  React.useEffect(() => {
    const handleGlobalClick = () => setContextMenu({ open: false, x: 0, y: 0, boardId: null });
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const [activeBoardImageMenu, setActiveBoardImageMenu] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'images' | 'assets'>('images');
  const [showCreateBoardModal, setShowCreateBoardModal] = React.useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = React.useState(false);
  const [showDeleteBoardModal, setShowDeleteBoardModal] = React.useState(false);
  const [editingBoardId, setEditingBoardId] = React.useState<string | null>(null);
  const [deletingBoardId, setDeletingBoardId] = React.useState<string | null>(null);
  const [newBoardName, setNewBoardName] = React.useState('');

  // Handle asset file upload
  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && selectedBoardId) {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          // Add the uploaded asset to the current board
          addImageToBoard(selectedBoardId, dataUrl);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload asset:', error);
      }
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };
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
      
      // Check if it's a saved gallery image (from Save button)
      const isSavedGalleryImage = imageId.startsWith('img-');
      
      let isGeneration = false;
      let isEdit = false;
      let type: 'generation' | 'edit' | 'asset' = 'asset';
      let timestamp = 0;
      
      if (isSavedGalleryImage) {
        // Saved gallery images should appear in "Images" tab, so mark as generation
        type = 'generation';
        isGeneration = true;
        // Extract timestamp from imageId (format: img-{timestamp}-{random})
        const parts = imageId.split('-');
        if (parts.length >= 2) {
          timestamp = parseInt(parts[1]) || 0;
        }
      } else if (!isDirectUrl) {
        // Only check generations/edits if it's not a direct URL
        const generation = generations.find(g => g.id === imageId);
        const edit = edits.find(e => e.id === imageId);
        isGeneration = !!generation;
        isEdit = !!edit;
        type = isGeneration ? 'generation' : isEdit ? 'edit' : 'asset';
        timestamp = generation?.timestamp || edit?.timestamp || 0;
      } else {
        // If it's a direct URL, check if it belongs to any generation or edit output
        const generation = generations.find(g => g.outputAssets.some((a: any) => a.url === imageId));
        const edit = edits.find(e => e.outputAssets.some((a: any) => a.url === imageId));
        isGeneration = !!generation;
        isEdit = !!edit;
        type = isGeneration ? 'generation' : isEdit ? 'edit' : 'asset';
        timestamp = generation?.timestamp || edit?.timestamp || 0;
      }

      return {
        imageId,
        imageUrl,
        type,
        isGeneration,
        isEdit,
        timestamp
      };
    })
    .filter(Boolean) as Array<{
      imageId: string;
      imageUrl: string;
      type: 'generation' | 'edit' | 'asset';
      isGeneration: boolean;
      isEdit: boolean;
      timestamp: number;
    }> : [];

  // Sort items by timestamp (most recent first)
  const sortedBoardItems = [...boardItems].sort((a, b) => b.timestamp - a.timestamp);

  const assetItems = sortedBoardItems.filter(item => item.type === 'asset');
  const imageItems = sortedBoardItems.filter(item => item.type !== 'asset');
  const itemsToRender = activeTab === 'assets' ? assetItems : imageItems;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Boards Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800 flex-shrink-0">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {t.boards}
        </h4>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              // Download all boards as a single zip
              try {
                // @ts-ignore - dynamic import
                const JSZipModule = await import('jszip');
                const JSZip = (JSZipModule && (JSZipModule as any).default) || JSZipModule;
                const zip = new JSZip();
                
                for (const board of boards) {
                  const folder = zip.folder(board.id === 'default' ? t.myCreations : board.name) || zip;
                  const imageIds = board.imageIds || [];
                  
                  for (let i = 0; i < imageIds.length; i++) {
                    const id = imageIds[i];
                    const url = resolveImageUrl(id);
                    if (!url) continue;
                    
                    let blob: Blob | null = null;
                    if (url.startsWith('data:')) {
                      const parts = url.split(',');
                      const mime = parts[0].split(':')[1].split(';')[0];
                      const bstr = atob(parts[1]);
                      const u8 = new Uint8Array(bstr.length);
                      for (let j = 0; j < bstr.length; j++) u8[j] = bstr.charCodeAt(j);
                      blob = new Blob([u8], { type: mime });
                    } else {
                      try {
                        const resp = await fetch(url);
                        blob = await resp.blob();
                      } catch (err) {
                        console.error('Failed to fetch image', err);
                      }
                    }
                    
                    if (blob) {
                      const ext = blob.type.split('/').pop() || 'png';
                      folder.file(`${board.name || board.id}-${i + 1}.${ext}`, blob);
                    }
                  }
                }
                
                const content = await zip.generateAsync({ type: 'blob' });
                const href = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = href;
                a.download = 'all-boards.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(href);
              } catch (err) {
                console.error('Failed to create zip', err);
                alert('Failed to create zip archive');
              }
            }}
            className="h-6 w-6"
            title="Download all boards as ZIP"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateBoard}
            className="h-6 w-6"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ open: true, x: e.clientX, y: e.clientY, boardId: board.id });
                    }}
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

      {/* Context menu for boards (right click) - Using Portal to render outside container */}
      {contextMenu.open && contextMenu.boardId && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] bg-gray-950 border border-gray-800 rounded-md shadow-xl py-1 w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Board Title Header */}
          <div className="px-3 py-2 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              {(() => {
                const board = boards.find(b => b.id === contextMenu.boardId);
                if (!board) return null;
                return (
                  <>
                    {board.emoji ? (
                      <span className="text-base">{board.emoji}</span>
                    ) : (
                      <Folder className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-gray-200 truncate">
                      {board.id === 'default' ? t.myCreations : board.name}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          
          {/* Rename Board */}
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-900 flex items-center space-x-2"
            onClick={() => {
              if (contextMenu.boardId) {
                handleRenameBoard(contextMenu.boardId);
              }
              setContextMenu({ open: false, x: 0, y: 0, boardId: null });
            }}
          >
            <Edit2 className="h-4 w-4 text-gray-400" />
            <span>{t.renameBoard}</span>
          </button>

          {/* Download as Archive */}
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-900 flex items-center space-x-2"
            onClick={async () => {
              const board = boards.find(b => b.id === contextMenu.boardId);
              if (!board) return;
              // Download as zip
              try {
                // Dynamically import JSZip at runtime to avoid build-time module resolution errors
                // @ts-ignore - dynamic import, types may not be available in this environment
                const JSZipModule = await import('jszip');
                const JSZip = (JSZipModule && (JSZipModule as any).default) || JSZipModule;
                const zip = new JSZip();
                const folder = zip.folder(board.name || board.id) || zip;
                const imageIds = board.imageIds || [];
                for (let i = 0; i < imageIds.length; i++) {
                  const id = imageIds[i];
                  const url = resolveImageUrl(id);
                  if (!url) continue;
                  let blob: Blob | null = null;
                  if (url.startsWith('data:')) {
                    const parts = url.split(',');
                    const mime = parts[0].split(':')[1].split(';')[0];
                    const bstr = atob(parts[1]);
                    const u8 = new Uint8Array(bstr.length);
                    for (let j = 0; j < bstr.length; j++) u8[j] = bstr.charCodeAt(j);
                    blob = new Blob([u8], { type: mime });
                  } else {
                    try {
                      const resp = await fetch(url);
                      blob = await resp.blob();
                    } catch (err) {
                      console.error('Failed to fetch image', err);
                    }
                  }
                  if (blob) {
                    const ext = blob.type.split('/').pop() || 'png';
                    folder.file(`${board.name || board.id}-${i + 1}.${ext}`, blob);
                  }
                }

                const content = await zip.generateAsync({ type: 'blob' });
                const href = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = href;
                a.download = `${(board.name || board.id).replace(/[^a-z0-9-_\.]/gi, '_')}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(href);
              } catch (err) {
                console.error('Failed to create zip', err);
                alert('Failed to create zip for board');
              } finally {
                setContextMenu({ open: false, x: 0, y: 0, boardId: null });
              }
            }}
          >
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{t.downloadBoard}</span>
          </button>

          {/* Delete Board - Only for non-default boards */}
          {contextMenu.boardId !== 'default' && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-900 flex items-center space-x-2"
              onClick={() => {
                // Trigger delete confirmation modal
                setDeletingBoardId(contextMenu.boardId);
                setShowDeleteBoardModal(true);
                setContextMenu({ open: false, x: 0, y: 0, boardId: null });
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.deleteBoard}</span>
            </button>
          )}
        </div>,
        document.body
      )}

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
                {activeTab === 'assets' ? (
                  <>
                    <input
                      type="file"
                      id="asset-upload"
                      accept="image/*"
                      onChange={handleAssetUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById('asset-upload')?.click()}
                      className="w-full flex flex-col items-center justify-center py-8 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 border-dashed hover:border-gray-600 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 mb-3 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">
                        �
                      </div>
                      <div className="text-xs text-gray-500">{t.uploadImages}</div>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-800 flex items-center justify-center">
                      🖼️
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.createImagesMessage}
                    </div>
                  </>
                )}
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
                
                {/* Upload button when in assets tab and there are items */}
                {activeTab === 'assets' && (
                  <div className="col-span-2 mt-2">
                    <input
                      type="file"
                      id="asset-upload-grid"
                      accept="image/*"
                      onChange={handleAssetUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => document.getElementById('asset-upload-grid')?.click()}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t.upload}
                    </Button>
                  </div>
                )}
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
 
