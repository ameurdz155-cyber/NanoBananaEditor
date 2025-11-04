import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, Settings, ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Eraser, Menu, LogOut, BookOpen, Users, Package, Wallet, Sparkles, Loader2, FolderTree, FileText } from 'lucide-react';
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
    setUpscaleScale,
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
  const updateMenuPosition = () => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const width = 192; // 48 * 4 tailwind width in px
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, rect.right - width),
    });
  };

  useEffect(() => {
    if (!showMenu) return;
    updateMenuPosition();
    const handleResize = () => updateMenuPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showMenu]);
  
  // Listen for custom event to open settings
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };
    
    window.addEventListener('openSettings', handleOpenSettings);
    return () => window.removeEventListener('openSettings', handleOpenSettings);
  }, []);

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(3, canvasZoom + delta));
    setCanvasZoom(newZoom);
  };

  const handleReset = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  };

  const handleSave = useCallback(async () => {
    if (!canvasImage) return;

    const selectedBoard = boards.find(b => b.id === selectedBoardId);
    const boardName = selectedBoard?.name || 'default';

    if (!selectedBoardId) {
      alert('Please select a gallery folder first!');
      return;
    }

    let imageForSave = canvasImage;

    if (selectedTool === 'generate' && lastGenerationParameters) {
      const { width, height } = lastGenerationParameters;
      if (width > 0 && height > 0) {
        try {
          imageForSave = await transformImageToDimensions(canvasImage, width, height, 'cover');
        } catch (error) {
          console.error('Failed to normalize image dimensions before saving:', error);
        }
      }
    }

    const result = await saveImageToGallery(imageForSave, boardName, undefined, savePath);

    if (result.success && selectedBoardId) {
      addImageToBoard(selectedBoardId, result.imageId);

      const saved = await saveImageToGalleryDB(
        result.imageId,
        imageForSave,
        selectedBoardId,
        boardName,
        result.path
      );

      if (saved) {
        console.log(`✅ Image saved to "${boardName}" gallery!`);
        setSavedGalleryName(boardName);
        setSavedImagePath(result.path);
        setSavedImageData(imageForSave);
        setShowSaveSuccessModal(true);
        window.dispatchEvent(new CustomEvent('galleryUpdated'));
      } else {
        console.warn('Image added to board but storage failed');
        alert('⚠️ Image added to gallery but storage may have failed');
      }
    }
  }, [
    addImageToBoard,
    boards,
    canvasImage,
    lastGenerationParameters,
    saveImageToGallery,
    saveImageToGalleryDB,
    savePath,
    selectedBoardId,
    selectedTool
  ]);

  useEffect(() => {
    const handleExternalSave = () => {
      handleSave();
    };
    window.addEventListener('triggerSaveImage', handleExternalSave);
    return () => window.removeEventListener('triggerSaveImage', handleExternalSave);
  }, [handleSave]);

  const isUpscaleMode = activePrimarySection === 'upscaling';
  const scaleLabel = t.scaleLabel || 'Scale';
  const iterationsLabel = t.iterations || 'Iterations';
  const startUpscalingLabel = t.startUpscaling || 'Upscale';
  const stopUpscalingLabel = t.stopUpscaling || 'Stop Upscaling';
  const primaryButtonVariant = isUpscaleMode
    ? (isUpscaling ? 'default' : 'ghost')
    : (isGenerating || isValidating ? 'default' : 'ghost');
  const primaryButtonClassName = cn(
    'h-9 px-4 rounded-none border-0',
    isUpscaleMode
      ? isUpscaling
        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-500 hover:to-emerald-500 cursor-pointer'
        : 'hover:bg-gray-800/80'
      : isGenerating
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cursor-pointer'
        : isValidating
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-600 cursor-pointer'
          : 'hover:bg-gray-800/80'
  );

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
      <header className="h-16 glass flex items-center justify-between px-6 relative z-10 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        {/* Left - Logo and Version */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src={logoHeader} 
              alt={t.appName}
              className="h-10 object-contain"
            />
          </div>
          <div className="px-3 py-1 text-xs font-semibold" style={{ color: 'var(--accent-cyan)', border: 'none', background: 'transparent' }}>
            {t.versionBadge}
          </div>
          
          {/* Iterations Input + Generate Button (compact group) */}
          <div className="flex items-center space-x-0 bg-gray-900/90 border border-gray-700/60 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors group">
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
                  className="w-12 h-9 px-2 bg-gray-800 border-0 border-r border-gray-700 text-center text-sm text-gray-100 font-medium focus:outline-none focus:ring-0 hover:bg-gray-750 transition-colors peer"
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
                  className="w-12 h-9 px-2 bg-gray-800 border-0 border-r border-gray-700 text-center text-sm text-gray-100 font-medium focus:outline-none focus:ring-0 hover:bg-gray-750 transition-colors peer"
                />
              )}
              {/* Modern tooltip on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 border border-purple-500/50 rounded text-xs text-gray-200 whitespace-nowrap opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-200 shadow-lg backdrop-blur-sm">
                <span className="font-semibold text-purple-400">{isUpscaleMode ? scaleLabel : iterationsLabel}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span>{isUpscaleMode ? `${upscaleScale}x` : `${iterations} ${iterations === 1 ? 'image' : 'images'}`}</span>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500/50"></div>
              </div>
            </div>
            <Button
              variant={primaryButtonVariant}
              size="sm"
              onClick={handlePrimaryAction}
              className={primaryButtonClassName}
              aria-pressed={isUpscaleMode ? isUpscaling : (isGenerating || isValidating)}
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
          {/* Zoom controls */}
          <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400 min-w-[60px] text-center">
            {Math.round(canvasZoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-700 mx-2"></div>

          {/* Brush controls (when mask mode) */}
          {selectedTool === 'mask' && (
            <>
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-xs text-gray-400">Brush:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-16 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-400 w-6">{brushSize}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearBrushStrokes}
                disabled={brushStrokes.length === 0}
              >
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

        {/* Right - Menu and Logout */}
        <div className="flex items-center space-x-2">
          {user && (
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-xs text-gray-400">Signed in as</span>
              <span className="text-sm font-medium text-gray-200">{user.username}</span>
            </div>
          )}
          {/* Menu Dropdown */}
          <div>
            <Button 
              ref={menuButtonRef}
              className="glass glass-hover" 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (!showMenu) {
                  updateMenuPosition();
                }
                setShowMenu(prev => !prev);
              }}
              title="Menu"
            >
              <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
            </Button>
          </div>

          {showMenu && createPortal(
            <>
              <div 
                className="fixed inset-0" 
                style={{ zIndex: 99998 }}
                onClick={() => setShowMenu(false)}
              />
              <div 
                className="fixed w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
                style={{
                  zIndex: 99999,
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
              >
                <a
                  href="/tutorials/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>{t.menuTutorials}</span>
                </a>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800 flex items-center space-x-2"
                  onClick={() => {
                    setShowMenu(false);
                    setShowCategoryModal(true);
                  }}
                >
                  <FolderTree className="h-4 w-4" />
                  <span>{t.menuPromptCategories}</span>
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800 flex items-center space-x-2"
                  onClick={() => {
                    setShowMenu(false);
                    setShowTemplateModal(true);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>{t.menuTemplateManagement}</span>
                </button>
                <a
                  href="/community/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  <Users className="h-4 w-4" />
                  <span>{t.menuCommunity}</span>
                </a>
                <a
                  href="/assets/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  <Package className="h-4 w-4" />
                  <span>{t.menuAssets}</span>
                </a>
                <a
                  href="/wallet/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  <Wallet className="h-4 w-4" />
                  <span>{t.menuWallet}</span>
                </a>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800 flex items-center space-x-2"
                  onClick={() => {
                    setShowMenu(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                  <span>{t.settings}</span>
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors flex items-center space-x-2"
                  onClick={() => {
                    setShowMenu(false);
                    setShowInfoModal(true);
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>{t.about}</span>
                </button>
              </div>
            </>,
            document.body
          )}
          
          <Button
            className="glass glass-hover"
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Log out"
          >
            <LogOut className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
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
      
      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementPage 
          onClose={() => setShowCategoryModal(false)}
        />
      )}
      
      {/* Template Management Modal */}
      {showTemplateModal && (
        <TemplateManagementPage 
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </>
  );
};