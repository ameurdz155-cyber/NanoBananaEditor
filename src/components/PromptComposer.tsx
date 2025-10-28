import React, { useState, useRef } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw, AlertCircle, Settings, FileText, Sparkles, X, Check } from 'lucide-react';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';
import { validateApiKey, improvePromptText } from '../services/geminiService';
import { TemplatesView, DEFAULT_TEMPLATES } from './TemplatesView';
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
    clearUploadedImages,
    clearEditReferenceImages,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
    apiKeyError,
    setApiKeyError,
    selectedTemplate,
    language,
  } = useAppStore();

  const t = getTranslation(language);

  const { generate } = useImageGeneration();
  const { edit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleImprovePrompt = async () => {
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
    
    // Get the selected template if any
    const template = selectedTemplate ? DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate) : null;
    
    // Combine user prompt with template
    let finalPrompt = currentPrompt;
    let negativePrompt = '';
    
    if (template) {
      // Replace {prompt} placeholder in template with user's actual prompt
      finalPrompt = template.positivePrompt.replace('{prompt}', currentPrompt);
      negativePrompt = template.negativePrompt || '';
    }
    
    if (selectedTool === 'generate') {
      generate({
        prompt: finalPrompt,
        negativePrompt: negativePrompt || undefined,
        referenceImages: undefined,
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
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
        <button
          onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
          className="w-full p-4 flex items-center justify-between text-left group hover:bg-gray-900/30 transition-all rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-750 transition-all">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-200 block">
                {selectedTemplate !== 'none' 
                  ? (DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate)?.name || selectedTemplate)
                  : t.templates}
              </span>
              <span className="text-xs text-gray-500">
                {showTemplatesPanel ? t.clickToCollapse : t.clickToManageTemplates}
              </span>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200",
            showTemplatesPanel && "rotate-180"
          )} />
        </button>

        {/* Templates Panel */}
        {showTemplatesPanel && (
          <div className="border-t border-gray-800 p-4 max-h-96 overflow-y-auto">
            <TemplatesView onTemplateSelect={() => setShowTemplatesPanel(false)} />
          </div>
        )}
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
        
        {/* Template Instruction */}
        {selectedTemplate && (() => {
          const template = selectedTemplate ? DEFAULT_TEMPLATES.find(t => t.id === selectedTemplate) : null;
          if (!template) return null;
          
          return (
            <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-purple-300 mb-1">{t.activeTemplate}: {template.name}</p>
                  <p className="text-xs text-gray-300 break-words mb-2">
                    <span className="text-purple-400 font-medium">{t.positive}:</span> {template.positivePrompt}
                  </p>
                  {template.negativePrompt && (
                    <p className="text-xs text-gray-400 break-words">
                      <span className="text-red-400 font-medium">{t.negative}:</span> {template.negativePrompt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        
        <p className="text-xs text-gray-500 mb-3">
          {selectedTool === 'generate' 
            ? selectedTemplate 
              ? t.enterCustomPrompt
              : t.enterPromptAndInvoke
            : t.describeChanges}
        </p>
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            selectedTool === 'generate'
              ? selectedTemplate
                ? t.promptPlaceholderGenerate
                : t.promptPlaceholderGenerate
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
            disabled={isImproving || !currentPrompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-purple-500/30"
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2" />
                <span>{t.improving}</span>
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
                  <p className="text-sm text-gray-200 leading-relaxed">{improvedPrompt}</p>
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
    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />
    </>
  );
};