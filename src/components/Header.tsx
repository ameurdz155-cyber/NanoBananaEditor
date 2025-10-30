import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, Settings, ZoomIn, ZoomOut, RotateCcw, Save, Eye, EyeOff, Eraser } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { SettingsModal } from './SettingsModal';
import { SaveSuccessModal } from './SaveSuccessModal';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { saveImageToGallery } from '../utils/fileSaver';
import { saveImageToGalleryDB } from '../utils/galleryStorage';
import logoHeader from '../assets/AI-POD-lite-logo.png';

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

        {/* Right - Settings and Help */}
        <div className="flex items-center space-x-2">
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