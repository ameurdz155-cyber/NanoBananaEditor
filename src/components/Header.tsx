import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, Settings, ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Eraser, Menu } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { SettingsModal } from './SettingsModal';
import { SaveSuccessModal } from './SaveSuccessModal';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { saveImageToGallery } from '../utils/fileSaver';
import { saveImageToGalleryDB } from '../utils/galleryStorage';
import logoHeader from '../assets/AI-POD-lite-logo.png';
import { createPortal } from 'react-dom';

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
  } = useAppStore();
  const t = getTranslation(language);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [savedGalleryName, setSavedGalleryName] = useState('');
  const [savedImagePath, setSavedImagePath] = useState<string | undefined>();
  const [savedImageData, setSavedImageData] = useState<string | undefined>();
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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

  const handleSave = async () => {
    if (!canvasImage) return;
    
    // Get the selected board name
    const selectedBoard = boards.find(b => b.id === selectedBoardId);
    const boardName = selectedBoard?.name || 'default';
    
    if (!selectedBoardId) {
      alert('Please select a gallery folder first!');
      return;
    }
    
    // Save image to the gallery folder (disk or IndexedDB)
    const result = await saveImageToGallery(canvasImage, boardName, undefined, savePath);
    
    if (result.success && selectedBoardId) {
      // Add the image to the board tracking
      addImageToBoard(selectedBoardId, result.imageId);
      
      // Store the image in IndexedDB (for browser) or track the file path (for Tauri)
      const saved = await saveImageToGalleryDB(
        result.imageId,
        canvasImage,
        selectedBoardId,
        boardName,
        result.path
      );
      
      if (saved) {
        console.log(`✅ Image saved to "${boardName}" gallery!`);
        // Show success modal with path and image data
        setSavedGalleryName(boardName);
        setSavedImagePath(result.path);
        setSavedImageData(canvasImage);
        setShowSaveSuccessModal(true);
        
        // Trigger a small update to refresh the gallery view
        window.dispatchEvent(new CustomEvent('galleryUpdated'));
      } else {
        console.warn('Image added to board but storage failed');
        alert('⚠️ Image added to gallery but storage may have failed');
      }
    }
  };

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

        {/* Right - Menu, Settings and Help */}
        <div className="flex items-center space-x-2">
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
                  className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  使用教程
                </a>
                <a
                  href="/community/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  用户社群
                </a>
                <a
                  href="/assets/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors border-b border-gray-800"
                  onClick={() => setShowMenu(false)}
                >
                  我的资产
                </a>
                <a
                  href="/wallet/?utm_source=AI_POD_Lite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  提现与充值
                </a>
              </div>
            </>,
            document.body
          )}
          
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            title={t.settings}
          >
            <Settings className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowInfoModal(true)}
            title={t.about}
          >
            <HelpCircle className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
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
    </>
  );
};