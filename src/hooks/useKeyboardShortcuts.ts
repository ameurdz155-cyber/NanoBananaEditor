import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useKeyboardShortcuts = () => {
  const {
    setSelectedTool,
    setShowHistory,
    showHistory,
    setShowPromptPanel,
    showPromptPanel,
    currentPrompt,
    isGenerating,
    isValidating,
    selectedTool,
    setActivePrimarySection,
    currentProject,
    selectedGenerationId,
    selectedEditId,
    setCurrentPrompt,
    setLastGenerationParameters,
    promptHistory
  } = useAppStore();

  useEffect(() => {
    // Ensure re-roll can fall back to recent prompts when the composer text is empty.
    const resolveRerollPrompt = () => {
      const trimmed = currentPrompt.trim();
      if (trimmed) {
        return trimmed;
      }

      const generations = currentProject?.generations ?? [];
      const edits = currentProject?.edits ?? [];

      if (selectedGenerationId) {
        const match = generations.find((generation) => generation.id === selectedGenerationId);
        if (match?.prompt?.trim()) {
          const params = match.parameters;
          if (params?.width && params?.height) {
            setLastGenerationParameters({
              width: params.width,
              height: params.height,
              aspectRatio: params.aspectRatio
            });
          }
          return match.prompt.trim();
        }
      }

      if (selectedEditId) {
        const editMatch = edits.find((edit) => edit.id === selectedEditId);
        if (editMatch?.instruction?.trim()) {
          return editMatch.instruction.trim();
        }
      }

      const latestGeneration = generations[generations.length - 1];
      if (latestGeneration?.prompt?.trim()) {
        const params = latestGeneration.parameters;
        if (params?.width && params?.height) {
          setLastGenerationParameters({
            width: params.width,
            height: params.height,
            aspectRatio: params.aspectRatio
          });
        }
        return latestGeneration.prompt.trim();
      }

      const fromHistory = promptHistory.find((entry) => entry.trim().length > 0);
      if (fromHistory) {
        return fromHistory.trim();
      }

      return '';
    };

    const triggerGeneration = (source: 'keyboard' | 'reroll') => {
      let prompt = currentPrompt.trim();

      if (source === 'reroll') {
        prompt = resolveRerollPrompt();
        if (prompt && prompt !== currentPrompt) {
          setCurrentPrompt(prompt);
        }
      }

      if (!prompt) {
        return;
      }

      if (isGenerating || isValidating) {
        return;
      }

      setSelectedTool('generate');
      setActivePrimarySection('generate');
      setShowPromptPanel(true);
      setShowHistory(true);
      window.dispatchEvent(
        new CustomEvent('triggerGenerate', {
          detail: { source, timestamp: Date.now() }
        })
      );
    };

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'u') {
        event.preventDefault();
        setActivePrimarySection('upscaling');
        setShowPromptPanel(true);
        return;
      }

      // Handle Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('triggerSaveImage', { detail: { source: 'keyboard', timestamp: Date.now() } }));
        return;
      }

      if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (selectedTool === 'generate') {
          triggerGeneration('reroll');
        }
        return;
      }

      if (!event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        triggerGeneration('keyboard');
        return;
      }

      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        triggerGeneration('keyboard');
        return;
      }

      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        // Only handle Ctrl + Enter for generation (Windows-compatible)
        if (event.ctrlKey && event.key === 'Enter') {
          event.preventDefault();
          triggerGeneration('keyboard');
          return;
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPrompt,
    isGenerating,
    isValidating,
    selectedTool,
    currentProject,
    promptHistory,
    selectedGenerationId,
    selectedEditId,
    setSelectedTool,
    setCurrentPrompt,
    setLastGenerationParameters,
    setActivePrimarySection,
    setShowHistory,
    setShowPromptPanel,
    showHistory,
    showPromptPanel
  ]);
};