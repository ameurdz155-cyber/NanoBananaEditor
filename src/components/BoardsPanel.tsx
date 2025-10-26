import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { 
  Folder, 
  Plus, 
  Search, 
  Grid, 
  List, 
  MoreVertical,
  FolderOpen,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Board {
  id: string;
  name: string;
  emoji?: string;
  itemCount: number;
  createdAt: number;
  updatedAt: number;
}

export const BoardsPanel: React.FC = () => {
  const { currentProject } = useAppStore();
  
  const [showBoardsPanel, setShowBoardsPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<string[]>(['uncategorized']);
  const [selectedBoard, setSelectedBoard] = useState<string | null>('uncategorized');
  
  // Mock boards data - in real app, this would come from store
  const [boards, setBoards] = useState<Board[]>([
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

  // Mock images data - would come from the selected board's generations
  const mockImages = currentProject?.generations.slice(0, 8).map(gen => gen.outputAssets[0]?.url) || [];

  if (!showBoardsPanel) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => setShowBoardsPanel(true)}
          className="bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800 border border-gray-700 shadow-lg"
        >
          <Folder className="h-4 w-4 mr-2" />
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
      
      {/* Panel */}
      <div className="relative w-full max-w-5xl bg-gray-950 border-r border-gray-800 flex overflow-hidden shadow-2xl">
        {/* Sidebar - Boards List */}
        <div className="w-72 bg-gray-900/50 border-r border-gray-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-200 flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                Boards
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBoardsPanel(false)}
                className="h-8 w-8"
              >
                ×
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Boards List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  My Boards
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCreateBoard}
                  className="h-6 w-6"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {boards
                .filter(board => board.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(board => (
                  <div key={board.id} className="mb-1">
                    <button
                      onClick={() => {
                        setSelectedBoard(board.id);
                        toggleBoard(board.id);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group",
                        selectedBoard === board.id
                          ? "bg-purple-500/20 text-purple-300"
                          : "hover:bg-gray-800 text-gray-400"
                      )}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {expandedBoards.includes(board.id) ? (
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 flex-shrink-0" />
                        )}
                        {board.emoji ? (
                          <span className="text-lg flex-shrink-0">{board.emoji}</span>
                        ) : (
                          <FolderOpen className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{board.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {board.id === 'uncategorized' && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                            AUTO
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{board.itemCount}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-xs text-gray-500">0</span>
                      </div>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Main Content - Image Gallery */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-200 mb-1">
                  {boards.find(b => b.id === selectedBoard)?.name || 'Select a Board'}
                </h3>
                <p className="text-sm text-gray-500">
                  {mockImages.length} images
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded transition-all",
                      viewMode === 'grid' 
                        ? "bg-gray-700 text-gray-200" 
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded transition-all",
                      viewMode === 'list' 
                        ? "bg-gray-700 text-gray-200" 
                        : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center space-x-1 mt-4">
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                Images
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                Videos
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                Assets
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div className="flex-1 overflow-y-auto p-6">
            {mockImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-400 mb-2">No images yet</h4>
                <p className="text-sm text-gray-600">
                  Generate some images to see them here
                </p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                viewMode === 'grid' 
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {mockImages.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setShowBoardsPanel(false)}
                    className={cn(
                      "relative group rounded-xl overflow-hidden border-2 border-gray-800 hover:border-purple-500 transition-all duration-200 shadow-lg hover:shadow-purple-500/20",
                      viewMode === 'grid' ? "aspect-square" : "aspect-video"
                    )}
                  >
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-gray-900/80 hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle more actions
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-xs text-white font-medium">
                            Image #{index + 1}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/30">
            <div className="text-xs text-gray-500 text-center">
              Activate Windows • Go to Settings to activate Windows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
