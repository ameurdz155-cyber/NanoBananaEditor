import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { 
  Layers, 
  Search, 
  Grid, 
  MoreVertical,
  Star,
  Clock,
  Share2,
  Download,
  Eye,
  Sparkles,
  Plus,
  Folder,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { saveImageWithDialog } from '../utils/fileSaver';

interface Board {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  imageIds: string[]; // IDs of generations/edits in this board
}

export const BoardsPanel: React.FC = () => {
  const { 
    currentProject, 
    setCanvasImage,
    selectGeneration,
    selectEdit,
  } = useAppStore();
  
  const [showBoardsPanel, setShowBoardsPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'boards' | 'templates'>('boards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>(() => {
    // Load boards from localStorage
    const saved = localStorage.getItem('ai-pod-boards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'default',
        name: 'My Creations',
        emoji: '🎨',
        description: 'All your generated images',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        imageIds: []
      }
    ];
  });

  // Save boards to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('ai-pod-boards', JSON.stringify(boards));
  }, [boards]);

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];
  
  const allImages = [
    ...generations.map(g => ({ type: 'generation' as const, item: g, id: g.id, timestamp: g.timestamp })),
    ...edits.map(e => ({ type: 'edit' as const, item: e, id: e.id, timestamp: e.timestamp }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleCreateBoard = () => {
    const name = prompt('Enter board name:');
    if (name && name.trim()) {
      const emoji = prompt('Enter an emoji (optional):') || '📁';
      const newBoard: Board = {
        id: `board-${Date.now()}`,
        name: name.trim(),
        emoji,
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        imageIds: []
      };
      setBoards([...boards, newBoard]);
    }
  };

  const handleRenameBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    
    const newName = prompt('Enter new name:', board.name);
    if (newName && newName.trim()) {
      setBoards(boards.map(b => 
        b.id === boardId 
          ? { ...b, name: newName.trim(), updatedAt: Date.now() }
          : b
      ));
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boardId === 'default') {
      alert('Cannot delete the default board');
      return;
    }
    
    if (confirm('Are you sure you want to delete this board?')) {
      setBoards(boards.filter(b => b.id !== boardId));
      if (selectedBoard === boardId) {
        setSelectedBoard(null);
      }
    }
  };

  const handleAddToBoard = (boardId: string, imageId: string) => {
    setBoards(boards.map(b => 
      b.id === boardId
        ? { ...b, imageIds: [...b.imageIds, imageId], updatedAt: Date.now() }
        : b
    ));
  };

  const handleRemoveFromBoard = (boardId: string, imageId: string) => {
    setBoards(boards.map(b => 
      b.id === boardId
        ? { ...b, imageIds: b.imageIds.filter(id => id !== imageId), updatedAt: Date.now() }
        : b
    ));
  };

  const getCurrentBoardImages = () => {
    if (!selectedBoard) return allImages;
    const board = boards.find(b => b.id === selectedBoard);
    if (!board) return allImages;
    return allImages.filter(img => board.imageIds.includes(img.id));
  };

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!showBoardsPanel) {
    return (
      <div className="fixed top-20 left-4 z-40">
        <Button
          onClick={() => setShowBoardsPanel(true)}
          className="bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800 border border-gray-700 shadow-lg"
        >
          <Layers className="h-4 w-4 mr-2" />
          Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowBoardsPanel(false)}
      />
      
      {/* Main Panel */}
      <div className="relative w-full max-w-7xl mx-auto my-8 bg-gray-950 flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-gray-800">
        {/* Top Navigation */}
        <div className="flex-shrink-0 h-16 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-100">Boards Manager</h1>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('boards')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'boards' 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Folder className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                My Boards
              </button>
              <button
                onClick={() => setViewMode('templates')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'templates' 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Grid className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                All Images
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <Button
              onClick={handleCreateBoard}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBoardsPanel(false)}
              className="h-9 w-9 hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Boards List */}
          {viewMode === 'boards' && (
            <div className="w-64 border-r border-gray-800 bg-gray-900/30 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Boards ({boards.length})
              </h3>
              <div className="space-y-1">
                {filteredBoards.map(board => {
                  const boardImages = allImages.filter(img => board.imageIds.includes(img.id));
                  return (
                    <div
                      key={board.id}
                      className={cn(
                        "group relative rounded-lg p-3 cursor-pointer transition-all",
                        selectedBoard === board.id
                          ? "bg-purple-500/20 border border-purple-500/50"
                          : "hover:bg-gray-800 border border-transparent"
                      )}
                      onClick={() => setSelectedBoard(board.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-xl flex-shrink-0">{board.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-200 truncate">
                              {board.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {boardImages.length} images
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameBoard(board.id);
                            }}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Edit2 className="h-3 w-3 text-gray-400" />
                          </button>
                          {board.id !== 'default' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBoard(board.id);
                              }}
                              className="p-1 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Content - Images Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {viewMode === 'boards' && selectedBoard ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">
                    {boards.find(b => b.id === selectedBoard)?.emoji} {boards.find(b => b.id === selectedBoard)?.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {getCurrentBoardImages().length} images in this board
                  </p>
                </div>

                {getCurrentBoardImages().length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Layers className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No images in this board</h3>
                    <p className="text-sm text-gray-600">Start adding images to organize your work</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {getCurrentBoardImages().map(({ type, item, id }) => {
                      const imageUrl = type === 'generation' 
                        ? item.outputAssets[0]?.url 
                        : item.outputAssets[0]?.url;
                      
                      if (!imageUrl) return null;

                      return (
                        <div key={id} className="group relative">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-800 hover:border-purple-500 bg-gray-900 relative transition-all cursor-pointer">
                            <img
                              src={imageUrl}
                              alt={type === 'generation' ? 'Generation' : 'Edit'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                setCanvasImage(imageUrl);
                                if (type === 'generation') {
                                  selectGeneration(id);
                                  selectEdit(null);
                                } else {
                                  selectEdit(id);
                                  selectGeneration(null);
                                }
                                setShowBoardsPanel(false);
                              }}
                            />
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-white/10 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCanvasImage(imageUrl);
                                    setShowBoardsPanel(false);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-white/10 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveImageWithDialog(imageUrl);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-white/10 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromBoard(selectedBoard, id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Type Badge */}
                            <div className={cn(
                              "absolute top-2 left-2 text-xs px-2 py-1 rounded font-medium",
                              type === 'generation' 
                                ? "bg-blue-600/80 text-white" 
                                : "bg-purple-600/80 text-white"
                            )}>
                              {type === 'generation' ? 'Gen' : 'Edit'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">All Images</h2>
                  <p className="text-sm text-gray-400">
                    {allImages.length} total images • {generations.length} generations • {edits.length} edits
                  </p>
                </div>

                {allImages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <div className="text-4xl">🎨</div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No images yet</h3>
                    <p className="text-sm text-gray-600">Start creating to see your work here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {allImages.map(({ type, item, id }) => {
                      const imageUrl = type === 'generation' 
                        ? item.outputAssets[0]?.url 
                        : item.outputAssets[0]?.url;
                      
                      if (!imageUrl) return null;

                      return (
                        <div key={id} className="group relative">
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 bg-gray-900 relative transition-all cursor-pointer">
                            <img
                              src={imageUrl}
                              alt={type === 'generation' ? 'Generation' : 'Edit'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                setCanvasImage(imageUrl);
                                if (type === 'generation') {
                                  selectGeneration(id);
                                  selectEdit(null);
                                } else {
                                  selectEdit(id);
                                  selectGeneration(null);
                                }
                                setShowBoardsPanel(false);
                              }}
                            />
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 bg-black/50 hover:bg-black/70 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveImageWithDialog(imageUrl);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 bg-black/50 hover:bg-black/70 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const boardId = prompt('Enter board ID to add to (or leave empty for default):') || 'default';
                                    handleAddToBoard(boardId, id);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Type Badge */}
                            <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-md bg-gray-900/90 backdrop-blur-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};