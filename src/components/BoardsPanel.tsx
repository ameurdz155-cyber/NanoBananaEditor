import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import {
  Layers,
  Search,
  Plus,
  Folder,
  Trash2,
  X,
  Eye,
  Download,
  ChevronUp,
  ChevronDown,
  Settings,
  Upload,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { saveImageWithDialog } from '../utils/fileSaver';

export const BoardsPanel: React.FC = () => {
  const {
    currentProject,
    setCanvasImage,
    selectGeneration,
    selectEdit,
    boards,
    addBoard,
    addImageToBoard,
    removeImageFromBoard,
    moveImageToBoard,
  } = useAppStore();

  const [showBoardsPanel, setShowBoardsPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [imagesExpanded, setImagesExpanded] = useState(true);
  const [currentTab, setCurrentTab] = useState<'images' | 'videos' | 'assets'>('images');
  const [showAddToBoard, setShowAddToBoard] = useState<string | null>(null);

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];
  
  const allImages = [
    ...generations.map(g => ({ type: 'generation' as const, item: g, id: g.id, timestamp: g.timestamp })),
    ...edits.map(e => ({ type: 'edit' as const, item: e, id: e.id, timestamp: e.timestamp }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleCreateBoard = () => {
    const name = prompt('Enter board name:');
    if (name && name.trim()) {
      const newBoard = {
        id: `board-${Date.now()}`,
        name: name.trim(),
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        imageIds: []
      };
      addBoard(newBoard);
    }
  };

  // Renaming and deletion handled elsewhere for now

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
        {/* Content Area - Split View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Section - Boards List */}
          <div className="flex-shrink-0 border-b border-gray-800">
            {/* Boards Header */}
            <div className="bg-gray-900/50 border-b border-gray-800">
              <button
                onClick={() => setBoardsExpanded(!boardsExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {boardsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-base font-bold text-gray-200">Boards</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">{currentProject?.title || 'My Project'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Settings action
                    }}
                    className="h-8 w-8 hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="h-8 w-8 hover:bg-gray-800"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </button>
            </div>

            {/* Boards Content - Collapsible */}
            {boardsExpanded && (
              <div className="bg-gray-950">
                <div className="border-b border-gray-800 px-6 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Boards</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCreateBoard}
                      className="h-6 w-6 hover:bg-gray-800"
                      title="Add Board"
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>

                {/* Boards List - Scrollable grid when many boards */}
                <div className="px-6 py-4">
                  <div className="grid gap-3 overflow-y-auto max-h-64 pr-1 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredBoards.map(board => {
                      const boardImages = allImages.filter(img => board.imageIds.includes(img.id));
                      const isSelected = selectedBoard === board.id;
                      
                      return (
                        <div
                          key={board.id}
                          className={cn(
                            "group relative w-full px-3 py-2.5 cursor-pointer transition-all border-l-4 rounded bg-gray-900/30",
                            isSelected
                              ? "border-purple-500 bg-gray-800/50"
                              : "border-transparent hover:bg-gray-800/40 hover:border-gray-700"
                          )}
                          onClick={() => setSelectedBoard(isSelected ? null : board.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              {board.emoji ? (
                                <span className="text-xl flex-shrink-0">{board.emoji}</span>
                              ) : (
                                <div className="w-10 h-10 rounded flex-shrink-0 bg-gray-800 flex items-center justify-center">
                                  <Folder className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "text-sm font-semibold truncate",
                                  isSelected ? "text-gray-100" : "text-gray-300"
                                )}>
                                  {board.name}
                                </div>
                                {board.id === 'default' && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-semibold">
                                    AUTO
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Counts */}
                            <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
                              <span className={cn(isSelected && "text-gray-400")}>{boardImages.length}</span>
                              <span>|</span>
                              <span className={cn(isSelected && "text-gray-400")}>0</span>
                              <span>|</span>
                              <span className={cn(isSelected && "text-gray-400")}>0</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section - Images Gallery */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Gallery Header */}
            <div className="flex-shrink-0 bg-gray-900/50 border-b border-gray-800">
              <button
                onClick={() => setImagesExpanded(!imagesExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {imagesExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-base font-bold text-gray-200">
                    {selectedBoard ? boards.find(b => b.id === selectedBoard)?.name : 'Uncategorized'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Tabs */}
                  <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTab('images');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold transition-colors",
                        currentTab === 'images'
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      Generated Images
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTab('videos');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold transition-colors",
                        currentTab === 'videos'
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      Videos
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTab('assets');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold transition-colors",
                        currentTab === 'assets'
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      )}
                    >
                      Assets
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 hover:bg-gray-800"
                    title="Upload Image(s)"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="h-8 w-8 hover:bg-gray-800"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </button>
            </div>

            {/* Gallery Content */}
            {imagesExpanded && (
              <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
            {selectedBoard ? (
              <>

                {getCurrentBoardImages().length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Layers className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No images in this board</h3>
                    <p className="text-sm text-gray-600">Start adding images to organize your work</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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
                                    setShowAddToBoard(id);
                                  }}
                                  title="Move to another board"
                                >
                                  <Folder className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-white/10 hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImageFromBoard(selectedBoard, id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Add to Board Menu for current board view */}
                            {showAddToBoard === id && (
                              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 z-10">
                                <div className="bg-gray-900 rounded-lg p-3 w-full max-h-[200px] overflow-y-auto">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-300">Move to Board</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddToBoard(null);
                                      }}
                                      className="text-gray-400 hover:text-gray-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {boards.filter(b => b.id !== selectedBoard).map(board => {
                                      const isInBoard = board.imageIds.includes(id);
                                      return (
                                        <button
                                          key={board.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Move image to selected board (remove from current, add to target)
                                            moveImageToBoard(board.id, id);
                                            setShowAddToBoard(null);
                                          }}
                                          className={cn(
                                            "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                                            isInBoard 
                                              ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30" 
                                              : "text-gray-300 hover:bg-gray-800"
                                          )}
                                        >
                                          <span className="flex items-center space-x-1.5">
                                            {board.emoji ? (
                                              <span>{board.emoji}</span>
                                            ) : (
                                              <Folder className="h-3 w-3 text-gray-500" />
                                            )}
                                            <span className="truncate">{board.name}</span>
                                          </span>
                                          {isInBoard && <span className="text-purple-400">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

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
                                    setShowAddToBoard(id);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Add to Board Menu */}
                            {showAddToBoard === id && (
                              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 z-10">
                                <div className="bg-gray-900 rounded-lg p-3 w-full max-h-[200px] overflow-y-auto">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-300">Add to Board</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddToBoard(null);
                                      }}
                                      className="text-gray-400 hover:text-gray-200"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {boards.map(board => {
                                      const isInBoard = board.imageIds.includes(id);
                                      return (
                                        <button
                                          key={board.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isInBoard) {
                                            removeImageFromBoard(board.id, id);
                                          } else {
                                            addImageToBoard(board.id, id);
                                          }
                                          setShowAddToBoard(null);
                                        }}
                                          className={cn(
                                            "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                                            isInBoard 
                                              ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30" 
                                              : "text-gray-300 hover:bg-gray-800"
                                          )}
                                        >
                                          <span className="flex items-center space-x-1.5">
                                            {board.emoji ? (
                                              <span>{board.emoji}</span>
                                            ) : (
                                              <Folder className="h-3 w-3 text-gray-500" />
                                            )}
                                            <span className="truncate">{board.name}</span>
                                          </span>
                                          {isInBoard && <span className="text-purple-400">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};