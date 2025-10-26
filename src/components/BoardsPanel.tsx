import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { 
  Folder, 
  Plus, 
  Search, 
  Grid, 
  MoreVertical,
  FolderOpen,
  Star,
  Clock,
  Share2,
  Download,
  Copy,
  Eye,
  Sparkles
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Board {
  id: string;
  name: string;
  emoji?: string;
  itemCount: number;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  dimensions: string;
}

export const BoardsPanel: React.FC = () => {
  const { currentProject } = useAppStore();
  
  const [showBoardsPanel, setShowBoardsPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'projects' | 'templates'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Mock boards data - in real app, this would come from store
  const [boards] = useState<Board[]>([
    {
      id: 'recent-1',
      name: 'Landscape Series',
      itemCount: 12,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      thumbnail: currentProject?.generations[0]?.outputAssets[0]?.url
    },
    {
      id: 'recent-2',
      name: 'Portrait Collection',
      emoji: '👤',
      itemCount: 8,
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 3600000,
      thumbnail: currentProject?.generations[1]?.outputAssets[0]?.url
    },
    {
      id: 'recent-3',
      name: 'Digital Art',
      emoji: '🎨',
      itemCount: 15,
      createdAt: Date.now() - 259200000,
      updatedAt: Date.now() - 7200000,
    }
  ]);

  const templates: Template[] = [
    {
      id: 'instagram-post',
      name: 'Instagram Post',
      category: 'Social Media',
      thumbnail: 'https://via.placeholder.com/400x400/667eea/ffffff?text=IG+Post',
      dimensions: '1080 × 1080 px'
    },
    {
      id: 'instagram-story',
      name: 'Instagram Story',
      category: 'Social Media',
      thumbnail: 'https://via.placeholder.com/400x711/764ba2/ffffff?text=IG+Story',
      dimensions: '1080 × 1920 px'
    },
    {
      id: 'youtube-thumbnail',
      name: 'YouTube Thumbnail',
      category: 'Video',
      thumbnail: 'https://via.placeholder.com/1280x720/ec4899/ffffff?text=YouTube',
      dimensions: '1280 × 720 px'
    },
    {
      id: 'facebook-post',
      name: 'Facebook Post',
      category: 'Social Media',
      thumbnail: 'https://via.placeholder.com/940x788/10b981/ffffff?text=FB+Post',
      dimensions: '940 × 788 px'
    },
    {
      id: 'twitter-post',
      name: 'Twitter Post',
      category: 'Social Media',
      thumbnail: 'https://via.placeholder.com/1200x675/06b6d4/ffffff?text=Twitter',
      dimensions: '1200 × 675 px'
    },
    {
      id: 'presentation',
      name: 'Presentation',
      category: 'Document',
      thumbnail: 'https://via.placeholder.com/1920x1080/f59e0b/ffffff?text=Slides',
      dimensions: '1920 × 1080 px'
    }
  ];

  const categories = ['all', 'Social Media', 'Video', 'Document', 'Print'];

  const filteredTemplates = templates.filter(template => 
    (selectedCategory === 'all' || template.category === selectedCategory) &&
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock images data - would come from the selected board's generations
  const mockImages = currentProject?.generations.slice(0, 12).map(gen => gen.outputAssets[0]?.url).filter(Boolean) || [];

  if (!showBoardsPanel) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => setShowBoardsPanel(true)}
          className="bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800 border border-gray-700 shadow-lg"
        >
          <Folder className="h-4 w-4 mr-2" />
          Projects
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
      
      {/* Main Panel - Canva Style */}
      <div className="relative w-full bg-gray-950 flex flex-col overflow-hidden shadow-2xl">
        {/* Top Navigation - Canva Style */}
        <div className="flex-shrink-0 h-16 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-100">AI POD Lite</h1>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('projects')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === 'projects' 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                Your Projects
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
                Templates
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBoardsPanel(false)}
              className="h-9 w-9 hover:bg-gray-800"
            >
              <span className="text-xl text-gray-400">×</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {viewMode === 'projects' ? (
            <div>
              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">Start creating</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setShowBoardsPanel(false)}
                    className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500 bg-gray-900/30 hover:bg-gray-900/50 transition-all flex flex-col items-center justify-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600/20 group-hover:bg-purple-600/30 flex items-center justify-center mb-2 transition-all">
                      <Plus className="h-6 w-6 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-purple-300">Create blank</span>
                  </button>
                  
                  {templates.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setShowBoardsPanel(false)}
                      className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-800 hover:border-purple-500 bg-gray-900 hover:scale-105 transition-all group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative h-full flex items-center justify-center p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📐</div>
                          <div className="text-sm font-medium text-gray-200 mb-1">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.dimensions}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Projects */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-200 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-gray-400" />
                    Recent designs
                  </h2>
                  <button className="text-sm text-purple-400 hover:text-purple-300">
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className="group cursor-pointer"
                      onClick={() => setShowBoardsPanel(false)}
                    >
                      <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-800 hover:border-purple-500 bg-gray-900 mb-2 relative transition-all group-hover:scale-105">
                        {board.thumbnail ? (
                          <img
                            src={board.thumbnail}
                            alt={board.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <span className="text-4xl">{board.emoji || '🎨'}</span>
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-1">
                        <h3 className="text-sm font-medium text-gray-200 truncate mb-1">{board.name}</h3>
                        <p className="text-xs text-gray-500">{board.itemCount} images</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Projects Gallery */}
              {mockImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-200 flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-gray-400" />
                      Your creations
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Favorites
                      </Button>
                      <Button variant="outline" size="sm">
                        <Grid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {mockImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="group cursor-pointer"
                        onClick={() => setShowBoardsPanel(false)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-purple-500 bg-gray-900 relative transition-all group-hover:scale-105">
                          <img
                            src={imageUrl}
                            alt={`Creation ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Hover actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col space-y-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 bg-black/50 hover:bg-black/70 p-0">
                                <Star className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 bg-black/50 hover:bg-black/70 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Selection checkbox */}
                          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-5 w-5 rounded border-2 border-white bg-black/30" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Templates View
            <div>
              {/* Category Filter */}
              <div className="mb-6 flex items-center space-x-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      selectedCategory === category
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    )}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setShowBoardsPanel(false)}
                    className="group cursor-pointer text-left"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-800 hover:border-purple-500 bg-gray-900 mb-2 relative transition-all group-hover:scale-105">
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/10 to-pink-600/10">
                        <div className="text-center p-4">
                          <div className="text-3xl mb-2">📱</div>
                          <div className="text-xs text-gray-400">{template.dimensions}</div>
                        </div>
                      </div>
                      
                      {/* Use button overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Copy className="h-4 w-4 mr-2" />
                          Use template
                        </Button>
                      </div>
                    </div>
                    
                    <div className="px-1">
                      <h3 className="text-sm font-medium text-gray-200 truncate mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
