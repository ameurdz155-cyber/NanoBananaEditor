import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { saveImageWithDialog } from '../utils/fileSaver';
import { transformImageToDimensions } from '../utils/imageUtils';

export const useKeyboardShortcuts = () => {
  const {
    setSelectedTool,
    setShowHistory,
    showHistory,
    setShowPromptPanel,
    showPromptPanel,
    currentPrompt,
    isGenerating,
    canvasImage,
    lastGenerationParameters,
    selectedTool
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Handle Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (canvasImage) {
          let imageForSave = canvasImage;

          const targetWidth = selectedTool === 'generate' ? lastGenerationParameters?.width : undefined;
          const targetHeight = selectedTool === 'generate' ? lastGenerationParameters?.height : undefined;
          if (targetWidth && targetHeight && targetWidth > 0 && targetHeight > 0) {
            try {
              imageForSave = await transformImageToDimensions(canvasImage, targetWidth, targetHeight, 'cover');
            } catch (error) {
              console.error('Failed to normalize image dimensions for download:', error);
            }
          }

          saveImageWithDialog(imageForSave);
        }
        return;
      }

      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        // Only handle Ctrl + Enter for generation (Windows-compatible)
        if (event.ctrlKey && event.key === 'Enter') {
          event.preventDefault();
          if (!isGenerating && currentPrompt.trim()) {
            console.log('Generate via keyboard shortcut');
          }
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'e':
          event.preventDefault();
          setSelectedTool('edit');
          break;
        case 'g':
          event.preventDefault();
          setSelectedTool('generate');
          break;
        case 'm':
          event.preventDefault();
          setSelectedTool('mask');
          break;
        case 'h':
          event.preventDefault();
          setShowHistory(!showHistory);
          break;
        case 'p':
          event.preventDefault();
          setShowPromptPanel(!showPromptPanel);
          break;
        case 'r':
          if (event.shiftKey) {
            event.preventDefault();
            console.log('Re-roll variants');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canvasImage,
    currentPrompt,
    isGenerating,
    lastGenerationParameters,
  selectedTool,
  setSelectedTool,
    setShowHistory,
    setShowPromptPanel,
    showHistory,
    showPromptPanel
  ]);
};