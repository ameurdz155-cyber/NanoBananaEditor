import React, { useRef, useEffect, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stage, Layer, Image as KonvaImage, Line, Group } from 'react-konva';
import { useAppStore } from '../store/useAppStore';
import {
  Sparkles,
  PlusCircle,
  Download,
  Folder,
  Copy,
  Star,
  LocateFixed,
  ChevronRight,
  Check,
  History,
  ImageIcon,
  PenSquare
} from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';

export const ImageCanvas: React.FC = () => {
  const {
    canvasImage,
  setCanvasImage,
    canvasZoom,
    setCanvasZoom,
    canvasPan,
    setCanvasPan,
  canvasRotation,
    brushStrokes,
    addBrushStroke,
    showMasks,
    selectedTool,
    isGenerating,
    brushSize,
    language,
    addUploadedImage,
    addEditReferenceImage,
    generationProgress,
    currentProject,
    selectedGenerationId,
    selectedEditId,
    selectGeneration,
    selectEdit,
    setShowHistory,
    boards,
    selectedBoardId,
    setSelectedBoardId,
    addImageToBoard,
    removeImageFromBoard,
    toggleFavoriteImage,
    isFavoriteImage,
    setActivePrimarySection,
    setSelectedTool,
    setCurrentPrompt,
    setLastGenerationParameters,
    setSeed,
    setTemperature,
  } = useAppStore();

  const t = getTranslation(language);

  const stageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const imageGroupRef = useRef<any>(null);

  const generations = useMemo(() => currentProject?.generations ?? [], [currentProject]);
  const edits = useMemo(() => currentProject?.edits ?? [], [currentProject]);

  const activeItemType = useMemo<'generation' | 'edit' | null>(() => {
    if (selectedGenerationId) return 'generation';
    if (selectedEditId) return 'edit';
    return null;
  }, [selectedGenerationId, selectedEditId]);

  const activeItemId = useMemo(() => selectedGenerationId ?? selectedEditId ?? null, [selectedGenerationId, selectedEditId]);

  const currentGeneration = useMemo(() => {
    if (activeItemType !== 'generation' || !activeItemId) return null;
    return generations.find(gen => gen.id === activeItemId) ?? null;
  }, [activeItemId, activeItemType, generations]);

  const currentEdit = useMemo(() => {
    if (activeItemType !== 'edit' || !activeItemId) return null;
    return edits.find(edit => edit.id === activeItemId) ?? null;
  }, [activeItemId, activeItemType, edits]);

  const parentGeneration = useMemo(() => {
    if (!currentEdit?.parentGenerationId) return null;
    return generations.find(gen => gen.id === currentEdit.parentGenerationId) ?? null;
  }, [currentEdit, generations]);

  const promptText = useMemo(() => {
    if (currentGeneration?.prompt) return currentGeneration.prompt;
    if (currentEdit?.instruction) return currentEdit.instruction;
    return '';
  }, [currentEdit, currentGeneration]);

  const imageIdentifier = useMemo(() => activeItemId ?? '', [activeItemId]);
  const derivedImageUrl = useMemo(() => {
    if (currentEdit?.outputAssets?.[0]?.url) return currentEdit.outputAssets[0].url;
    if (currentGeneration?.outputAssets?.[0]?.url) return currentGeneration.outputAssets[0].url;
    if (parentGeneration?.outputAssets?.[0]?.url) return parentGeneration.outputAssets[0].url;
    return '';
  }, [currentEdit, currentGeneration, parentGeneration]);
  const contextImageUrl = useMemo(() => canvasImage ?? derivedImageUrl, [canvasImage, derivedImageUrl]);
  const hasCanvasImage = Boolean(canvasImage);
  const hasContextImage = Boolean(contextImageUrl);
  const canAddToBoard = Boolean((activeItemId || contextImageUrl) && boards.length);
  const isFavorite = useMemo(() => (activeItemId ? isFavoriteImage(activeItemId) : false), [activeItemId, isFavoriteImage]);
  const canToggleFavorite = Boolean(activeItemId || contextImageUrl);
  const hasPrompt = useMemo(() => promptText.trim().length > 0, [promptText]);
  const canRecallMetadata = useMemo(() => {
    const metadataSource = currentEdit ? parentGeneration : currentGeneration;
    if (!metadataSource?.parameters) return false;
    return typeof metadataSource.parameters.width === 'number' && typeof metadataSource.parameters.height === 'number';
  }, [currentEdit, currentGeneration, parentGeneration]);

  const boardItems = useMemo(
    () =>
      boards.map(board => ({
        board,
        alreadyInBoard: imageIdentifier ? board.imageIds.includes(imageIdentifier) : false,
        isActiveBoard: board.id === selectedBoardId,
      })),
    [boards, imageIdentifier, selectedBoardId]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => (prev.open ? { ...prev, open: false } : prev));
    setShowBoardPicker(false);
  }, []);

  interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    trailing?: React.ReactNode;
    destructive?: boolean;
  }

  const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, disabled, trailing, destructive }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      className={cn(
        'w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-colors',
        disabled
          ? 'text-gray-500 cursor-not-allowed'
          : destructive
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            : 'text-gray-200 hover:bg-gray-900'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  );

  interface IconButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  }

  const IconButton: React.FC<IconButtonProps> = ({ icon, label, onClick, disabled }) => (
    <button
      type="button"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-gray-900/60 text-gray-300 transition-colors',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-gray-800 hover:text-white hover:border-gray-700'
      )}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      disabled={disabled}
      title={label}
    >
      <span className="pointer-events-none">{icon}</span>
    </button>
  );

  const handleSetCanvasSource = useCallback(() => {
    if (!contextImageUrl) return;
    setCanvasImage(contextImageUrl);
    closeContextMenu();
  }, [contextImageUrl, setCanvasImage, closeContextMenu]);

  const handleOpenCanvasWorkspace = useCallback(() => {
    if (!contextImageUrl) return;
    setCanvasImage(contextImageUrl);
    setActivePrimarySection('canvas');
    closeContextMenu();
  }, [contextImageUrl, setCanvasImage, setActivePrimarySection, closeContextMenu]);

  const handleLoadWorkflow = useCallback(() => {
    console.info('Load workflow requested from canvas context');
    closeContextMenu();
  }, [closeContextMenu]);

  const handleNewCanvasFromImage = useCallback(() => {
    if (!contextImageUrl) return;
    setCanvasImage(contextImageUrl);
    setSelectedTool('edit');
    setActivePrimarySection('canvas');
    closeContextMenu();
  }, [contextImageUrl, setCanvasImage, setSelectedTool, setActivePrimarySection, closeContextMenu]);


  const handleAddAsReference = useCallback(() => {
    if (!contextImageUrl) return;
    if (selectedTool === 'generate') {
      addUploadedImage(contextImageUrl);
    } else {
      addEditReferenceImage(contextImageUrl);
    }
    closeContextMenu();
  }, [contextImageUrl, selectedTool, addEditReferenceImage, addUploadedImage, closeContextMenu]);

  const handleSaveCanvasImage = useCallback(() => {
    if (!canvasImage) return;
    window.dispatchEvent(new CustomEvent('triggerSaveImage'));
    closeContextMenu();
  }, [canvasImage, closeContextMenu]);

  const handleSendToUpscale = useCallback(() => {
    if (!hasContextImage) return;
    setActivePrimarySection('upscaling');
    setSelectedTool('generate');
    closeContextMenu();
  }, [hasContextImage, setActivePrimarySection, setSelectedTool, closeContextMenu]);

  const handleUseAsMaskLayer = useCallback(() => {
    if (!contextImageUrl) return;
    addEditReferenceImage(contextImageUrl);
    setSelectedTool('mask');
    setActivePrimarySection('canvas');
    closeContextMenu();
  }, [contextImageUrl, addEditReferenceImage, setSelectedTool, setActivePrimarySection, closeContextMenu]);

  const handleUseForPromptTemplate = useCallback(() => {
    if (!promptText) {
      closeContextMenu();
      return;
    }
    setCurrentPrompt(promptText);
    setActivePrimarySection('generate');
    closeContextMenu();
  }, [promptText, setCurrentPrompt, setActivePrimarySection, closeContextMenu]);

  const handleCopyPrompt = useCallback(async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
    } catch (error) {
      console.warn('Failed to copy prompt to clipboard:', error);
    }
    closeContextMenu();
  }, [promptText, closeContextMenu]);

  const handleRecallMetadata = useCallback(() => {
    const metadataSource = currentEdit ? parentGeneration : currentGeneration;
    const parameters = metadataSource?.parameters;
    if (!parameters) {
      closeContextMenu();
      return;
    }
    if (typeof parameters.width === 'number' && typeof parameters.height === 'number') {
      setLastGenerationParameters({
        width: parameters.width,
        height: parameters.height,
        ...(parameters.aspectRatio ? { aspectRatio: parameters.aspectRatio } : {}),
      });
    }
    if (typeof parameters.seed === 'number') {
      setSeed(parameters.seed);
    }
    if (typeof parameters.temperature === 'number') {
      setTemperature(parameters.temperature);
    }
    closeContextMenu();
  }, [currentEdit, currentGeneration, parentGeneration, setLastGenerationParameters, setSeed, setTemperature, closeContextMenu]);

  const handleToggleFavorite = useCallback(() => {
    // Use activeItemId if available, or use imageIdentifier as fallback
    const itemId = activeItemId || imageIdentifier;
    if (!itemId) {
      // If still no ID, try to find the generation/edit that matches the current canvas image
      const matchingGen = generations.find(g => g.outputAssets?.[0]?.url === contextImageUrl);
      const matchingEdit = edits.find(e => e.outputAssets?.[0]?.url === contextImageUrl);
      const fallbackId = matchingGen?.id || matchingEdit?.id;
      if (fallbackId) {
        toggleFavoriteImage(fallbackId);
      }
    } else {
      toggleFavoriteImage(itemId);
    }
    closeContextMenu();
  }, [activeItemId, imageIdentifier, contextImageUrl, generations, edits, toggleFavoriteImage, closeContextMenu]);

  const handleLocateInGallery = useCallback(() => {
    if (!activeItemType || !activeItemId) {
      closeContextMenu();
      return;
    }
    setShowHistory(true);
    if (activeItemType === 'generation') {
      selectGeneration(activeItemId);
      selectEdit(null);
    } else {
      selectEdit(activeItemId);
      if (parentGeneration) {
        selectGeneration(parentGeneration.id);
      }
    }
    closeContextMenu();
  }, [activeItemType, activeItemId, setShowHistory, selectGeneration, selectEdit, parentGeneration, closeContextMenu]);

  const handleBoardSelection = useCallback(
    (boardId: string, alreadyInBoard: boolean) => {
      if (!imageIdentifier) return;
      if (alreadyInBoard) {
        removeImageFromBoard(boardId, imageIdentifier);
      } else {
        addImageToBoard(boardId, imageIdentifier);
        setSelectedBoardId(boardId);
      }
      setShowBoardPicker(false);
      closeContextMenu();
    },
    [imageIdentifier, removeImageFromBoard, addImageToBoard, setSelectedBoardId, closeContextMenu]
  );

  const handleToggleBoardPicker = useCallback(() => {
    if (!canAddToBoard) return;
    setShowBoardPicker(prev => !prev);
  }, [canAddToBoard]);

  const iconActions = useMemo(
    () => [
      {
        key: 'set-canvas',
        icon: <ImageIcon className="h-4 w-4" />,
        label: t.setAsCanvasImage,
        onClick: handleSetCanvasSource,
        disabled: !contextImageUrl,
      },
      {
        key: 'add-reference',
        icon: <PlusCircle className="h-4 w-4" />,
        label: t.addCanvasImageToReferences,
        onClick: handleAddAsReference,
        disabled: !contextImageUrl,
      },
      {
        key: 'copy-prompt',
        icon: <Copy className="h-4 w-4" />,
        label: t.copyPrompt,
        onClick: handleCopyPrompt,
        disabled: !hasPrompt,
      },
      {
        key: 'save-image',
        icon: <Download className="h-4 w-4" />,
        label: t.saveCanvasImage,
        onClick: handleSaveCanvasImage,
        disabled: !canvasImage,
      },
    ], [
      contextImageUrl,
      t.setAsCanvasImage,
      t.addCanvasImageToReferences,
      t.copyPrompt,
      t.saveCanvasImage,
      t.asMaskLayer,
      handleSetCanvasSource,
      handleOpenCanvasWorkspace,
      handleAddAsReference,
      handleCopyPrompt,
      handleSaveCanvasImage,
      handleUseAsMaskLayer,
      hasPrompt,
      canvasImage,
      selectedTool,
    ]);

  const getRelativeImagePoint = useCallback(() => {
    if (!image) return null;
    const stage = stageRef.current?.getStage();
    const group = imageGroupRef.current;
    if (!stage || !group) return null;

    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    // Convert the pointer into the image group's local coordinate system
    const transform = group.getAbsoluteTransform().copy();
    transform.invert();
    const localPoint = transform.point(pointer);

    const relativeX = localPoint.x + image.width / 2;
    const relativeY = localPoint.y + image.height / 2;

    return { relativeX, relativeY };
  }, [image]);

  const isWithinImageBounds = useCallback(
    (relativeX: number, relativeY: number) => {
      if (!image) return false;
      return relativeX >= 0 && relativeX <= image.width && relativeY >= 0 && relativeY <= image.height;
    },
    [image]
  );

  useLayoutEffect(() => {
  if (typeof window === 'undefined' || !contextMenu.open || !menuPanelRef.current) return;

    const margin = 12;
    const menuRect = menuPanelRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - menuRect.width - margin;
    const maxY = window.innerHeight - menuRect.height - margin;
    const boundedX = Math.max(margin, Math.min(contextMenu.x, maxX));
    const boundedY = Math.max(margin, Math.min(contextMenu.y, maxY));

    if (boundedX !== contextMenu.x || boundedY !== contextMenu.y) {
      setContextMenu(prev => ({ ...prev, x: boundedX, y: boundedY }));
    }
  }, [contextMenu.open, contextMenu.x, contextMenu.y]);

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeContextMenu]);

  const handleMouseDown = () => {
    if (selectedTool !== 'mask' || !image || isGenerating) return;

    const point = getRelativeImagePoint();
    if (!point) {
      setIsDrawing(false);
      return;
    }

    const { relativeX, relativeY } = point;

    if (isWithinImageBounds(relativeX, relativeY)) {
      setIsDrawing(true);
      setCurrentStroke([relativeX, relativeY]);
    } else {
      setIsDrawing(false);
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing || selectedTool !== 'mask' || !image || isGenerating) return;

    const point = getRelativeImagePoint();
    if (!point) {
      return;
    }

    const { relativeX, relativeY } = point;

    if (isWithinImageBounds(relativeX, relativeY)) {
      setCurrentStroke((prev) => [...prev, relativeX, relativeY]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || isGenerating) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    setIsDrawing(false);
    if (currentStroke.length < 4) {
      setCurrentStroke([]);
      return;
    }

    addBrushStroke({
      id: `stroke-${Date.now()}`,
      points: [...currentStroke],
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
        className="flex-1 relative overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}
        onContextMenu={(event) => {
          event.preventDefault();
          if (isGenerating) return;
          if (!hasCanvasImage && !activeItemId) return;
          setShowBoardPicker(false);
          setContextMenu({ open: true, x: event.clientX, y: event.clientY });
        }}
      >
        {!image && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6" style={{ color: 'var(--text-secondary)' }}>
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 gradient-glow opacity-40 blur-3xl rounded-full" aria-hidden="true" />
                <div
                  className="relative w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl mx-auto transform hover:scale-105 transition-transform"
                  style={{ boxShadow: '0 20px 45px rgba(124, 58, 237, 0.25)' }}
                >
                  <Sparkles className="h-14 w-14" style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gradient mb-3" style={{ color: 'var(--text-primary)' }}>
                {t.createWithAI}
              </h2>
              <p className="text-base leading-relaxed mb-6">
                {selectedTool === 'generate' 
                  ? t.enterPromptToGenerate
                  : t.uploadToStartEditing
                }
              </p>
              <div 
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border"
                style={{
                  background: 'rgba(168, 85, 247, 0.12)',
                  borderColor: 'rgba(168, 85, 247, 0.28)',
                  boxShadow: '0 10px 25px rgba(168, 85, 247, 0.12)'
                }}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                <span className="text-sm" style={{ color: 'var(--primary-light)' }}>{t.readyToCreate}</span>
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
                {selectedTool === 'edit' || selectedTool === 'mask' ? (
                  <p className="text-sm text-gray-400">
                    {selectedTool === 'edit' ? 'Applying your edits...' : 'Preparing mask edits...'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    {generationProgress.total > 1
                      ? t.generatingProgress
                          .replace('{current}', String(generationProgress.current))
                          .replace('{total}', String(generationProgress.total))
                      : t.thisMayTakeMoments}
                  </p>
                )}
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
              <Group
                ref={imageGroupRef}
                x={(stageSize.width / canvasZoom) / 2}
                y={(stageSize.height / canvasZoom) / 2}
                rotation={canvasRotation}
              >
                <KonvaImage
                  image={image}
                  x={-image.width / 2}
                  y={-image.height / 2}
                />

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
                    x={-image.width / 2}
                    y={-image.height / 2}
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
                    x={-image.width / 2}
                    y={-image.height / 2}
                  />
                )}
              </Group>
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

      {contextMenu.open && createPortal(
        <div className="fixed inset-0 z-[1100]" onClick={closeContextMenu}>
          <div
            className="absolute w-64 rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            ref={menuPanelRef}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-2">
              <div className="px-2 pb-3">
                <div className="grid grid-cols-4 gap-2">
                  {iconActions.map(action => (
                    <IconButton
                      key={action.key}
                      icon={action.icon}
                      label={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    />
                  ))}
                </div>
              </div>

              <div className="px-2 space-y-1">
                <MenuItem
                  icon={<History className="h-4 w-4 text-blue-300" />}
                  label={t.recallMetadata}
                  onClick={handleRecallMetadata}
                  disabled={!canRecallMetadata}
                  trailing={<ChevronRight className="h-3 w-3 text-gray-500" />}
                />
                {/* <MenuItem
                  icon={<Sparkles className="h-4 w-4 text-pink-300" />}
                  label={t.sendToUpscale}
                  onClick={handleSendToUpscale}
                  disabled={!hasContextImage}
                /> */}
                <MenuItem
                  icon={<PenSquare className="h-4 w-4 text-purple-300" />}
                  label={t.useForPromptTemplate}
                  onClick={handleUseForPromptTemplate}
                  disabled={!hasPrompt}
                />
              </div>

              <div className="my-3 h-px bg-gray-800" />

              <div className="px-2 pb-1">
                <MenuItem
                  icon={<Folder className="h-4 w-4 text-gray-300" />}
                  label={t.moveToBoard}
                  onClick={handleToggleBoardPicker}
                  disabled={!canAddToBoard}
                  trailing={<ChevronRight className={cn('h-3 w-3 text-gray-500 transition-transform', showBoardPicker ? 'rotate-90' : 'rotate-0')} />}
                />
                {showBoardPicker && boardItems.length > 0 && (
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-gray-800 bg-gray-900/80">
                    {boardItems.map(({ board, alreadyInBoard, isActiveBoard }) => (
                      <button
                        key={board.id}
                        type="button"
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors',
                          alreadyInBoard
                            ? 'bg-purple-500/20 text-purple-200'
                            : 'text-gray-300 hover:bg-gray-800'
                        )}
                        onClick={() => handleBoardSelection(board.id, alreadyInBoard)}
                      >
                        <span className="flex items-center gap-2">
                          {board.emoji ? (
                            <span className="text-base leading-none">{board.emoji}</span>
                          ) : (
                            <Folder className="h-3 w-3 text-gray-500" />
                          )}
                          <span className="truncate">{board.id === 'default' ? t.myCreations : board.name}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          {isActiveBoard && (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400">{t.currentBoard}</span>
                          )}
                          {alreadyInBoard && <Check className="h-3 w-3 text-purple-300" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-3 h-px bg-gray-800" />

              <div className="px-2 pb-2 space-y-1">
                <MenuItem
                  icon={<Star className={cn('h-4 w-4', isFavorite ? 'text-yellow-300' : 'text-gray-400')} />}
                  label={t.starImage}
                  onClick={handleToggleFavorite}
                  disabled={!canToggleFavorite}
                />
                <MenuItem
                  icon={<LocateFixed className="h-4 w-4 text-cyan-300" />}
                  label={t.locateInGallery}
                  onClick={handleLocateInGallery}
                  disabled={!activeItemId}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};