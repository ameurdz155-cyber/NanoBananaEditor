import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Mic,
  MicOff,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { saveImageWithDialog } from '../utils/fileSaver';
import { transformImageToDimensions } from '../utils/imageUtils';

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
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const language = useAppStore(s => s.language);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'zh-CN'>(() => (language === 'zh' ? 'zh-CN' : 'en-US'));
  const voiceLangWasManuallyChanged = React.useRef(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];
  
  const allImages = [
    ...generations.map(g => ({ type: 'generation' as const, item: g, id: g.id, timestamp: g.timestamp })),
    ...edits.map(e => ({ type: 'edit' as const, item: e, id: e.id, timestamp: e.timestamp }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  useEffect(() => {
    const SpeechRecognitionCtor = typeof window !== 'undefined'
      ? ((window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
        || (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition)
      : undefined;

    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = voiceLang;
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) {
        setSearchQuery(transcript);
        searchInputRef.current?.focus();
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort?.();
        } catch (error) {
          console.warn('Failed to stop speech recognition', error);
        }
      }
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    if (!voiceLangWasManuallyChanged.current) {
      setVoiceLang(defaultVoiceLang);
    } else if (voiceLang === defaultVoiceLang) {
      voiceLangWasManuallyChanged.current = false;
    }
  }, [language, voiceLang]);

  const startVoiceSearch = () => {
    if (!voiceSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.lang = voiceLang;
      recognition.start();
      setListening(true);
    } catch (error) {
      console.error('Unable to start speech recognition', error);
      setListening(false);
    }
  };

  const stopVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
      recognition.abort?.();
    } catch (error) {
      console.warn('Unable to stop speech recognition', error);
    } finally {
      setListening(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (!voiceSupported) return;
    if (listening) stopVoiceSearch();
    else startVoiceSearch();
  };

  const handleVoiceLangChange = (value: string) => {
    if (value !== 'en-US' && value !== 'zh-CN') return;
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    voiceLangWasManuallyChanged.current = value !== defaultVoiceLang;
    setVoiceLang(value);
  };

  const voiceLangLabel = voiceLang === 'zh-CN' ? '中文' : 'English';

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

  const downloadWithDimensions = useCallback(async (imageUrl: string, width?: number, height?: number) => {
    let preparedUrl = imageUrl;
    if (width && height && width > 0 && height > 0) {
      try {
        preparedUrl = await transformImageToDimensions(imageUrl, width, height, 'cover');
      } catch (error) {
        console.error('Failed to normalize board image dimensions before download:', error);
      }
    }

    saveImageWithDialog(preparedUrl);
  }, [saveImageWithDialog]);

  if (!showBoardsPanel) {
    return (
      <div className="fixed top-20 left-4 z-40">
        <Button
          onClick={() => setShowBoardsPanel(true)}
          className="bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800/90 border border-vis-border hover:border-vis-teal-500/50 shadow-vis-glow-teal transition-all duration-200"
        >
          <Layers className="h-4 w-4 mr-2 text-vis-teal-400" />
          <span className="text-vis-text-primary">Boards</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowBoardsPanel(false)}
      />
      
      {/* Main Panel */}
      <div className="relative w-full max-w-7xl mx-auto my-8 bg-vis-panel flex flex-col overflow-hidden shadow-vis-glow-teal rounded-2xl border border-vis-border-light">
        {/* Content Area - Split View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Section - Boards List */}
          <div className="flex-shrink-0 border-b border-vis-border">
            {/* Boards Header */}
            <div className="bg-gray-900/70 border-b border-vis-border">
              <button
                onClick={() => setBoardsExpanded(!boardsExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/90 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  {boardsExpanded ? (
                    <ChevronUp className="h-5 w-5 text-vis-teal-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-vis-teal-400" />
                  )}
                  <span className="text-base font-bold text-vis-teal-300">Boards</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-vis-text-secondary">{currentProject?.title || 'My Project'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Settings action
                    }}
                    className="h-8 w-8 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="h-8 w-8 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </button>
            </div>

            {/* Boards Content - Collapsible */}
            {boardsExpanded && (
              <div className="bg-gray-950/50">
                <div className="border-b border-vis-border px-6 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-vis-text-secondary uppercase tracking-wider">Boards</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCreateBoard}
                      className="h-6 w-6 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
                      title="Add Board"
                    >
                      <Plus className="h-4 w-4" />
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
                            "group relative w-full px-3 py-2.5 cursor-pointer transition-all duration-200 border-l-4 rounded bg-gray-800/30 hover:bg-gray-800/50",
                            isSelected
                              ? "bg-gradient-to-r from-vis-teal-500/10 to-vis-cyan-500/10 border-vis-teal-400 shadow-vis-glow-teal"
                              : "border-transparent hover:border-vis-teal-500/30"
                          )}
                          onClick={() => setSelectedBoard(isSelected ? null : board.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              {board.emoji ? (
                                <span className="text-xl flex-shrink-0">{board.emoji}</span>
                              ) : (
                                <div className="w-10 h-10 rounded flex-shrink-0 bg-gray-800/50 flex items-center justify-center border border-vis-border">
                                  <Folder className="h-5 w-5 text-vis-text-muted" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div
                                  className={cn(
                                    "text-sm font-semibold truncate",
                                    isSelected
                                      ? 'text-vis-teal-300'
                                      : 'text-vis-text-primary'
                                  )}
                                >
                                  {board.name}
                                </div>
                                {board.id === 'default' && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-vis-cyan-500/20 text-vis-cyan-400 rounded text-[10px] font-semibold border border-vis-cyan-500/30">
                                    AUTO
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Counts */}
                            <div className="flex items-center space-x-1 text-xs text-vis-text-muted ml-2">
                              <span className={cn(isSelected && "text-vis-text-secondary")}>{boardImages.length}</span>
                              <span>|</span>
                              <span className={cn(isSelected && "text-vis-text-secondary")}>0</span>
                              <span>|</span>
                              <span className={cn(isSelected && "text-vis-text-secondary")}>0</span>
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
            <div className="flex-shrink-0 bg-gray-900/70 border-b border-vis-border">
              <button
                onClick={() => setImagesExpanded(!imagesExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/90 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  {imagesExpanded ? (
                    <ChevronUp className="h-5 w-5 text-vis-cyan-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-vis-cyan-400" />
                  )}
                  <span className="text-base font-bold text-vis-cyan-300">
                    {selectedBoard ? boards.find(b => b.id === selectedBoard)?.name : 'Uncategorized'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Tabs */}
                  <div className="flex bg-gray-800/50 rounded-lg overflow-hidden border border-vis-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTab('images');
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        currentTab === 'images'
                          ? "bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white shadow-vis-glow-teal"
                          : "text-vis-text-secondary hover:text-vis-teal-300"
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
                        "px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        currentTab === 'videos'
                          ? "bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white shadow-vis-glow-teal"
                          : "text-vis-text-secondary hover:text-vis-teal-300"
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
                        "px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                        currentTab === 'assets'
                          ? "bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 text-white shadow-vis-glow-teal"
                          : "text-vis-text-secondary hover:text-vis-teal-300"
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
                    className="h-8 w-8 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-cyan-300 transition-colors"
                    title="Upload Image(s)"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="h-8 w-8 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-cyan-300 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="h-8 w-8 hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-cyan-300 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </button>
            </div>

            {/* Gallery Content */}
            {imagesExpanded && (
              <div className="flex-1 overflow-y-auto bg-gray-950/50 p-6">
            {selectedBoard ? (
              <>

                {getCurrentBoardImages().length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-vis-teal-500/10 to-vis-cyan-500/10 flex items-center justify-center border border-vis-border shadow-vis-glow-teal">
                      <Layers className="h-10 w-10 text-vis-teal-400" />
                    </div>
                    <h3 className="text-lg font-medium text-vis-text-primary mb-2">No images in this board</h3>
                    <p className="text-sm text-vis-text-muted">Start adding images to organize your work</p>
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
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-vis-border hover:border-vis-teal-400 bg-gray-900/50 relative transition-all duration-200 cursor-pointer shadow-lg hover:shadow-vis-glow-teal">
                            <img
                              src={imageUrl}
                              alt={type === 'generation' ? 'Generation' : 'Edit'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                setCanvasImage(imageUrl, 'board');
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
                                  className="bg-gray-900/70 hover:bg-vis-teal-500/50 border border-vis-border hover:border-vis-teal-400/50 text-vis-text-primary hover:text-white transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCanvasImage(imageUrl, 'board');
                                    setShowBoardsPanel(false);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-gray-900/70 hover:bg-vis-teal-500/50 border border-vis-border hover:border-vis-teal-400/50 text-vis-text-primary hover:text-white transition-all duration-200"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const targetWidth = type === 'generation'
                                      ? item.parameters?.width
                                      : item.outputAssets?.[0]?.width;
                                    const targetHeight = type === 'generation'
                                      ? item.parameters?.height
                                      : item.outputAssets?.[0]?.height;
                                    await downloadWithDimensions(imageUrl, targetWidth, targetHeight);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="bg-gray-900/70 hover:bg-vis-cyan-500/50 border border-vis-border hover:border-vis-cyan-400/50 text-vis-text-primary hover:text-white transition-all duration-200"
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
                                  className="bg-gray-900/70 hover:bg-red-500/50 border border-vis-border hover:border-red-400/50 text-vis-text-primary hover:text-white transition-all duration-200"
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
                                <div className="bg-gray-900/95 rounded-lg p-3 w-full max-h-[200px] overflow-y-auto border border-vis-border-light shadow-vis-glow-teal">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-vis-teal-300">Move to Board</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddToBoard(null);
                                      }}
                                      className="text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
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
                                            "w-full text-left px-2 py-1.5 rounded text-xs transition-all duration-200 flex items-center justify-between",
                                            isInBoard 
                                              ? "bg-vis-teal-500/20 text-vis-teal-300 hover:bg-vis-teal-500/30 border border-vis-teal-500/30" 
                                              : "text-vis-text-primary hover:bg-gray-800/50 border border-transparent"
                                          )}
                                        >
                                          <span className="flex items-center space-x-1.5">
                                            {board.emoji ? (
                                              <span>{board.emoji}</span>
                                            ) : (
                                              <Folder className="h-3 w-3 text-vis-text-muted" />
                                            )}
                                            <span className="truncate">{board.name}</span>
                                          </span>
                                          {isInBoard && <span className="text-vis-teal-400">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Type Badge */}
                            <div className={cn(
                              "absolute top-2 left-2 text-xs px-2 py-1 rounded-md font-medium border backdrop-blur-sm",
                              type === 'generation' 
                                ? "bg-vis-teal-500/80 text-white border-vis-teal-400/50 shadow-vis-glow-teal" 
                                : "bg-vis-purple-500/80 text-white border-vis-purple-400/50"
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
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-vis-teal-500/10 to-vis-cyan-500/10 flex items-center justify-center border border-vis-border shadow-vis-glow-teal">
                      <div className="text-4xl">🎨</div>
                    </div>
                    <h3 className="text-lg font-medium text-vis-text-primary mb-2">No images yet</h3>
                    <p className="text-sm text-vis-text-muted">Start creating to see your work here</p>
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
                          <div className="aspect-square rounded-lg overflow-hidden border border-vis-border hover:border-vis-teal-400 bg-gray-900/50 relative transition-all duration-200 cursor-pointer shadow-lg hover:shadow-vis-glow-teal">
                            <img
                              src={imageUrl}
                              alt={type === 'generation' ? 'Generation' : 'Edit'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onClick={() => {
                                setCanvasImage(imageUrl, 'board');
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
                                  className="h-7 w-7 bg-black/50 hover:bg-vis-teal-500/50 p-0 text-vis-text-primary hover:text-white transition-colors border border-transparent hover:border-vis-teal-400/50"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const targetWidth = type === 'generation'
                                      ? item.parameters?.width
                                      : item.outputAssets?.[0]?.width;
                                    const targetHeight = type === 'generation'
                                      ? item.parameters?.height
                                      : item.outputAssets?.[0]?.height;
                                    await downloadWithDimensions(imageUrl, targetWidth, targetHeight);
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 bg-black/50 hover:bg-vis-teal-500/50 p-0 text-vis-text-primary hover:text-white transition-colors border border-transparent hover:border-vis-teal-400/50"
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
                                <div className="bg-gray-900/95 rounded-lg p-3 w-full max-h-[200px] overflow-y-auto border border-vis-border-light shadow-vis-glow-teal">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-vis-teal-300">Add to Board</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAddToBoard(null);
                                      }}
                                      className="text-vis-text-secondary hover:text-vis-teal-300 transition-colors"
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
                                            "w-full text-left px-2 py-1.5 rounded text-xs transition-all duration-200 flex items-center justify-between",
                                            isInBoard 
                                              ? "bg-vis-teal-500/20 text-vis-teal-300 hover:bg-vis-teal-500/30 border border-vis-teal-500/30" 
                                              : "text-vis-text-primary hover:bg-gray-800/50 border border-transparent"
                                          )}
                                        >
                                          <span className="flex items-center space-x-1.5">
                                            {board.emoji ? (
                                              <span>{board.emoji}</span>
                                            ) : (
                                              <Folder className="h-3 w-3 text-vis-text-muted" />
                                            )}
                                            <span className="truncate">{board.name}</span>
                                          </span>
                                          {isInBoard && <span className="text-vis-teal-400">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Type Badge */}
                            <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-md bg-gray-900/90 backdrop-blur-sm text-vis-text-primary opacity-0 group-hover:opacity-100 transition-opacity border border-vis-border">
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