import React, { useState } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw, AlertCircle, Settings, FileText, Sparkles, X, Check, Upload } from 'lucide-react';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';
import { validateApiKey, improvePromptText } from '../services/geminiService';
import { TemplatesView } from './TemplatesView';
import * as Dialog from '@radix-ui/react-dialog';
import { getTranslation } from '../i18n/translations';

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
    addUploadedImage,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    addEditReferenceImage,
    removeEditReferenceImage,
    clearEditReferenceImages,
    canvasImage,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
    apiKeyError,
    setApiKeyError,
    language,
  } = useAppStore();

  const t = getTranslation(language);

  const { generate, cancelGeneration } = useImageGeneration();
  const { edit, cancelEdit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);

  // Clean up images when switching tools
  React.useEffect(() => {
    // When switching away from mask mode, clear brush strokes
    // This ensures a clean state when switching tools
    return () => {
      // Cleanup if needed
    };
  }, [selectedTool]);


  const handleImprovePrompt = async () => {
    // If already improving, stop the improvement
    if (isImproving) {
      setIsImproving(false);
      return;
    }

    if (!currentPrompt.trim()) return;
    
    setIsImproving(true);
    setApiKeyError(null);
    
    try {
      const improved = await improvePromptText(currentPrompt, language);
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

  const handleGenerate = async () => {
    // If already generating, stop the generation
    if (isGenerating) {
      if (selectedTool === 'generate') {
        cancelGeneration();
      } else {
        cancelEdit();
      }
      return;
    }

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
        negativePrompt: undefined,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        temperature,
        seed: seed || undefined
      });
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      edit(currentPrompt);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        // Read file as data URL (includes the data:image/...;base64, prefix)
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          if (selectedTool === 'generate') {
            // Add to reference images (max 2)
            if (uploadedImages.length < 2) {
              addUploadedImage(dataUrl);
            }
          } else if (selectedTool === 'edit') {
            // For edit mode, add to separate edit reference images (max 2)
            if (editReferenceImages.length < 2) {
              addEditReferenceImage(dataUrl);
            }
            // Set as canvas image if none exists
            if (!canvasImage) {
              setCanvasImage(dataUrl);
            }
          } else if (selectedTool === 'mask') {
            // For mask mode, set as canvas image immediately
            clearUploadedImages();
            addUploadedImage(dataUrl);
            setCanvasImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
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
    { id: 'generate', icon: Wand2, label: t.generate, description: t.createFromText },
    { id: 'edit', icon: Edit3, label: t.edit, description: t.modifyExisting },
    { id: 'mask', icon: MousePointer, label: t.select, description: t.clickToSelect },
  ] as const;

  if (!showPromptPanel) {
    return (
      <div className="w-8 bg-gray-950 border-r border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowPromptPanel(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-r-lg border border-l-0 border-gray-700 flex items-center justify-center transition-colors group"
          title={t.showPromptPanel}
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
      <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">{t.selectMode}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t.chooseHowToCreate}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHintsModal(true)}
              className="h-7 w-7 hover:bg-gray-800"
              title={t.promptTips}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromptPanel(false)}
              className="h-7 w-7 hover:bg-gray-800"
              title={t.hidePromptPanel}
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
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Template Selector */}
      <div className="rounded-xl border border-gray-850 bg-gray-950/80">
        <button
          type="button"
          onClick={() => setShowTemplatesModal(true)}
          className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-left transition-all hover:bg-gray-900/40"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-gray-100">
                {t.templates}
              </span>
              <span className="text-[11px] text-gray-500">
                {t.clickToManageTemplates}
              </span>
            </div>
          </div>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-gray-500 transition-all",
            showTemplatesModal && "rotate-180 border-gray-700 bg-gray-900 text-gray-200"
          )}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Prompt Input - Enhanced Card Design */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"></span>
            {selectedTool === 'generate' ? t.generateFromText : t.editInstructions}
          </label>
          <button 
            onClick={() => setShowHintsModal(true)}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            title={t.promptTips}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        {/* Mode-specific help text */}
        <div className="mb-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
          {selectedTool === 'generate' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Generate Mode
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Creates a <span className="text-gray-300 font-medium">completely new image</span> from your text description. Not related to any image on the artboard.
              </p>
              <p className="text-xs text-purple-400 italic">
                💡 Tip: Use the <span className="font-medium">Seed</span> in Advanced Controls to preserve series work and create consistent variations.
              </p>
            </div>
          )}
          
          {selectedTool === 'edit' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <Edit3 className="h-3 w-3 mr-1.5" />
                Edit Mode
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Modifies the <span className="text-gray-300 font-medium">entire image on the artboard</span>. Describe the changes you want to make to the whole image.
              </p>
            </div>
          )}
          
          {selectedTool === 'mask' && (
            <div className="space-y-1.5">
              <p className="text-xs text-cyan-400 font-medium flex items-center">
                <MousePointer className="h-3 w-3 mr-1.5" />
                Select Mode
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Edits <span className="text-gray-300 font-medium">only the areas you brush</span> on the artboard. Paint with your brush to select regions, then describe the changes.
              </p>
              <p className="text-xs text-orange-400">
                ⚠️ Only brushed areas will be affected. Unmasked areas remain unchanged.
              </p>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mb-3">
          {selectedTool === 'generate' 
            ? t.enterPromptAndInvoke
            : t.describeChanges}
        </p>
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            selectedTool === 'generate'
              ? t.promptPlaceholderGenerate
              : t.promptPlaceholderEdit
          }
          className="min-h-[120px] resize-none bg-gray-800 border-gray-700 focus:border-purple-500 transition-colors"
        />
        
        {/* Improve Prompt Button */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprovePrompt}
            disabled={!currentPrompt.trim() && !isImproving}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-purple-500/30"
          >
            {isImproving ? (
              <>
                <X className="h-3 w-3 mr-2" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                <span>{t.improvePrompt}</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Improved Prompt Modal */}
        <Dialog.Root open={!!improvedPrompt} onOpenChange={(open) => !open && handleRejectImprovedPrompt()}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-purple-500/30 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto z-50 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    {t.improvedPromptTitle}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>
              
              <div className="space-y-4">
                {/* Original Prompt */}
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">{t.originalPrompt}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{currentPrompt}</p>
                </div>
                
                {/* Improved Prompt */}
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                  <h4 className="text-xs font-semibold text-purple-300 mb-2 uppercase tracking-wider">{t.improvedVersion}</h4>
                  <Textarea
                    value={improvedPrompt || ''}
                    onChange={(e) => setImprovedPrompt(e.target.value)}
                    className="min-h-[120px] resize-none bg-gray-800/50 border-purple-500/30 focus:border-purple-500 text-gray-200 text-sm leading-relaxed"
                    placeholder="Improved prompt will appear here..."
                  />
                  <p className="text-xs text-gray-400 mt-2">{t.canEditImproved}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    size="lg"
                    onClick={handleAcceptImprovedPrompt}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t.acceptAndUse}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleRejectImprovedPrompt}
                    className="flex-1 border-gray-600 hover:bg-gray-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t.keepOriginal}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        
        {/* Prompt Quality Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {currentPrompt.length < 20 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400">{t.needsMoreDetail}</span>
              </>
            ) : currentPrompt.length < 50 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-400">{t.goodPrompt}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-green-400">{t.excellentPrompt}</span>
              </>
            )}
          </div>
          <span className="text-gray-500">{currentPrompt.length} {t.characters}</span>
        </div>
      </div>

      {/* Reference Images Upload */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 mr-2"></span>
            {selectedTool === 'generate' ? t.addReferenceImages : selectedTool === 'edit' ? 'Style References' : 'Upload Image'}
          </label>
        </div>
        
        {selectedTool === 'mask' && (
          <p className="text-xs text-gray-500 mb-3">
            Upload an image to edit with mask painting
          </p>
        )}
        {selectedTool === 'edit' && (
          <p className="text-xs text-gray-500 mb-3">
            {canvasImage ? 'Optional style references, up to 2 images' : 'Upload image to edit, up to 2 images'}
          </p>
        )}
        {selectedTool === 'generate' && (
          <p className="text-xs text-gray-500 mb-3">
            Upload up to 2 reference images to guide the style and composition
          </p>
        )}
        
        <input
          type="file"
          id="reference-image-upload"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          onClick={() => document.getElementById('reference-image-upload')?.click()}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={
            (selectedTool === 'generate' && uploadedImages.length >= 2) ||
            (selectedTool === 'edit' && editReferenceImages.length >= 2)
          }
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>

        {/* Show uploaded images preview */}
        {((selectedTool === 'generate' && uploadedImages.length > 0) ||
          (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
          <div className="mt-3 space-y-2">
            {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-gray-700"
                />
                <button
                  onClick={() => selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index)}
                  className="absolute top-1 right-1 bg-gray-900/90 text-gray-400 hover:text-red-400 rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
      <div className="space-y-2 flex-shrink-0">
        <Button
          onClick={handleGenerate}
          disabled={isValidating || (!isGenerating && !currentPrompt.trim())}
          className="relative w-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          size="lg"
        >
          {isValidating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              <span className="text-white">{t.validating}</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center">
              <X className="h-5 w-5 mr-2" />
              <span className="text-white">{t.stopGeneration}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Wand2 className="h-5 w-5 mr-2" />
              <span className="text-white">
                {selectedTool === 'generate' ? t.invoke : t.applyEdit}
              </span>
            </div>
          )}
        </Button>
        <p className="text-xs text-center text-gray-500">
          {t.pressCtrlEnter}
        </p>
      </div>

      {/* Advanced Controls */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          {showAdvanced ? t.hideAdvancedControls : t.showAdvancedControls}
        </button>
        
        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t.clearSession}
        </button>
        
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-300 mb-3">
              {t.clearSessionConfirm}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSession}
                className="flex-1"
              >
                {t.yesClear}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Temperature */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                {t.creativity} ({temperature})
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
                {t.seed}
              </label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={t.random}
                className="w-full h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-gray-800 flex-shrink-0">
        <h4 className="text-xs font-medium text-gray-400 mb-2">{t.shortcuts}</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>{t.saveImage}</span>
            <span>Ctrl + S</span>
          </div>
          <div className="flex justify-between">
            <span>{t.generate}</span>
            <span>Ctrl + Enter</span>
          </div>
          <div className="flex justify-between">
            <span>{t.reRoll}</span>
            <span>Shift + R</span>
          </div>
          <div className="flex justify-between">
            <span>{t.editMode}</span>
            <span>E</span>
          </div>
          <div className="flex justify-between">
            <span>{t.history}</span>
            <span>H</span>
          </div>
          <div className="flex justify-between">
            <span>{t.togglePanel}</span>
            <span>P</span>
          </div>
        </div>
      </div>
    </div>

    {/* Templates Modal */}
    <Dialog.Root open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,26rem)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-900 p-5 shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
                <FileText className="h-4 w-4" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-100">
                {t.templates}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {t.clickToManageTemplates}
          </p>
          <div className="mt-4 h-[60vh] flex min-h-0">
            <TemplatesView onTemplateSelect={() => setShowTemplatesModal(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />
    </>
  );
};