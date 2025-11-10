import React from 'react';
import ReactDOM from 'react-dom';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Upload,
  X,
  AlertCircle,
  PlusCircle,
  Download
} from 'lucide-react';
import { blobToBase64 } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import { getTranslation } from '../i18n/translations';
import { uploadAsset, getAssetUrl } from '../services/uploadService';
import * as Dialog from '@radix-ui/react-dialog';
import { Input } from './ui/Input';
import { saveImageWithDialog } from '../utils/fileSaver';

interface BoardsViewProps {
  generations: any[];
  edits: any[];
  resolveImageUrl: (imageId: string) => string | null;
  onImageSelect: (imageUrl: string, imageId: string, type: 'generation' | 'edit' | 'asset') => void;
  onInspectImage?: (type: 'generation' | 'edit', itemId: string, imageUrl?: string) => void;
  onLocateImage?: (type: 'generation' | 'edit', itemId: string) => void;
}

export const BoardsView: React.FC<BoardsViewProps> = ({
  generations,
  edits,
  resolveImageUrl,
  onImageSelect,
  onInspectImage,
  onLocateImage
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
    selectedTool,
    addUploadedImage,
    addEditReferenceImage,
    setCanvasImage,
    setActivePrimarySection,
    setSelectedTool,
    setCurrentPrompt,
    setLastGenerationParameters,
    setSeed,
    setTemperature,
    toggleFavoriteImage,
    isFavoriteImage,
  } = useAppStore();

  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme !== 'light';
  });

  React.useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('app-theme');
      setIsDarkMode(savedTheme !== 'light');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

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
  const [boardImageContextMenu, setBoardImageContextMenu] = React.useState<{
    open: boolean;
    x: number;
    y: number;
    imageId: string | null;
    imageUrl: string;
    type: 'generation' | 'edit' | 'asset';
  }>({ open: false, x: 0, y: 0, imageId: null, imageUrl: '', type: 'asset' });
  const boardImageMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [showBoardPicker, setShowBoardPicker] = React.useState(false);

  const closeBoardImageMenu = React.useCallback(() => {
    setBoardImageContextMenu(prev => prev.open ? { ...prev, open: false } : prev);
    setShowBoardPicker(false);
  }, []);

  const currentGeneration = React.useMemo(() => {
    if (boardImageContextMenu.type !== 'generation' || !boardImageContextMenu.imageId) {
      return null;
    }
    return generations.find(g => g.id === boardImageContextMenu.imageId) || null;
  }, [boardImageContextMenu.imageId, boardImageContextMenu.type, generations]);

  const currentEdit = React.useMemo(() => {
    if (boardImageContextMenu.type !== 'edit' || !boardImageContextMenu.imageId) {
      return null;
    }
    return edits.find(e => e.id === boardImageContextMenu.imageId) || null;
  }, [boardImageContextMenu.imageId, boardImageContextMenu.type, edits]);

  const parentGeneration = React.useMemo(() => {
    if (!currentEdit?.parentGenerationId) return null;
    return generations.find(g => g.id === currentEdit.parentGenerationId) || null;
  }, [currentEdit, generations]);

  const promptText = React.useMemo(() => {
    if (currentGeneration?.prompt) return currentGeneration.prompt;
    if (currentEdit?.instruction) return currentEdit.instruction;
    return '';
  }, [currentEdit, currentGeneration]);

  const isAssetItem = boardImageContextMenu.type === 'asset';

  const isFavorite = React.useMemo(() => {
    if (!boardImageContextMenu.imageId) return false;
    return isFavoriteImage(boardImageContextMenu.imageId);
  }, [boardImageContextMenu.imageId, isFavoriteImage]);

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

  const imageOverlayClasses = cn(
    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
    isDarkMode ? 'bg-black/60' : 'bg-white/60'
  );

  const cardActionButtonClasses = cn(
    'h-6 w-6 rounded-md transition-colors flex items-center justify-center border backdrop-blur-sm',
    isDarkMode
      ? 'bg-black/60 border-white/10 text-gray-100 hover:bg-black/70'
      : 'bg-white/90 border-slate-300/70 text-slate-600 hover:bg-slate-100 hover:text-slate-800 shadow-sm'
  );

  const cardActionDestructiveClasses = cn(
    'h-6 w-6 rounded-md transition-colors flex items-center justify-center border backdrop-blur-sm',
    isDarkMode
      ? 'bg-black/60 border-red-500/40 text-white hover:bg-red-500/60'
      : 'bg-white/90 border-red-300/70 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm'
  );

  const moveToBoardOverlayClasses = cn(
    'absolute inset-0 backdrop-blur-sm flex items-center justify-center p-2 z-10 transition-colors',
    isDarkMode ? 'bg-black/90' : 'bg-white/90'
  );

  const moveToBoardTitleClasses = cn(
    'text-xs font-semibold',
    isDarkMode ? 'text-gray-200' : 'text-gray-600'
  );

  const closeBoardMenuButtonClasses = cn(
    'text-xs transition-colors',
    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
  );

  const moveToBoardOptionClasses = (disabled: boolean) => cn(
    'w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between',
    disabled
      ? isDarkMode
        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : isDarkMode
        ? 'bg-white/5 text-gray-100 hover:bg-white/10'
        : 'bg-white text-gray-700 border border-purple-100 hover:bg-purple-50 shadow-sm'
  );

  const moveOptionActiveLabel = language === 'zh' ? '移动' : 'Move';
  const moveOptionAddedLabel = language === 'zh' ? '已添加' : 'Added';
  const generationBadgeLabel = language === 'zh' ? '生成' : 'Generation';
  const assetBadgeLabel = language === 'zh' ? '素材' : 'Asset';

  const handleSetCanvasImage = () => {
    if (!boardImageContextMenu.imageUrl) return;
    const origin = boardImageContextMenu.type === 'asset' ? 'asset' : 'board';
    setCanvasImage(boardImageContextMenu.imageUrl, origin);
    closeBoardImageMenu();
  };

  const handleOpenCanvasWorkspace = () => {
    if (!boardImageContextMenu.imageUrl) return;
    const origin = boardImageContextMenu.type === 'asset' ? 'asset' : 'board';
    setCanvasImage(boardImageContextMenu.imageUrl, origin);
    setActivePrimarySection('canvas');
    closeBoardImageMenu();
  };

  const handleAddAsReference = () => {
    if (!boardImageContextMenu.imageUrl) return;
    if (selectedTool === 'edit') {
      addEditReferenceImage(boardImageContextMenu.imageUrl);
    } else {
      addUploadedImage(boardImageContextMenu.imageUrl);
    }
    closeBoardImageMenu();
  };

  const handleAsMaskLayer = () => {
    if (!boardImageContextMenu.imageUrl) return;
    addEditReferenceImage(boardImageContextMenu.imageUrl);
    setSelectedTool('mask');
    setActivePrimarySection('canvas');
    closeBoardImageMenu();
  };

  const handleLoadWorkflow = () => {
    console.info('Load workflow requested from board context', boardImageContextMenu.imageId);
    closeBoardImageMenu();
  };

  const handleRecallMetadata = () => {
    const source = currentGeneration || parentGeneration;
    if (!source) {
      closeBoardImageMenu();
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
    closeBoardImageMenu();
  };

  const handleMetadataOverview = () => {
    if (!boardImageContextMenu.imageId || boardImageContextMenu.type === 'asset') {
      closeBoardImageMenu();
      return;
    }
    onInspectImage?.(boardImageContextMenu.type, boardImageContextMenu.imageId, boardImageContextMenu.imageUrl);
    closeBoardImageMenu();
  };

  const handleSendToUpscale = () => {
    if (!boardImageContextMenu.imageUrl) return;
    setCanvasImage(boardImageContextMenu.imageUrl, 'upscale');
    setActivePrimarySection('upscaling');
    closeBoardImageMenu();
  };

  const handleUseForPromptTemplate = () => {
    if (!promptText) {
      closeBoardImageMenu();
      return;
    }
    setCurrentPrompt(promptText);
    setActivePrimarySection('generate');
    closeBoardImageMenu();
  };

  const handleNewCanvasFromImage = () => {
    if (!boardImageContextMenu.imageUrl) return;
    const origin = boardImageContextMenu.type === 'asset' ? 'asset' : 'board';
    setCanvasImage(boardImageContextMenu.imageUrl, origin);
    setSelectedTool('edit');
    setActivePrimarySection('canvas');
    closeBoardImageMenu();
  };

  const handleBoardSelection = (targetBoardId: string) => {
    if (!boardImageContextMenu.imageId) return;
    moveImageToBoard(targetBoardId, boardImageContextMenu.imageId);
    setShowBoardPicker(false);
    closeBoardImageMenu();
  };

  const handleToggleFavorite = () => {
    if (!boardImageContextMenu.imageId) return;
    toggleFavoriteImage(boardImageContextMenu.imageId);
    closeBoardImageMenu();
  };

  const handleLocateImage = () => {
    if (!boardImageContextMenu.imageId || boardImageContextMenu.type === 'asset') {
      closeBoardImageMenu();
      return;
    }
    onLocateImage?.(boardImageContextMenu.type, boardImageContextMenu.imageId);
    closeBoardImageMenu();
  };

  const handleCopyPrompt = async () => {
    if (!promptText) {
      closeBoardImageMenu();
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
    } catch (error) {
      console.warn('Failed to copy prompt from board menu:', error);
    }
    closeBoardImageMenu();
  };

  const handleDownloadImage = () => {
    if (!boardImageContextMenu.imageUrl) return;
    void saveImageWithDialog(boardImageContextMenu.imageUrl, `${boardImageContextMenu.type}-image`);
    closeBoardImageMenu();
  };

  const handleRemoveFromBoard = () => {
    if (!selectedBoardId || !boardImageContextMenu.imageId) {
      closeBoardImageMenu();
      return;
    }
    removeImageFromBoard(selectedBoardId, boardImageContextMenu.imageId);
    closeBoardImageMenu();
  };

  // Handle asset file upload
  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && selectedBoardId) {
      try {
        // Upload to backend for better performance
        const uploadResult = await uploadAsset(file);
        const assetUrl = getAssetUrl(uploadResult.asset_id);
        
        // Add the uploaded asset ID (not URL) to the current board
        await addImageToBoard(selectedBoardId, uploadResult.asset_id);
      } catch (error) {
        console.error('Failed to upload asset:', error);
        // Fallback to base64 if upload fails
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            addImageToBoard(selectedBoardId, dataUrl);
          };
          reader.readAsDataURL(file);
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
        }
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
        // Upload to backend for better performance
        const uploadResult = await uploadAsset(file);
        const assetUrl = getAssetUrl(uploadResult.asset_id);
        await addImageToBoard(boardId, uploadResult.asset_id);
        setActiveTab('assets');
      } catch (error) {
        console.error('Failed to upload image to board:', error);
        // Fallback to base64 if upload fails
        try {
          const base64 = await blobToBase64(file);
          const dataUrl = `data:${file.type};base64,${base64}`;
          addImageToBoard(boardId, dataUrl);
          setActiveTab('assets');
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
        }
      }
    }

    event.target.value = '';
  }, [addImageToBoard]);

  React.useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId, setSelectedBoardId]);

  React.useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (event.button !== 0) return;
      closeBoardImageMenu();
    };
    const handleScroll = () => closeBoardImageMenu();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeBoardImageMenu();
      }
    };
    window.addEventListener('pointerdown', closeMenu);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', closeMenu);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('keydown', handleKey);
    };
  }, [closeBoardImageMenu]);

  React.useLayoutEffect(() => {
    if (!boardImageContextMenu.open || !boardImageMenuRef.current) return;
    const rect = boardImageMenuRef.current.getBoundingClientRect();
    const padding = 12;
    const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
    const maxY = Math.max(padding, window.innerHeight - rect.height - padding);
    const clampedX = Math.min(Math.max(padding, boardImageContextMenu.x), maxX);
    const clampedY = Math.min(Math.max(padding, boardImageContextMenu.y), maxY);
    if (clampedX !== boardImageContextMenu.x || clampedY !== boardImageContextMenu.y) {
      setBoardImageContextMenu(prev => ({ ...prev, x: clampedX, y: clampedY }));
    }
  }, [boardImageContextMenu.open, boardImageContextMenu.x, boardImageContextMenu.y]);

  const handleCreateBoard = () => {
    setCreateBoardError('');
    setShowCreateBoardModal(true);
  };

  const handleConfirmCreateBoard = async () => {
    if (newBoardName && newBoardName.trim()) {
      // Check if board name already exists
      const isDuplicate = boards.some(
        board => board.name.toLowerCase() === newBoardName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        setCreateBoardError('A board with this name already exists');
        return;
      }
      
      try {
        // Generate unique ID using timestamp and random number
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const uniqueId = `board-${timestamp}-${random}`;
        
        await addBoard({
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create board';
        setCreateBoardError(errorMessage);
      }
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
      <div
        className="flex items-center justify-between mb-3 pb-2 border-b border-vis-border flex-shrink-0"
      >
        <h4 className="text-xs font-semibold text-vis-text-secondary uppercase tracking-wide">
          {t.boards}
        </h4>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
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
            className="h-6 w-6 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Boards List */}
      <div className="flex-shrink-0 mb-3">
        {boards.length === 0 ? (
          <div className="text-center py-6 text-sm text-vis-text-muted">
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
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer border",
                      isSelected
                        ? "bg-gradient-to-r from-vis-teal-500/10 to-vis-cyan-500/10 text-vis-teal-300 border-vis-teal-400 shadow-vis-glow-teal"
                        : "border-transparent text-vis-text-secondary hover:bg-gray-800/50 hover:text-vis-text-primary"
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
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isSelected
                            ? 'text-vis-teal-300'
                            : 'text-vis-text-primary'
                        )}
                      >
                        {board.id === 'default' ? t.myCreations : board.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-vis-text-muted hover:text-vis-teal-300 hover:bg-gray-800/50 transition-colors"
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
                        className="h-6 w-6 text-vis-text-muted hover:text-vis-teal-300 hover:bg-gray-800/50 transition-colors"
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
                          className="h-6 w-6 text-vis-text-muted hover:text-red-400 hover:bg-red-500/20 transition-colors"
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
          className="fixed z-[9999] rounded-md shadow-vis-glow-teal py-1 w-48 border border-vis-border-light bg-gray-900/95 backdrop-blur-sm"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Board Title Header */}
          <div
            className="px-3 py-2 border-b border-vis-border"
          >
            <div className="flex items-center space-x-2">
              {(() => {
                const board = boards.find(b => b.id === contextMenu.boardId);
                if (!board) return null;
                return (
                  <>
                    {board.emoji ? (
                      <span className="text-base">{board.emoji}</span>
                    ) : (
                      <FolderOpen className="h-4 w-4 text-vis-teal-400" />
                    )}
                    <span className="text-sm font-semibold text-vis-text-primary truncate">
                      {board.id === 'default' ? t.myCreations : board.name}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          
          {/* Rename Board */}
          <button
            className="w-full text-left px-3 py-2 text-sm text-vis-text-primary hover:bg-gray-800/50 hover:text-vis-teal-300 flex items-center space-x-2 transition-colors"
            onClick={() => {
              if (contextMenu.boardId) {
                handleRenameBoard(contextMenu.boardId);
              }
              setContextMenu({ open: false, x: 0, y: 0, boardId: null });
            }}
          >
            <Edit2 className="h-4 w-4 text-vis-text-secondary" />
            <span>{t.renameBoard}</span>
          </button>

          {/* Download as Archive */}
          <button
            className="w-full text-left px-3 py-2 text-sm text-vis-text-primary hover:bg-gray-800/50 hover:text-vis-teal-300 flex items-center space-x-2 transition-colors"
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
            <svg className="h-4 w-4 text-vis-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{t.downloadBoard}</span>
          </button>

          {/* Delete Board - Only for non-default boards */}
          {contextMenu.boardId !== 'default' && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center space-x-2 transition-colors"
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
            <div
              className="flex w-full rounded-md p-0.5 border border-vis-border bg-gray-800/50"
            >
              <button
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-200",
                  activeTab === 'images'
                    ? 'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white shadow-vis-glow-teal border border-vis-teal-400/50'
                    : 'border border-transparent text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/70'
                )}
                onClick={() => setActiveTab('images')}
              >
                {t.images}
              </button>
              <button
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-all duration-200",
                  activeTab === 'assets'
                    ? 'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white shadow-vis-glow-teal border border-vis-teal-400/50'
                    : 'border border-transparent text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/70'
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
                      className="w-full flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-vis-border hover:border-vis-teal-400 bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-12 h-12 mb-3 rounded-xl bg-gray-800/50 border border-vis-border flex items-center justify-center">
                        <Upload className="h-6 w-6 text-vis-teal-400" />
                      </div>
                      <div className="text-xs text-vis-text-muted">{t.uploadImages}</div>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-800/50 border border-vis-border flex items-center justify-center">
                      🖼️
                    </div>
                    <div className="text-xs text-vis-text-muted">
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
                      className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-vis-border hover:border-vis-teal-400 transition-all duration-200 shadow-lg hover:shadow-vis-glow-teal"
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setActiveBoardImageMenu(null);
                        setShowBoardPicker(false);
                        setBoardImageContextMenu({
                          open: true,
                          x: event.clientX,
                          y: event.clientY,
                          imageId: item.imageId,
                          imageUrl: item.imageUrl,
                          type: item.type
                        });
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt="Board item"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className={imageOverlayClasses} />
                    </button>
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cardActionButtonClasses}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (boards.length <= 1) return;
                          setActiveBoardImageMenu(prev => prev === item.imageId ? null : item.imageId);
                        }}
                        title={t.moveToBoard}
                      >
                        <Folder className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cardActionDestructiveClasses}
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveBoardImageMenu(null);
                          if (selectedBoardId) {
                            removeImageFromBoard(selectedBoardId, item.imageId);
                          }
                        }}
                        title={t.removeFromBoard}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {activeBoardImageMenu === item.imageId && (
                      <div className={moveToBoardOverlayClasses}>
                        <div
                          className="rounded-lg p-3 w-full max-h-40 overflow-y-auto border"
                          style={{
                            background: 'var(--surface-secondary)',
                            borderColor: 'var(--surface-border)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={moveToBoardTitleClasses}>{t.moveToBoardTitle}</span>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveBoardImageMenu(null);
                              }}
                              className={closeBoardMenuButtonClasses}
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
                                  className={moveToBoardOptionClasses(alreadyInTarget)}
                                >
                                  <span className="flex items-center space-x-1.5">
                                    {target.emoji ? (
                                      <span className="text-base leading-none">{target.emoji}</span>
                                    ) : (
                                      <Folder className={cn('h-3 w-3', isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                                    )}
                                    <span className="truncate">{target.id === 'default' ? t.myCreations : target.name}</span>
                                  </span>
                                  {alreadyInTarget ? (
                                    <span className={cn('text-[10px] uppercase tracking-wide font-semibold', isDarkMode ? 'text-purple-300' : 'text-purple-500')}>
                                      {moveOptionAddedLabel}
                                    </span>
                                  ) : (
                                    <span className={cn('text-[10px] uppercase tracking-wide', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                                      {moveOptionActiveLabel}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {item.type === 'generation' && (
                      <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-md bg-vis-teal-500/80 text-white border border-vis-teal-400/50 backdrop-blur-sm shadow-vis-glow-teal">
                        {generationBadgeLabel}
                      </div>
                    )}
                    {item.type === 'asset' && (
                      <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-md bg-vis-purple-500/80 text-white border border-vis-purple-400/50 backdrop-blur-sm">
                        {assetBadgeLabel}
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
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl border"
            style={{
              background: 'var(--modal-surface-background)',
              borderColor: 'var(--modal-surface-border)',
              color: 'var(--text-primary)'
            }}
          >
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
                  className={cn(
                    "flex-1",
                    isDarkMode
                      ? "border-[var(--surface-border)] hover:bg-[var(--surface-secondary)]"
                      : "border-slate-300 hover:bg-slate-100"
                  )}
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
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl border"
            style={{
              background: 'var(--modal-surface-background)',
              borderColor: 'var(--modal-surface-border)',
              color: 'var(--text-primary)'
            }}
          >
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
                  className={cn(
                    "flex-1",
                    isDarkMode
                      ? "border-[var(--surface-border)] hover:bg-[var(--surface-secondary)]"
                      : "border-slate-300 hover:bg-slate-100"
                  )}
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
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl border"
            style={{
              background: 'var(--modal-surface-background)',
              borderColor: 'var(--modal-surface-border)',
              color: 'var(--text-primary)'
            }}
          >
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
                  className={cn(
                    "flex-1",
                    isDarkMode
                      ? "border-[var(--surface-border)] hover:bg-[var(--surface-secondary)]"
                      : "border-slate-300 hover:bg-slate-100"
                  )}
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {boardImageContextMenu.open && boardImageContextMenu.imageId && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] min-w-[220px] rounded-xl border border-vis-border-light shadow-vis-glow-teal backdrop-blur-sm bg-gray-900/95 p-2"
          ref={boardImageMenuRef}
          style={{
            left: boardImageContextMenu.x,
            top: boardImageContextMenu.y
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MenuItem
            icon={<PlusCircle className="h-4 w-4 text-cyan-400" />}
            label={t.addAsReference}
            onClick={handleAddAsReference}
            disabled={!boardImageContextMenu.imageUrl}
          />
          <MenuItem
            icon={<Download className="h-4 w-4 text-gray-300" />}
            label={t.downloadImage}
            onClick={handleDownloadImage}
            disabled={!boardImageContextMenu.imageUrl}
          />
          <MenuItem
            icon={<Trash2 className="h-4 w-4" />}
            label={t.removeFromBoard}
            onClick={handleRemoveFromBoard}
            destructive
            disabled={!selectedBoardId}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
 
