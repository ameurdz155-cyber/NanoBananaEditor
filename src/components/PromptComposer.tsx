import React, { useState, useRef } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Upload, Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw, AlertCircle, Settings, FileText, Sparkles, X, Check, FolderPlus, ArrowRightLeft, Folder } from 'lucide-react';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';
import { validateApiKey, improvePromptText } from '../services/geminiService';

// Prompt templates
const promptTemplates = [
  { 
    id: 'none',
    name: 'None',
    prompt: ''
  },
  {
    id: 'landscape',
    name: 'Landscape Photography',
    prompt: 'A breathtaking landscape photograph of [subject], golden hour lighting, dramatic clouds, vibrant colors, ultra detailed, 8k resolution, professional photography'
  },
  {
    id: 'portrait',
    name: 'Portrait Photography',
    prompt: 'Professional portrait photography of [subject], studio lighting, shallow depth of field, sharp focus on eyes, elegant pose, high quality, Canon EOS R5'
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    prompt: 'Digital art illustration of [subject], vibrant colors, detailed, trending on artstation, concept art, smooth, sharp focus, illustration, art by artgerm and greg rutkowski'
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    prompt: 'Photorealistic image of [subject], highly detailed, 8k uhd, high quality, cinematic lighting, professional photography, dslr'
  },
  {
    id: 'anime',
    name: 'Anime Style',
    prompt: 'Anime style illustration of [subject], detailed, colorful, studio ghibli style, trending on pixiv, high quality artwork'
  },
  {
    id: 'watercolor',
    name: 'Watercolor Art',
    prompt: 'Beautiful watercolor painting of [subject], soft colors, artistic, detailed, high quality, watercolor paper texture'
  },
  {
    id: '3d-render',
    name: '3D Render',
    prompt: '3D render of [subject], octane render, unreal engine 5, highly detailed, volumetric lighting, 8k, photorealistic'
  },
];

