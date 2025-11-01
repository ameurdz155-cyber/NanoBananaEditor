import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import { useAppStore } from '../store/useAppStore';
import { Sparkles } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export const ImageCanvas: React.FC = () => {
  const {
    canvasImage,
    canvasZoom,
    setCanvasZoom,
    canvasPan,
    setCanvasPan,
    brushStrokes,
    addBrushStroke,
    showMasks,
    selectedTool,
    isGenerating,
    brushSize,
    language,
    addUploadedImage,
    addEditReferenceImage,
  } = useAppStore();

  const t = getTranslation(language);

  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });

  // Track if we've already auto-fitted the current image
  const [lastAutoFitImage, setLastAutoFitImage] = useState<string | null>(null);

  // Load image and auto-fit when canvasImage changes
  useEffect(() => {
    if (canvasImage) {
      const img = new window.Image();
      img.onload = () => {
        setImage(img);
        
        // Only auto-fit if this is a NEW image (different from last one)
        if (canvasImage !== lastAutoFitImage) {
          // Auto-fit image to canvas
          const isMobile = window.innerWidth < 768;
          const padding = isMobile ? 0.9 : 0.85; // Use more of the screen on mobile
          
          const scaleX = (stageSize.width * padding) / img.width;
          const scaleY = (stageSize.height * padding) / img.height;
          
          // Remove maxZoom limit - let it scale to fit naturally
          const optimalZoom = Math.min(scaleX, scaleY);
          
          setCanvasZoom(optimalZoom);
          
          // Center the image
          setCanvasPan({ x: 0, y: 0 });
          
          // Mark this image as auto-fitted
          setLastAutoFitImage(canvasImage);
        }
      };
      img.src = canvasImage;
    } else {
      setImage(null);
      setLastAutoFitImage(null);
    }
  }, [canvasImage, stageSize, setCanvasZoom, setCanvasPan, lastAutoFitImage]);

  // Handle stage resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const closeMenu = () => setContextMenu(prev => ({ ...prev, open: false }));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseDown = (e: any) => {
    // Disable drawing when generating
    if (selectedTool !== 'mask' || !image || isGenerating) return;
    
    setIsDrawing(true);
    const stage = e.target.getStage();
    
    // Use Konva's getRelativePointerPosition for accurate coordinates
    const relativePos = stage.getRelativePointerPosition();
    
    // Calculate image bounds on the stage
    const imageX = (stageSize.width / canvasZoom - image.width) / 2;
    const imageY = (stageSize.height / canvasZoom - image.height) / 2;
    
    // Convert to image-relative coordinates
    const relativeX = relativePos.x - imageX;
    const relativeY = relativePos.y - imageY;
    
    // Check if click is within image bounds
    if (relativeX >= 0 && relativeX <= image.width && relativeY >= 0 && relativeY <= image.height) {
      setCurrentStroke([relativeX, relativeY]);
    }
  };

  const handleMouseMove = (e: any) => {
    // Disable drawing when generating
    if (!isDrawing || selectedTool !== 'mask' || !image || isGenerating) return;
    
    const stage = e.target.getStage();
    
    // Use Konva's getRelativePointerPosition for accurate coordinates
    const relativePos = stage.getRelativePointerPosition();
    
    // Calculate image bounds on the stage
    const imageX = (stageSize.width / canvasZoom - image.width) / 2;
    const imageY = (stageSize.height / canvasZoom - image.height) / 2;
    
    // Convert to image-relative coordinates
    const relativeX = relativePos.x - imageX;
    const relativeY = relativePos.y - imageY;
    
    // Check if within image bounds
    if (relativeX >= 0 && relativeX <= image.width && relativeY >= 0 && relativeY <= image.height) {
      setCurrentStroke([...currentStroke, relativeX, relativeY]);
    }
  };

  const handleMouseUp = () => {
    // Disable drawing when generating
    if (!isDrawing || currentStroke.length < 4 || isGenerating) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }
    
    setIsDrawing(false);
    addBrushStroke({
      id: `stroke-${Date.now()}`,
      points: currentStroke,
      brushSize,
      color: '#A855F7',
    });
    setCurrentStroke([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Area */}
      <div 
        id="canvas-container" 
        className="flex-1 relative overflow-hidden bg-gray-800"
        onContextMenu={(event) => {
          event.preventDefault();
          if (isGenerating) return;
          setContextMenu({ open: true, x: event.clientX, y: event.clientY });
        }}
      >
        {!image && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 gradient-glow opacity-40 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl mx-auto transform hover:scale-105 transition-transform">
                  <Sparkles className="h-14 w-14 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-3">
                {t.createWithAI}
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                {selectedTool === 'generate' 
                  ? t.enterPromptToGenerate
                  : t.uploadToStartEditing
                }
              </p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                <span className="text-sm text-purple-300">{t.readyToCreate}</span>
              </div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-md z-50">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                {/* Outer rotating ring */}
                <div className="absolute w-20 h-20 border-3 border-purple-500/30 rounded-full animate-spin" 
                     style={{ 
                       borderTopColor: 'rgb(168 85 247)', 
                       borderWidth: '3px',
                       animationDuration: '1s' 
                     }} 
                />
                {/* Middle rotating ring */}
                <div className="absolute w-14 h-14 border-2 border-pink-500/30 rounded-full animate-spin" 
                     style={{ 
                       borderTopColor: 'rgb(236 72 153)', 
                       animationDuration: '1.5s',
                       animationDirection: 'reverse'
                     }} 
                />
                {/* Inner pulsing circle */}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
              </div>
              <div className="space-y-2 px-8">
                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  {t.creatingYourImage}
                </p>
                <p className="text-sm text-gray-400">
                  {selectedTool === 'edit' || selectedTool === 'mask' 
                    ? 'Applying your edits...' 
                    : 'This may take a few moments'}
                </p>
                <div className="flex items-center justify-center space-x-1 mt-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={canvasZoom}
          scaleY={canvasZoom}
          x={canvasPan.x * canvasZoom}
          y={canvasPan.y * canvasZoom}
          draggable={selectedTool !== 'mask' && !isGenerating}
          onDragEnd={(e) => {
            if (!isGenerating) {
              setCanvasPan({ 
                x: e.target.x() / canvasZoom, 
                y: e.target.y() / canvasZoom 
              });
            }
          }}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          style={{ 
            cursor: isGenerating ? 'wait' : (selectedTool === 'mask' ? 'crosshair' : 'default'),
            pointerEvents: isGenerating ? 'none' : 'auto'
          }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                x={(stageSize.width / canvasZoom - image.width) / 2}
                y={(stageSize.height / canvasZoom - image.height) / 2}
              />
            )}
            
            {/* Brush Strokes */}
            {showMasks && brushStrokes.map((stroke) => (
              <Line
                key={stroke.id}
                points={stroke.points}
                stroke="#A855F7"
                strokeWidth={stroke.brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                opacity={0.6}
                x={(stageSize.width / canvasZoom - (image?.width || 0)) / 2}
                y={(stageSize.height / canvasZoom - (image?.height || 0)) / 2}
              />
            ))}
            
            {/* Current stroke being drawn */}
            {isDrawing && currentStroke.length > 2 && (
              <Line
                points={currentStroke}
                stroke="#A855F7"
                strokeWidth={brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="source-over"
                opacity={0.6}
                x={(stageSize.width / canvasZoom - (image?.width || 0)) / 2}
                y={(stageSize.height / canvasZoom - (image?.height || 0)) / 2}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-gray-800 bg-gray-950">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {brushStrokes.length > 0 && (
              <span className="text-purple-400">{brushStrokes.length} brush stroke{brushStrokes.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-purple-400 hidden md:inline">⚡</span>
            <span className="text-xs text-gray-500 hidden md:inline">Powered by Gemini 2.5 Flash Image</span>
          </div>
        </div>
      </div>

      <input
        id="canvas-context-reference-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) return;
            if (selectedTool === 'generate') {
              addUploadedImage(dataUrl);
            } else {
              addEditReferenceImage(dataUrl);
            }
          };
          reader.readAsDataURL(file);
          event.target.value = '';
        }}
      />

      {contextMenu.open && createPortal(
        <div className="fixed inset-0 z-[1100]" onClick={() => setContextMenu(prev => ({ ...prev, open: false }))}>
          <div
            className="absolute w-56 rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-gray-800 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                if (!canvasImage) return;
                if (selectedTool === 'generate') {
                  addUploadedImage(canvasImage);
                } else {
                  addEditReferenceImage(canvasImage);
                }
                setContextMenu(prev => ({ ...prev, open: false }));
              }}
              disabled={!canvasImage}
            >
              <span className="text-purple-300">＋</span>
              <span>Add canvas image to references</span>
            </button>
            <button
              className="w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-gray-800 flex items-center gap-2"
              onClick={() => {
                document.getElementById('canvas-context-reference-upload')?.click();
                setContextMenu(prev => ({ ...prev, open: false }));
              }}
            >
              <span className="text-cyan-300">📁</span>
              <span>Add reference from file…</span>
            </button>
            <button
              className="w-full px-4 py-3 text-sm text-left text-gray-200 hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('triggerSaveImage'));
                setContextMenu(prev => ({ ...prev, open: false }));
              }}
            >
              <span className="text-green-300">💾</span>
              <span>Save image</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};