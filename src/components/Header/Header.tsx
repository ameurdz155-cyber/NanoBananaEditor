import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getTranslation } from '../../i18n/translations';
import { saveImageToGallery } from '../../utils/fileSaver';
import { saveImageToGalleryDB } from '../../utils/galleryStorage';
import { transformImageToDimensions } from '../../utils/imageUtils';
import { LogoSection } from './LogoSection';
import { IterationControl } from './IterationControl';
import { CanvasControls } from './CanvasControls';
import { ThemeToggle } from './ThemeToggle';
import { MenuButton } from './MenuButton';
import { HeaderModals } from './HeaderModals';

export const Header: React.FC = () => {
  const {
    language,
    canvasImage,
    canvasZoom,
    setCanvasZoom,
    brushStrokes,
    clearBrushStrokes,
    showMasks,
    setShowMasks,
    selectedTool,
    brushSize,
    setBrushSize,
    setCanvasPan,
    boards,
    selectedBoardId,
    addImageToBoard,
    savePath,
    lastGenerationParameters,
    isGenerating,
    isValidating,
    generationProgress,
    iterations,
    setIterations,
    activePrimarySection,
    isUpscaling,
    upscaleScale,
    setUpscaleScale,
  } = useAppStore();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const t = getTranslation(language);
  const defaultBoardName = language === 'zh' ? '画廊' : 'Gallery';

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [savedGalleryName, setSavedGalleryName] = useState('');
  const [savedImagePath, setSavedImagePath] = useState<string | undefined>();
  const [savedImageData, setSavedImageData] = useState<string | undefined>();

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme !== 'light';
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('app-theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
    document.documentElement.classList.toggle('light', !newTheme);
    window.dispatchEvent(new Event('themeChange'));
  };

  // Canvas control handlers
  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(3, Math.max(0.1, canvasZoom + delta));
    setCanvasZoom(parseFloat(nextZoom.toFixed(2)));
  };

  const handleReset = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  // Save handler
  const handleSave = useCallback(async () => {
    if (!canvasImage) {
      window.dispatchEvent(new CustomEvent('saveStatus', { detail: { success: false, reason: 'no-image' } }));
      return;
    }

    try {
      const selectedBoard = boards.find((board) => board.id === selectedBoardId);
      const boardName = selectedBoard?.name || defaultBoardName;

      let imageForSave = canvasImage;
      const targetWidth = lastGenerationParameters?.width;
      const targetHeight = lastGenerationParameters?.height;
      if (targetWidth && targetHeight) {
        imageForSave = await transformImageToDimensions(canvasImage, targetWidth, targetHeight);
      }

      const result = await saveImageToGallery(imageForSave, boardName, undefined, savePath);
      if (!result.success) {
        throw new Error('save-failed');
      }

      if (selectedBoardId) {
        addImageToBoard(selectedBoardId, result.imageId);
        await saveImageToGalleryDB(result.imageId, imageForSave, selectedBoardId, boardName, result.path);
      }

      setSavedGalleryName(boardName);
      setSavedImagePath(result.path);
      setSavedImageData(imageForSave);
      setShowSaveSuccessModal(true);

      window.dispatchEvent(new CustomEvent('galleryUpdated'));
      window.dispatchEvent(new CustomEvent('saveStatus', { detail: { success: true } }));
    } catch (error) {
      console.error('Failed to save image', error);
      window.dispatchEvent(new CustomEvent('saveStatus', { detail: { success: false } }));
      alert(language === 'zh' ? '保存图像失败,请稍后再试。' : 'Failed to save image. Please try again.');
    }
  }, [addImageToBoard, boards, canvasImage, lastGenerationParameters, language, savePath, selectedBoardId, defaultBoardName]);

  // Primary action handler (Generate/Upscale)
  const handlePrimaryAction = useCallback(() => {
    const isUpscaleMode = activePrimarySection === 'upscaling';
    if (isUpscaleMode) {
      window.dispatchEvent(new CustomEvent('triggerUpscaleAction'));
      return;
    }

    if (isGenerating || isValidating) {
      window.dispatchEvent(new CustomEvent('cancelGeneration'));
    } else {
      window.dispatchEvent(new CustomEvent('triggerGenerate'));
    }
  }, [isGenerating, activePrimarySection, isValidating]);

  // Event listeners
  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true);
    window.addEventListener('openSettings', handleOpenSettings);
    return () => window.removeEventListener('openSettings', handleOpenSettings);
  }, []);

  useEffect(() => {
    const handleExternalSave = () => handleSave();
    window.addEventListener('triggerSaveImage', handleExternalSave);
    return () => window.removeEventListener('triggerSaveImage', handleExternalSave);
  }, [handleSave]);

  const isUpscaleMode = activePrimarySection === 'upscaling';
  const scaleLabel = t.scaleLabel || 'Scale';
  const iterationsLabel = t.iterations || 'Iterations';
  const startUpscalingLabel = t.startUpscaling || 'Upscale';
  const stopUpscalingLabel = t.stopUpscaling || 'Stop Upscaling';

  return (
    <>
      <header
        className="h-16 glass flex items-center justify-between px-6 relative z-10 border-b"
        style={{ borderColor: isDarkMode ? 'var(--surface-border)' : 'var(--surface-border-light)' }}
      >
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <LogoSection isDarkMode={isDarkMode} appName={t.appName} versionBadge={t.versionBadge} />

          <IterationControl
            isUpscaleMode={isUpscaleMode}
            isUpscaling={isUpscaling}
            isGenerating={isGenerating}
            isValidating={isValidating}
            upscaleScale={upscaleScale}
            iterations={iterations}
            generationProgress={generationProgress}
            scaleLabel={scaleLabel}
            iterationsLabel={iterationsLabel}
            startUpscalingLabel={startUpscalingLabel}
            stopUpscalingLabel={stopUpscalingLabel}
            stopGeneration={t.stopGeneration}
            validating={t.validating}
            generate={t.generate}
            isDarkMode={isDarkMode}
            onScaleChange={setUpscaleScale}
            onIterationsChange={setIterations}
            onPrimaryAction={handlePrimaryAction}
          />
        </div>

        {/* Center Section */}
        <CanvasControls
          canvasZoom={canvasZoom}
          canvasImage={canvasImage}
          selectedTool={selectedTool}
          brushSize={brushSize}
          brushStrokesCount={brushStrokes.length}
          showMasks={showMasks}
          masksLabel={t.masks}
          saveLabel={t.save}
          onZoomIn={() => handleZoom(0.1)}
          onZoomOut={() => handleZoom(-0.1)}
          onReset={handleReset}
          onBrushSizeChange={setBrushSize}
          onClearBrushStrokes={clearBrushStrokes}
          onToggleMasks={() => setShowMasks(!showMasks)}
          onSave={handleSave}
        />

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <ThemeToggle isDarkMode={isDarkMode} language={language} onToggle={toggleTheme} />

          <MenuButton
            isDarkMode={isDarkMode}
            language={language}
            user={user}
            translations={{
              menuPromptCategories: t.menuPromptCategories,
              menuTemplateManagement: t.menuTemplateManagement,
              menuTutorials: t.menuTutorials,
              menuCommunity: t.menuCommunity,
              menuAssets: t.menuAssets,
              menuWallet: t.menuWallet,
              settings: t.settings,
              about: t.about,
            }}
            onCategoryClick={() => setShowCategoryModal(true)}
            onTemplateClick={() => setShowTemplateModal(true)}
            onSettingsClick={() => setShowSettingsModal(true)}
            onInfoClick={() => setShowInfoModal(true)}
            onLogout={logout}
          />
        </div>
      </header>

      <HeaderModals
        showInfoModal={showInfoModal}
        showSettingsModal={showSettingsModal}
        showSaveSuccessModal={showSaveSuccessModal}
        showCategoryModal={showCategoryModal}
        showTemplateModal={showTemplateModal}
        savedGalleryName={savedGalleryName}
        savedImagePath={savedImagePath}
        savedImageData={savedImageData}
        onInfoModalChange={setShowInfoModal}
        onSettingsModalChange={setShowSettingsModal}
        onSaveSuccessModalChange={setShowSaveSuccessModal}
        onCategoryModalChange={setShowCategoryModal}
        onTemplateModalChange={setShowTemplateModal}
      />
    </>
  );
};