export const PromptComposer: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedTool,
    setSelectedTool,
    temperature,
    setTemperature,
    seed,
    setSeed,
    isGenerating,
    uploadedImages,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    removeEditReferenceImage,
    clearEditReferenceImages,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
    apiKeyError,
    setApiKeyError,
    boards,
    addBoard,
    addImageToBoard,
    removeImageFromBoard,
    moveImageToBoard,
  } = useAppStore();

  const { generate } = useImageGeneration();
  const { edit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [isImproving, setIsImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const [showBoardMenu, setShowBoardMenu] = useState<number | null>(null);

  // Clean up images when switching tools
  React.useEffect(() => {
    // When switching away from mask mode, clear brush strokes
    // This ensures a clean state when switching tools
    return () => {
      // Cleanup if needed
    };
  }, [selectedTool]);

  // Close template dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };

    if (showTemplateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTemplateDropdown]);

  const handleTemplateSelect = (template: { id: string; name: string; prompt: string }) => {
    setSelectedTemplate(template.name);
    setCurrentPrompt(template.prompt);
    setShowTemplateDropdown(false);
  };

  const handleImprovePrompt = async () => {
    if (!currentPrompt.trim()) return;
    
    setIsImproving(true);
    setApiKeyError(null);
    
    try {
      const improved = await improvePromptText(currentPrompt);
      setImprovedPrompt(improved);
    } catch (error: any) {
      console.error('Failed to improve prompt:', error);
      setApiKeyError(error.message || 'Failed to improve prompt. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleAcceptImprovedPrompt = () => {
    if (improvedPrompt) {
      setCurrentPrompt(improvedPrompt);
      setImprovedPrompt(null);
    }
  };

  const handleRejectImprovedPrompt = () => {
    setImprovedPrompt(null);
  };

  const isImageInBoard = (boardId: string, imageUrl: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.imageIds.includes(imageUrl) || false;
  };

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

  const handleGenerate = async () => {
    if (!currentPrompt.trim()) return;
    
    // Clear previous errors
    setApiKeyError(null);
    
    // Validate API key before generating
    setIsValidating(true);
    const validation = await validateApiKey();
    setIsValidating(false);
    
    if (!validation.valid) {
      setApiKeyError(validation.error || 'Invalid API key. Please check Settings.');
      return;
    }
    
    if (selectedTool === 'generate') {
      const referenceImages = uploadedImages
        .filter(img => img.includes('base64,'))
        .map(img => img.split('base64,')[1]);
        
      generate({
        prompt: currentPrompt,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        temperature,
        seed: seed || undefined
      });
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      edit(currentPrompt);
    }
  };

  const handleClearSession = () => {
    setCurrentPrompt('');
    clearUploadedImages();
    clearEditReferenceImages();
    clearBrushStrokes();
    setCanvasImage(null);
    setSeed(null);
    setTemperature(0.7);
    setShowClearConfirm(false);
  };

  const tools = [
    { id: 'generate', icon: Wand2, label: 'Generate', description: 'Create from text' },
    { id: 'edit', icon: Edit3, label: 'Edit', description: 'Modify existing' },
    { id: 'mask', icon: MousePointer, label: 'Select', description: 'Click to select' },
  ] as const;

  if (!showPromptPanel) {
    return (
      <div className="w-8 bg-gray-950 border-r border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowPromptPanel(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-r-lg border border-l-0 border-gray-700 flex items-center justify-center transition-colors group"
          title="Show Prompt Panel"
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

  return (
    <>
    <div className="w-80 lg:w-72 xl:w-80 h-full bg-gray-950 border-r border-gray-800 p-6 flex flex-col space-y-6 overflow-y-auto">
      <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Select Mode</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose how you want to create</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHintsModal(true)}
              className="h-7 w-7 hover:bg-gray-800"
              title="Tips & Help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromptPanel(false)}
              className="h-7 w-7 hover:bg-gray-800"
              title="Hide Prompt Panel"
            >
              ×
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={cn(
                'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden',
                selectedTool === tool.id
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
              )}
            >
              {selectedTool === tool.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse" />
              )}
              <tool.icon className={cn(
                "h-5 w-5 mb-2 relative z-10 transition-colors",
                selectedTool === tool.id ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              )} />
              <span className={cn(
                "text-xs font-semibold relative z-10 transition-colors",
                selectedTool === tool.id ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-300'
              )}>{tool.label}</span>
              <span className={cn(
                "text-[10px] mt-0.5 relative z-10 transition-colors",
                selectedTool === tool.id ? 'text-purple-400/70' : 'text-gray-500'
              )}>{tool.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Artboards Section - Images Generated */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Artboards</h3>
              <p className="text-xs text-gray-500">Images generated</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).length} / 2
          </span>
        </div>
        
        {/* Artboards Grid */}
        {((selectedTool === 'generate' && uploadedImages.length > 0) || 
          (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Artboard ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-700 group-hover:border-purple-500 transition-colors"
                />
                
                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBoardMenu(showBoardMenu === index ? null : index);
                      }}
                      title="Add to board"
                    >
                      <FolderPlus className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-white/10 hover:bg-red-500/50 backdrop-blur-sm"
                      onClick={() => selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index)}
                      title="Remove"
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>

                {/* Board Selection Menu */}
                {showBoardMenu === index && (
                  <div className="absolute inset-0 bg-black/95 backdrop-blur-sm rounded-lg z-10 p-2 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-200">Manage Board</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBoardMenu(null);
                        }}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {boards.map(board => {
                        const isInBoard = isImageInBoard(board.id, image);
                        return (
                          <div key={board.id} className="space-y-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isInBoard) {
                                  removeImageFromBoard(board.id, image);
                                } else {
                                  addImageToBoard(board.id, image);
                                }
                              }}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between group",
                                isInBoard 
                                  ? "bg-purple-500/30 text-purple-200 hover:bg-purple-500/40" 
                                  : "text-gray-300 hover:bg-gray-800"
                              )}
                            >
                              <span className="flex items-center space-x-1.5 truncate">
                                {board.emoji ? (
                                  <span>{board.emoji}</span>
                                ) : (
                                  <Folder className="h-3 w-3 text-gray-500" />
                                )}
                                <span className="truncate">{board.name}</span>
                              </span>
                              <div className="flex items-center space-x-1">
                                {isInBoard && <span className="text-purple-300 text-sm">✓</span>}
                                {!isInBoard && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveImageToBoard(board.id, image);
                                      setShowBoardMenu(null);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Move to this board only"
                                  >
                                    <ArrowRightLeft className="h-3 w-3 text-gray-500 hover:text-blue-400" />
                                  </button>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                      
                      {/* Create New Board Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateBoard();
                          setShowBoardMenu(null);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center space-x-1.5 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 mt-2"
                      >
                        <FolderPlus className="h-3 w-3" />
                        <span>Create New Board</span>
                      </button>
                    </div>
                    
                    {/* Action Hint */}
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-[10px] text-gray-500 text-center">
                        Click to add/remove • Hover & click → to move
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-xs px-2 py-1 rounded text-white font-medium">
                  Artboard {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Template Selector */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all relative" ref={templateDropdownRef}>
        <button
          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
          className="w-full p-4 flex items-center justify-between text-left group hover:bg-gray-900/30 transition-all rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-750 transition-all">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-200 block">
                {selectedTemplate ? selectedTemplate : 'Choose Prompt Template'}
              </span>
              {selectedTemplate && (
                <span className="text-xs text-gray-500">Click to change template</span>
              )}
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200",
            showTemplateDropdown && "rotate-180"
          )} />
        </button>

        {/* Dropdown Menu */}
        {showTemplateDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
            <div className="p-2 space-y-1">
              {promptTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200 group",
                    selectedTemplate === template.name
                      ? "bg-purple-500/20 border border-purple-500/50"
                      : "hover:bg-gray-800 border border-transparent"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <FileText className={cn(
                      "h-5 w-5 flex-shrink-0 mt-0.5",
                      selectedTemplate === template.name ? "text-purple-400" : "text-gray-400 group-hover:text-gray-300"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "text-sm font-semibold",
                          selectedTemplate === template.name ? "text-purple-300" : "text-gray-200"
                        )}>
                          {template.name}
                        </span>
                        {selectedTemplate === template.name && (
                          <span className="text-xs text-purple-400">✓ Selected</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {template.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prompt Input - Enhanced Card Design */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"></span>
            {selectedTool === 'generate' ? 'Generate from Text' : 'Edit Instructions'}
          </label>
          <button 
            onClick={() => setShowHintsModal(true)}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            title="Prompt tips"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {selectedTool === 'generate' 
            ? 'Enter a prompt and Invoke.'
            : 'Describe the changes you want to make.'}
        </p>
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            selectedTool === 'generate'
              ? 'A serene mountain landscape at sunset with a lake reflecting the golden sky, photorealistic, detailed...'
              : 'Make the sky more dramatic, add storm clouds, enhance lighting...'
          }
          className="min-h-[120px] resize-none bg-gray-800 border-gray-700 focus:border-purple-500 transition-colors"
        />
        
        {/* Improve Prompt Button */}
        <div className="mt-2 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprovePrompt}
            disabled={isImproving || !currentPrompt.trim() || !!improvedPrompt}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-purple-500/30"
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2" />
                <span>Improving...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                <span>Improve Prompt</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Improved Prompt Preview */}
        {improvedPrompt && (
          <div className="mt-3 p-3 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">Improved Prompt</span>
              </div>
              <button
                onClick={handleRejectImprovedPrompt}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-200 mb-3 leading-relaxed">{improvedPrompt}</p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleAcceptImprovedPrompt}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRejectImprovedPrompt}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </div>
        )}
        
        {/* Prompt Quality Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {currentPrompt.length < 20 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400">Needs more detail</span>
              </>
            ) : currentPrompt.length < 50 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-400">Good prompt</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-green-400">Excellent prompt</span>
              </>
            )}
          </div>
          <span className="text-gray-500">{currentPrompt.length} characters</span>
        </div>
      </div>


      {/* API Key Error Message */}
      {apiKeyError && (
        <div className="glass border border-red-500/30 bg-red-900/20 rounded-xl p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-medium">{apiKeyError}</p>
              <button
                onClick={() => {
                  const event = new CustomEvent('openSettings');
                  window.dispatchEvent(event);
                }}
                className="mt-2 flex items-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Settings className="h-3 w-3 mr-1" />
                Open Settings to configure API key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button - Inspired by Reference UI */}
      <div className="space-y-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || isValidating || !currentPrompt.trim()}
          className="relative w-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          size="lg"
        >
          {isValidating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              <span className="text-white">Validating...</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              <span className="text-white">Generating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Wand2 className="h-5 w-5 mr-2" />
              <span className="text-white">
                {selectedTool === 'generate' ? 'Invoke' : 'Apply Edit'}
              </span>
            </div>
          )}
        </Button>
        <p className="text-xs text-center text-gray-500">
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">Ctrl + Enter</kbd> to generate
        </p>
      </div>

      {/* Advanced Controls */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
        </button>
        
        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Session
        </button>
        
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-300 mb-3">
              Are you sure you want to clear this session? This will remove all uploads, prompts, and canvas content.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSession}
                className="flex-1"
              >
                Yes, Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Temperature */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Creativity ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Seed */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Seed (optional)
              </label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Random"
                className="w-full h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Shortcuts</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Save Image</span>
            <span>Ctrl + S</span>
          </div>
          <div className="flex justify-between">
            <span>Generate</span>
            <span>Ctrl + Enter</span>
          </div>
          <div className="flex justify-between">
            <span>Re-roll</span>
            <span>Shift + R</span>
          </div>
          <div className="flex justify-between">
            <span>Edit mode</span>
            <span>E</span>
          </div>
          <div className="flex justify-between">
            <span>History</span>
            <span>H</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle Panel</span>
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />
    </>
  );
};