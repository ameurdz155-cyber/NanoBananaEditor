// components/Header.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ZoomOut,
  ZoomIn,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  Eraser,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Layers,
  FileText,
  GraduationCap,
  Users,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import logoDark from "../assets/AI-POD-lite-logo.png";
import logoLight from "../assets/AI-POD-lite-logo-light.png";
import { useTheme } from "next-themes";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getTranslation } from "@/i18n/translations";
import { CategoryManagementModal } from "@/components/CategoryManagementModal";
import { TemplateManagementModal } from "@/components/TemplateManagementModal";
import { SettingsModal } from "@/components/SettingsModal";
import { InfoModal } from "@/components/InfoModal";
import { SaveSuccessModal } from "@/components/SaveSuccessModal";
import { saveImageToGallery } from "@/utils/fileSaver";
import { saveImageToGalleryDB } from "@/utils/galleryStorage";
import { transformImageToDimensions } from "@/utils/imageUtils";

const SUPPORTED_UPSCALE_SCALES = [2, 4];
const getNormalizedUpscaleScale = (value?: number) => {
  if (typeof value === 'number' && SUPPORTED_UPSCALE_SCALES.includes(value)) {
    return value;
  }
  return SUPPORTED_UPSCALE_SCALES[SUPPORTED_UPSCALE_SCALES.length - 1];
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const iterations = useAppStore((state) => state.iterations);
  const setIterations = useAppStore((state) => state.setIterations);
  const isValidating = useAppStore((state) => state.isValidating);
  const generationProgress = useAppStore((state) => state.generationProgress);
  const activePrimarySection = useAppStore((state) => state.activePrimarySection);
  const isUpscaling = useAppStore((state) => state.isUpscaling);
  const upscaleScale = useAppStore((state) => state.upscaleScale);
  const setUpscaleScale = useAppStore((state) => state.setUpscaleScale);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [savedGalleryName, setSavedGalleryName] = useState("");
  const [savedImagePath, setSavedImagePath] = useState<string | undefined>();
  const [savedImageData, setSavedImageData] = useState<string | undefined>();

  const canvasZoom = useAppStore((state) => state.canvasZoom);
  const setCanvasZoom = useAppStore((state) => state.setCanvasZoom);
  const setCanvasPan = useAppStore((state) => state.setCanvasPan);
  const canvasRotation = useAppStore((state) => state.canvasRotation);
  const setCanvasRotation = useAppStore((state) => state.setCanvasRotation);
  const showMasks = useAppStore((state) => state.showMasks);
  const setShowMasks = useAppStore((state) => state.setShowMasks);
  const canvasImage = useAppStore((state) => state.canvasImage);
  const brushSize = useAppStore((state) => state.brushSize);
  const setBrushSize = useAppStore((state) => state.setBrushSize);
  const brushStrokes = useAppStore((state) => state.brushStrokes);
  const clearBrushStrokes = useAppStore((state) => state.clearBrushStrokes);
  const selectedTool = useAppStore((state) => state.selectedTool);
  const setActivePrimarySection = useAppStore((state) => state.setActivePrimarySection);
  const setShowPromptPanel = useAppStore((state) => state.setShowPromptPanel);
  const boards = useAppStore((state) => state.boards);
  const selectedBoardId = useAppStore((state) => state.selectedBoardId);
  const addImageToBoard = useAppStore((state) => state.addImageToBoard);
  const savePath = useAppStore((state) => state.savePath);
  const lastGenerationParameters = useAppStore((state) => state.lastGenerationParameters);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const language = useAppStore((state) => state.language);
  const showHistory = useAppStore((state) => state.showHistory);
  const setShowHistory = useAppStore((state) => state.setShowHistory);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const t = useMemo(() => getTranslation(language), [language]);
  const signedInLabel = language === "zh" ? "当前登录" : "Signed in as";
  const logoutLabel = language === "zh" ? "退出登录" : "Log out";
  const menuLabel = user ? `${signedInLabel} ${user.username}` : language === "zh" ? "菜单" : "Menu";
  const zoomPercent = Math.round(canvasZoom * 100);
  const defaultBoardName = language === "zh" ? "画廊" : "Gallery";
  const brushStrokesCount = brushStrokes.length;
  const isUpscaleMode = activePrimarySection === 'upscaling';
  const IdleIcon = isUpscaleMode ? Layers : Sparkles;
  const idleIconColor = isUpscaleMode ? 'text-teal-300' : 'text-purple-400';

  const handlePrimaryAction = () => {
    if (isUpscaleMode) {
      window.dispatchEvent(
        new CustomEvent('triggerUpscaleAction', {
          detail: {
            scale: getNormalizedUpscaleScale(upscaleScale),
            source: 'header',
            timestamp: Date.now(),
          }
        })
      );
      return;
    }

    const parsedCount = Math.max(1, Number(iterations) || 1);
    if (iterations !== parsedCount) {
      setIterations(parsedCount);
    }

    setActivePrimarySection('generate');
    setShowPromptPanel(true);
    if (!showHistory) {
      setShowHistory(true);
    }

    if (isGenerating || isValidating) {
      window.dispatchEvent(new CustomEvent('cancelGeneration'));
      return;
    }

    window.dispatchEvent(
      new CustomEvent('triggerGenerate', {
        detail: { iterations: parsedCount, source: 'header', timestamp: Date.now() }
      })
    );
  };

  const handlePrimarySelectChange = (value: string) => {
    if (isUpscaleMode) {
      const parsedScale = Number(value);
      const normalizedScale = getNormalizedUpscaleScale(
        Number.isNaN(parsedScale) ? undefined : parsedScale
      );
      setUpscaleScale(normalizedScale);
      return;
    }

    const parsedCount = Math.max(1, Number(value) || 1);
    setIterations(parsedCount);
  };

  const handleSearch = () => {
    setShowHistory(!showHistory);
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
  }, [
    addImageToBoard,
    boards,
    canvasImage,
    defaultBoardName,
    language,
    lastGenerationParameters,
    savePath,
    selectedBoardId,
  ]);

  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(3, Math.max(0.1, canvasZoom + delta));
    setCanvasZoom(Number(nextZoom.toFixed(2)));
  };

  const handleZoomIn = () => handleZoom(0.1);

  const handleZoomOut = () => handleZoom(-0.1);

  const handleRotate = () => {
    const nextRotation = (canvasRotation + 90) % 360;
    setCanvasRotation(nextRotation);
    setCanvasPan({ x: 0, y: 0 });
  };

  const handleResetView = () => {
    setCanvasZoom(1);
    setCanvasPan({ x: 0, y: 0 });
    setCanvasRotation(0);
  };

  const handleMasksToggle = () => {
    setShowMasks(!showMasks);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    console.log('Theme toggled to:', theme === 'dark' ? 'light' : 'dark');
  };

  const openExternal = (url: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const handleOpenSettings = () => setShowSettingsModal(true);
    window.addEventListener('openSettings', handleOpenSettings);
    return () => window.removeEventListener('openSettings', handleOpenSettings);
  }, []);

  useEffect(() => {
    const handleExternalSave = () => {
      void handleSave();
    };
    window.addEventListener('triggerSaveImage', handleExternalSave);
    return () => window.removeEventListener('triggerSaveImage', handleExternalSave);
  }, [handleSave]);

  const isBusy = isUpscaleMode ? isUpscaling : (isGenerating || isValidating);
  const primaryActionLabel = isUpscaleMode
    ? (isUpscaling ? t.stopUpscaling ?? 'Stop Upscaling' : t.startUpscaling ?? 'Upscale')
    : isValidating
      ? t.validating ?? 'Validating'
      : isGenerating
        ? t.stopGeneration ?? 'Stop'
        : t.generate ?? 'Generate';

  const primaryHint = isUpscaleMode
    ? `${getNormalizedUpscaleScale(upscaleScale)}x`
    : (isGenerating && generationProgress.total > 1
      ? `${generationProgress.current}/${generationProgress.total}`
      : null);

  return (
    <>
  <nav className="flex items-center justify-between px-6 py-3 bg-background text-foreground border-b border-border transition-colors">
      {/* Left section: Logo and Generate with Select */}
      <div className="flex items-center gap-3">
        <img
          src={logoLight}
          alt="AI POD Lite Logo"
          className="h-9 dark:hidden"
        />
        <img
          src={logoDark}
          alt="AI POD Lite Logo"
          className="h-9 hidden dark:block"
        />
        
        <div className="w-px h-5 bg-border" />
        
        {/* Primary action (Generate/Upscale) with integrated selector */}
        <div className="flex items-center rounded-md overflow-hidden bg-background border border-border">
          <Button 
            variant="ghost"
            onClick={handlePrimaryAction}
            className="flex items-center gap-2 hover:bg-accent px-3 h-8 rounded-none border-0"
            aria-pressed={isBusy}
            type="button"
          >
            {isBusy ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isUpscaleMode ? 'text-teal-300' : 'text-purple-400'}`} />
            ) : (
              <IdleIcon className={`w-4 h-4 ${idleIconColor}`} />
            )}
            <span className="text-sm font-medium">
              {primaryActionLabel}
              {primaryHint ? ` · ${primaryHint}` : ''}
            </span>
          </Button>
          
          <Select
            value={isUpscaleMode ? String(getNormalizedUpscaleScale(upscaleScale)) : String(Math.max(1, iterations ?? 1))}
            onValueChange={handlePrimarySelectChange}
            disabled={isBusy}
          >
            <SelectTrigger
              className="w-20 h-8 px-3 py-1 bg-muted text-foreground border-none focus:ring-0 rounded-none"
              aria-label={isUpscaleMode
                ? (language === 'zh' ? '放大倍数' : 'Upscale multiplier')
                : (language === 'zh' ? '生成次数' : 'Number of images to generate')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isUpscaleMode
                ? SUPPORTED_UPSCALE_SCALES.map((scaleOption) => (
                    <SelectItem key={scaleOption} value={String(scaleOption)}>
                      {`${scaleOption}x`}
                    </SelectItem>
                  ))
                : [1, 2, 3, 4, 5].map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Middle section: Control Buttons */}
      <div className="flex flex-wrap items-center gap-2">
       

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
          aria-label={language === 'zh' ? '放大画布' : 'Zoom in'}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <span
          className="text-sm font-medium px-3 cursor-pointer select-none"
          onDoubleClick={handleResetView}
          title={language === 'zh' ? '双击重置视图' : 'Double-click to reset view'}
        >
          {zoomPercent}%
        </span>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleZoomOut}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
          aria-label={language === 'zh' ? '缩小画布' : 'Zoom out'}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRotate}
          className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
          title={language === 'zh' ? '旋转画布 90°' : 'Rotate canvas 90°'}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {selectedTool === 'mask' && (
          <div className="flex items-center gap-2 pl-2 border-l border-purple-500/30">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-300">
              {t.brush || 'Brush'}
            </span>
            <div className="w-28">
              <Slider
                value={[brushSize]}
                min={5}
                max={50}
                step={1}
                onValueChange={(values) => setBrushSize(values[0] ?? brushSize)}
                aria-label={language === 'zh' ? '画笔大小' : 'Brush size'}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{brushSize}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearBrushStrokes}
              disabled={!brushStrokesCount}
              className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30 disabled:opacity-50"
              title={language === 'zh' ? '清除画笔笔触' : 'Clear brush strokes'}
            >
              <Eraser className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <Button 
          variant="ghost"
          onClick={handleMasksToggle}
          className={`flex items-center gap-2 hover:bg-accent rounded-lg px-3 py-2 h-9 border border-purple-500/30 ${showMasks ? 'bg-purple-500/20' : ''}`}
          aria-pressed={showMasks}
          title={showMasks ? (language === 'zh' ? '隐藏蒙版' : 'Hide masks') : (language === 'zh' ? '显示蒙版' : 'Show masks')}
        >
          {showMasks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-sm">{t.masks ?? 'Masks'}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleSave}
          disabled={!canvasImage || isGenerating || isUpscaling}
          className="flex items-center gap-2 hover:bg-accent rounded-lg px-3 py-2 h-9 border border-purple-500/30 disabled:opacity-50"
          title={language === 'zh' ? '保存当前画布' : 'Save current canvas'}
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">{t.save}</span>
        </Button>
      </div>

      {/* Right section: Theme and Menu Icons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleThemeToggle}
          className="hover:bg-accent rounded-lg w-9 h-9 border bg-blue-500/20 border-blue-500/50 dark:bg-yellow-500/20 dark:border-yellow-500/50"
        >
          <Moon className="w-4 h-4 text-blue-400 dark:hidden" />
          <Sun className="w-4 h-4 text-yellow-400 hidden dark:block" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-accent rounded-lg w-9 h-9 border border-purple-500/30"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowCategoryModal(true)}>
              <Layers className="mr-2 h-4 w-4" />
              <span>{t.menuPromptCategories || 'Prompt Categories'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowTemplateModal(true)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{t.menuTemplateManagement || 'Template Management'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternal('/tutorials/?utm_source=AI_POD_Lite')}>
              <GraduationCap className="mr-2 h-4 w-4" />
              <span>{t.menuTutorials || 'Tutorials'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternal('/community/?utm_source=AI_POD_Lite')}>
              <Users className="mr-2 h-4 w-4" />
              <span>{t.menuCommunity || 'Community'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternal('/assets/?utm_source=AI_POD_Lite')}>
              <Package className="mr-2 h-4 w-4" />
              <span>{t.menuAssets || 'My Assets'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternal('/wallet/?utm_source=AI_POD_Lite')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>{t.menuWallet || 'Withdraw & Deposit'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowSettingsModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t.settings || 'Settings'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowInfoModal(true)}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t.about || 'About'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 dark:text-red-400" onSelect={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{logoutLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
    <CategoryManagementModal open={showCategoryModal} onOpenChange={setShowCategoryModal} />
    <TemplateManagementModal open={showTemplateModal} onOpenChange={setShowTemplateModal} />
    <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
    <InfoModal open={showInfoModal} onOpenChange={setShowInfoModal} />
    <SaveSuccessModal
      open={showSaveSuccessModal}
      onOpenChange={setShowSaveSuccessModal}
      galleryName={savedGalleryName}
      savedPath={savedImagePath}
      imageData={savedImageData}
    />
    </>
  );
}