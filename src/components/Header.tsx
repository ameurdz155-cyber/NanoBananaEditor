import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import {
  HelpCircle,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Eraser,
  Menu,
  LogOut,
  BookOpen,
  Users,
  Package,
  Wallet,
  Sparkles,
  Loader2,
  FolderTree,
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import { InfoModal } from './InfoModal';
import { SettingsModal } from './SettingsModal';
import { SaveSuccessModal } from './SaveSuccessModal';
import { CategoryManagementPage } from './CategoryManagementPage';
import { TemplateManagementPage } from './TemplateManagementPage';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { saveImageToGallery } from '../utils/fileSaver';
import { saveImageToGalleryDB } from '../utils/galleryStorage';
import logoHeader from '../assets/AI-POD-lite-logo.png';
import logoHeaderLight from '../assets/AI-POD-lite-logo-light.png';
import { createPortal } from 'react-dom';
import { transformImageToDimensions } from '../utils/imageUtils';
import { useAuthStore } from '../store/useAuthStore';

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
    setUpscaleScale
  } = useAppStore();
  const t = getTranslation(language);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [savedGalleryName, setSavedGalleryName] = useState('');
  const [savedImagePath, setSavedImagePath] = useState<string | undefined>();
  const [savedImageData, setSavedImageData] = useState<string | undefined>();
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme !== 'light';
  });
  const defaultBoardName = language === 'zh' ? '画廊' : 'Gallery';

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('app-theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
    document.documentElement.classList.toggle('light', !newTheme);
    window.dispatchEvent(new Event('themeChange'));
  };

  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(3, Math.max(0.1, canvasZoom + delta));
    setCanvasZoom(parseFloat(nextZoom.toFixed(2)));
  };

  const handleReset = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

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
        imageForSave = await transformImageToDimensions(
          canvasImage,
          targetWidth,
          targetHeight
        );
      }

      const result = await saveImageToGallery(imageForSave, boardName, undefined, savePath);
      if (!result.success) {
        throw new Error('save-failed');
      }

      if (selectedBoardId) {
        addImageToBoard(selectedBoardId, result.imageId);
        await saveImageToGalleryDB(
          result.imageId,
          imageForSave,
          selectedBoardId,
          boardName,
          result.path
        );
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
      alert(language === 'zh' ? '保存图像失败，请稍后再试。' : 'Failed to save image. Please try again.');
    }
  }, [
    addImageToBoard,
    boards,
    canvasImage,
    lastGenerationParameters,
    language,
    savePath,
    selectedBoardId,
    defaultBoardName,
    t
  ]);

  const updateMenuPosition = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const width = 208; // ~w-52 in pixels
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, rect.right - width)
    });
  }, []);

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    updateMenuPosition();
    const handleResize = () => updateMenuPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showMenu, updateMenuPosition]);

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

  const primaryButtonVariant = isUpscaleMode
    ? isUpscaling
      ? 'default'
      : 'ghost'
    : isGenerating || isValidating
      ? 'default'
      : 'ghost';

  const primaryButtonClassName = cn(
    'h-9 px-4 rounded-none border-0 transition-colors',
    isUpscaleMode
      ? isUpscaling
        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-500 hover:to-emerald-500 text-white'
        : 'hover:bg-gray-800/80 text-gray-100'
      : isGenerating
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        : isValidating
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-600 text-white'
          : 'hover:bg-gray-800/80 text-gray-100'
  );

  const iterationControlWrapperClasses = cn(
    'flex items-center space-x-0 rounded-lg overflow-hidden transition-colors group backdrop-blur-md',
    isDarkMode
      ? 'bg-gray-900/90 border border-gray-700/60 hover:border-purple-500/50'
      : 'bg-white/80 border border-purple-200/60 hover:border-purple-300/70 shadow-sm'
  );

  const iterationInputClasses = cn(
    'w-12 h-9 px-2 border-0 border-r text-center text-sm font-medium focus:outline-none focus:ring-0 transition-colors peer',
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-750'
      : 'bg-white/60 border-purple-200/70 text-gray-700 hover:bg-white focus:border-purple-300'
  );

  const tooltipClasses = cn(
    'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-200 shadow-lg',
    isDarkMode
      ? 'bg-gray-800 border border-purple-500/40 text-gray-200'
      : 'bg-white border border-purple-200/80 text-gray-600 backdrop-blur'
  );

  const tooltipArrowClasses = cn(
    'absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
    isDarkMode ? 'border-t-purple-500/40' : 'border-t-purple-200/70'
  );

  const themeToggleClasses = cn(
    'p-2 rounded-lg border-2 transition-all duration-200',
    isDarkMode
      ? 'border-purple-500/60 bg-gray-800/60 text-yellow-300 hover:bg-gray-700/70 hover:border-purple-400'
      : 'border-purple-200/80 bg-white/80 text-purple-500 hover:bg-purple-50/80 hover:border-purple-300 backdrop-blur'
  );

  const menuContainerClasses = cn(
    'fixed w-52 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md transition-colors',
    isDarkMode
      ? 'bg-gray-900/95 border-gray-700/80 text-gray-100'
      : 'bg-white/95 border-purple-200/80 text-gray-700'
  );

  const menuItemBaseClasses = cn(
    'w-full text-left px-4 py-3 text-sm flex items-center space-x-2 transition-colors',
    isDarkMode
      ? 'hover:bg-gray-800/80 text-gray-100'
      : 'hover:bg-purple-50/90 text-gray-700'
  );

  const menuBorderColorClass = isDarkMode ? 'border-gray-800/70' : 'border-purple-100/80';
  const menuSeparatorClass = isDarkMode ? 'bg-gray-800/70' : 'bg-purple-100/80';
  const menuHeaderClasses = cn(
    'px-4 py-3 border-b',
    isDarkMode ? 'border-gray-800/70 bg-gray-900/70' : 'border-purple-100/80 bg-white/80'
  );
  const menuHeaderCaptionClasses = cn(
    'text-[10px] uppercase tracking-[0.18em] font-semibold',
    isDarkMode ? 'text-gray-400' : 'text-gray-500'
  );
  const menuHeaderNameClasses = cn(
    'text-sm font-semibold truncate',
    isDarkMode ? 'text-gray-100' : 'text-gray-700'
  );

  const logoutLabel = language === 'zh' ? '退出登录' : 'Log out';
  const signedInLabel = language === 'zh' ? '当前登录' : 'Signed in as';

  const handlePrimaryAction = useCallback(() => {
    if (isUpscaleMode) {
      window.dispatchEvent(new CustomEvent('triggerUpscaleAction'));
      return;
    }

    if (isGenerating || isValidating) {
      window.dispatchEvent(new CustomEvent('cancelGeneration'));
    } else {
      window.dispatchEvent(new CustomEvent('triggerGenerate'));
    }
  }, [isGenerating, isUpscaleMode, isValidating]);

  return (
    <>
      <header
        className="h-16 glass flex items-center justify-between px-6 relative z-10 border-b"
        style={{ borderColor: isDarkMode ? 'var(--surface-border)' : 'var(--surface-border-light)' }}
      >
        {/* Left - Logo and Version */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img
              src={isDarkMode ? logoHeader : logoHeaderLight}
              alt={t.appName}
              className="h-10 object-contain transition-opacity duration-300"
            />
          </div>
          <div
            className="px-3 py-1 text-xs font-semibold"
            style={{ color: 'var(--accent-cyan)', border: 'none', background: 'transparent' }}
          >
            {t.versionBadge}
          </div>

          {/* Iterations Input + Generate Button (compact group) */}
          <div className={iterationControlWrapperClasses}>
            <div className="relative">
              {isUpscaleMode ? (
                <input
                  key="upscale-input"
                  type="number"
                  min="2"
                  max="8"
                  step="1"
                  value={upscaleScale}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setUpscaleScale(Number.isNaN(value) ? 2 : value);
                  }}
                  disabled={isUpscaling}
                  aria-label={scaleLabel}
                  className={iterationInputClasses}
                />
              ) : (
                <input
                  key="iterations-input"
                  type="number"
                  min="1"
                  max="10"
                  value={iterations}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 1;
                    setIterations(Math.max(1, Math.min(10, value)));
                  }}
                  disabled={isGenerating || isValidating}
                  aria-label={iterationsLabel}
                  className={iterationInputClasses}
                />
              )}
              <div className={tooltipClasses}>
                <span className="font-semibold text-purple-400">{isUpscaleMode ? scaleLabel : iterationsLabel}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span>{isUpscaleMode ? `${upscaleScale}x` : `${iterations} ${iterations === 1 ? 'image' : 'images'}`}</span>
                <div className={tooltipArrowClasses} />
              </div>
            </div>
            <Button
              variant={primaryButtonVariant}
              size="sm"
              onClick={handlePrimaryAction}
              className={primaryButtonClassName}
              aria-pressed={isUpscaleMode ? isUpscaling : isGenerating || isValidating}
            >
              {isUpscaleMode ? (
                isUpscaling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>{stopUpscalingLabel}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>{`${startUpscalingLabel} ×${upscaleScale}`}</span>
                  </>
                )
              ) : isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {generationProgress.total > 0 ? (
                    <span className="whitespace-nowrap">
                      {t.stopGeneration} ({generationProgress.current}/{generationProgress.total})
                    </span>
                  ) : (
                    <span>{t.stopGeneration}</span>
                  )}
                </>
              ) : isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  <span>{t.validating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>{t.generate}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Center - Canvas Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400 min-w-[60px] text-center">{Math.round(canvasZoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="w-px h-6" style={{ backgroundColor: 'var(--border-muted)' }} />

          {selectedTool === 'mask' && (
            <>
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-xs text-gray-400">Brush:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  className="w-16 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 w-6 text-right">{brushSize}</span>
              </div>
              <Button variant="outline" size="sm" onClick={clearBrushStrokes} disabled={brushStrokes.length === 0}>
                <Eraser className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMasks(!showMasks)}
            className={cn(showMasks && 'bg-purple-500/10 border-purple-500/50')}
          >
            {showMasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden sm:inline ml-2">{t.masks}</span>
          </Button>

          {canvasImage && (
            <Button variant="secondary" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t.save}</span>
            </Button>
          )}
        </div>

        {/* Right - Theme + Menu */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={themeToggleClasses}
            title={
              isDarkMode
                ? language === 'zh'
                  ? '切换到浅色模式'
                  : 'Switch to Light Mode'
                : language === 'zh'
                  ? '切换到深色模式'
                  : 'Switch to Dark Mode'
            }
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Button
            ref={menuButtonRef}
            className="glass glass-hover"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!showMenu) {
                updateMenuPosition();
              }
              setShowMenu((previous) => !previous);
            }}
            title="Menu"
          >
            <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>

          {showMenu &&
            createPortal(
              <>
                <div
                  className="fixed inset-0"
                  style={{ zIndex: 9998 }}
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className={menuContainerClasses}
                  style={{ zIndex: 9999, top: menuPosition.top, left: menuPosition.left }}
                >
                  {user && (
                    <div className={menuHeaderClasses}>
                      <span className={menuHeaderCaptionClasses}>{signedInLabel}</span>
                      <span className={menuHeaderNameClasses}>{user.username}</span>
                    </div>
                  )}

                  <button
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => {
                      setShowMenu(false);
                      setShowCategoryModal(true);
                    }}
                  >
                    <FolderTree className="h-4 w-4" />
                    <span>{t.menuPromptCategories}</span>
                  </button>

                  <button
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => {
                      setShowMenu(false);
                      setShowTemplateModal(true);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t.menuTemplateManagement}</span>
                  </button>

                  <a
                    href="/tutorials/?utm_source=AI_POD_Lite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => setShowMenu(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{t.menuTutorials}</span>
                  </a>

                  <a
                    href="/community/?utm_source=AI_POD_Lite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => setShowMenu(false)}
                  >
                    <Users className="h-4 w-4" />
                    <span>{t.menuCommunity}</span>
                  </a>

                  <a
                    href="/assets/?utm_source=AI_POD_Lite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => setShowMenu(false)}
                  >
                    <Package className="h-4 w-4" />
                    <span>{t.menuAssets}</span>
                  </a>

                  <a
                    href="/wallet/?utm_source=AI_POD_Lite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => setShowMenu(false)}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>{t.menuWallet}</span>
                  </a>

                  <button
                    className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                    onClick={() => {
                      setShowMenu(false);
                      setShowSettingsModal(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t.settings}</span>
                  </button>

                  <button
                    className={menuItemBaseClasses}
                    onClick={() => {
                      setShowMenu(false);
                      setShowInfoModal(true);
                    }}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>{t.about}</span>
                  </button>

                  <div className={cn('h-px w-full', menuSeparatorClass)} />

                  <button
                    className={cn(
                      menuItemBaseClasses,
                      'text-red-400 hover:text-red-300',
                      isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                    )}
                    onClick={() => {
                      setShowMenu(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{logoutLabel}</span>
                  </button>
                </div>
              </>,
              document.body
            )}
        </div>
      </header>

      <InfoModal open={showInfoModal} onOpenChange={setShowInfoModal} />
      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
      <SaveSuccessModal
        open={showSaveSuccessModal}
        onOpenChange={setShowSaveSuccessModal}
        galleryName={savedGalleryName}
        savedPath={savedImagePath}
        imageData={savedImageData}
      />

      {showCategoryModal && <CategoryManagementPage onClose={() => setShowCategoryModal(false)} />}

      {showTemplateModal && <TemplateManagementPage onClose={() => setShowTemplateModal(false)} />}
    </>
  );
};