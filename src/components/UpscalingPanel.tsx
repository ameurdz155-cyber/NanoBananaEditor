import React from 'react';
import { Upload, ChevronDown, SlidersHorizontal, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { usePromptPanelResize } from './PromptComposer/usePromptPanelResize';
import { buildJsonHeaders, joinBackendPath } from '../services/apiConfig';
import { upscaleImage } from '../services/upscaleService';
import { getTranslation } from '../i18n/translations';
import { Generation, Asset } from '../types';
import { createImageFromBase64, generateId } from '../utils/imageUtils';

export const UpscalingPanel: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = React.useState(true);
  const [creativity, setCreativity] = React.useState(0);
  const [structure, setStructure] = React.useState(0);
  const [models, setModels] = React.useState<string[]>(['imagen-3.0-002']);
  const [selectedModel, setSelectedModel] = React.useState('imagen-3.0-002');
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [sourceImage, setSourceImage] = React.useState<string | null>(null);

  const showPromptPanel = useAppStore((state) => state.showPromptPanel);
  const setShowPromptPanel = useAppStore((state) => state.setShowPromptPanel);
  const promptPanelWidth = useAppStore((state) => state.promptPanelWidth);
  const setPromptPanelWidth = useAppStore((state) => state.setPromptPanelWidth);
  const canvasImage = useAppStore((state) => state.canvasImage);
  const uploadedImages = useAppStore((state) => state.uploadedImages);
  const setCanvasImage = useAppStore((state) => state.setCanvasImage);
  const addUploadedImage = useAppStore((state) => state.addUploadedImage);
  const addGeneration = useAppStore((state) => state.addGeneration);
  const currentProject = useAppStore((state) => state.currentProject);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const language = useAppStore((state) => state.language);
  const upscaleScale = useAppStore((state) => state.upscaleScale);
  const setUpscaleScale = useAppStore((state) => state.setUpscaleScale);
  const isUpscaling = useAppStore((state) => state.isUpscaling);
  const setIsUpscaling = useAppStore((state) => state.setIsUpscaling);

  const t = React.useMemo(() => getTranslation(language), [language]);

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const requestController = React.useRef<AbortController | null>(null);

  const { handleResizeMouseDown, handleResizeTouchStart } = usePromptPanelResize({
    setPromptPanelWidth,
    showPromptPanel,
  });

  React.useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
  setLoadingModels(true);

    fetch(joinBackendPath('/models/imagen'), {
      method: 'GET',
      headers: buildJsonHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load Imagen models');
        }
        const body = await response.json();
        const fetched = Array.isArray(body?.models) ? body.models.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0) : [];
        if (isMounted && fetched.length > 0) {
          setModels(fetched);
          setSelectedModel((current) => (fetched.includes(current) ? current : fetched[0]));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setStatusMessage(null);
          setErrorMessage('Unable to load Imagen model list. Using defaults.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingModels(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  React.useEffect(() => {
    if (canvasImage) {
      setSourceImage(canvasImage);
      return;
    }
    if (uploadedImages.length > 0) {
      setSourceImage(uploadedImages[uploadedImages.length - 1]);
    }
  }, [canvasImage, uploadedImages]);

  React.useEffect(() => () => {
    requestController.current?.abort();
    setIsUpscaling(false);
  }, [setIsUpscaling]);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setErrorMessage('Unable to read selected file.');
        return;
      }
      setSourceImage(result);
      setCanvasImage(result);
      addUploadedImage(result);
      setErrorMessage(null);
      setStatusMessage('Image loaded for upscaling.');
    };
    reader.onerror = () => {
      setErrorMessage('Failed to load image. Please try a different file.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const toBase64Payload = React.useCallback(async (image: string): Promise<string> => {
    if (image.startsWith('data:')) {
      const [, payload] = image.split('base64,');
      return payload || '';
    }
    const response = await fetch(image);
    if (!response.ok) {
      throw new Error('Unable to load source image for upscaling.');
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const baseReader = new FileReader();
      baseReader.onload = () => {
        const result = typeof baseReader.result === 'string' ? baseReader.result : '';
        const [, payload] = result.split('base64,');
        resolve(payload || '');
      };
      baseReader.onerror = () => reject(new Error('Failed to process source image.'));
      baseReader.readAsDataURL(blob);
    });
  }, []);

  const handleUpscaleAction = React.useCallback(async () => {
    if (isUpscaling) {
      setStatusMessage('Stopping upscaling...');
      setErrorMessage(null);
      requestController.current?.abort();
      requestController.current = null;
      setIsUpscaling(false);
      return;
    }

    if (!sourceImage) {
      setErrorMessage('Upload an image or send one from the canvas to start upscaling.');
      setStatusMessage(null);
      return;
    }

    const controller = new AbortController();
    requestController.current = controller;
    setIsUpscaling(true);
    setErrorMessage(null);
    setStatusMessage('Upscaling in progress...');

    try {
      const imagePayload = await toBase64Payload(sourceImage);
      if (!imagePayload) {
        throw new Error('The selected image could not be processed.');
      }

      const response = await upscaleImage(
        {
          image: imagePayload,
          scale: upscaleScale,
          model: selectedModel,
        },
        controller.signal,
      );

      const inferMimeType = (value: string): string => {
        const dataUrlMatch = /^data:(.*?);base64,/.exec(value);
        if (dataUrlMatch && dataUrlMatch[1]) {
          return dataUrlMatch[1];
        }
        const lower = value.toLowerCase();
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.webp')) return 'image/webp';
        if (lower.endsWith('.gif')) return 'image/gif';
        if (lower.endsWith('.bmp')) return 'image/bmp';
        if (lower.endsWith('.svg')) return 'image/svg+xml';
        if (lower.endsWith('.avif')) return 'image/avif';
        return 'image/png';
      };

      const dataUrl = response.image.b64_data.startsWith('data:')
        ? response.image.b64_data
        : `data:${response.image.mime_type || 'image/png'};base64,${response.image.b64_data}`;

      const upscaledBase64 = response.image.b64_data.startsWith('data:')
        ? response.image.b64_data.split('base64,')[1] || ''
        : response.image.b64_data;

      let outputWidth = 0;
      let outputHeight = 0;
      if (upscaledBase64) {
        try {
          const upscaledImageElement = await createImageFromBase64(upscaledBase64);
          outputWidth = upscaledImageElement.naturalWidth || upscaledImageElement.width || 0;
          outputHeight = upscaledImageElement.naturalHeight || upscaledImageElement.height || 0;
        } catch (dimensionError) {
          console.warn('Unable to calculate upscaled image dimensions:', dimensionError);
        }
      }

      let sourceWidth = 0;
      let sourceHeight = 0;
      try {
        const sourceImageElement = await createImageFromBase64(imagePayload);
        sourceWidth = sourceImageElement.naturalWidth || sourceImageElement.width || 0;
        sourceHeight = sourceImageElement.naturalHeight || sourceImageElement.height || 0;
      } catch (dimensionError) {
        console.warn('Unable to calculate source image dimensions:', dimensionError);
      }

      const sourceMime = inferMimeType(sourceImage);
      const outputMime = response.image.mime_type || inferMimeType(dataUrl);
      const sourceDataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : `data:${sourceMime};base64,${imagePayload}`;

      const sourceAsset: Asset = {
        id: generateId(),
        type: 'original',
        url: sourceDataUrl,
        mime: sourceMime,
        width: sourceWidth,
        height: sourceHeight,
        checksum: imagePayload.slice(0, 32),
      };

      const outputAsset: Asset = {
        id: generateId(),
        type: 'output',
        url: dataUrl,
        mime: outputMime,
        width: outputWidth,
        height: outputHeight,
        checksum: upscaledBase64.slice(0, 32),
      };

      const parameters: Generation['parameters'] = {
        referenceCount: 1,
      };
      if (outputWidth > 0) {
        parameters.width = outputWidth;
      }
      if (outputHeight > 0) {
        parameters.height = outputHeight;
      }
      if (outputWidth > 0 && outputHeight > 0) {
        parameters.aspectRatio = `${outputWidth}:${outputHeight}`;
      }

      const generation: Generation = {
        id: generateId(),
        prompt: 'Upscaling result',
        parameters,
        sourceAssets: [sourceAsset],
        outputAssets: [outputAsset],
        modelVersion: response.model,
        timestamp: Date.now(),
        tags: ['upscall'],
      };

      if (currentProject) {
        addGeneration(generation);
      } else {
        const now = Date.now();
        setCurrentProject({
          id: generateId(),
          title: 'Upscaling Session',
          generations: [generation],
          edits: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      setCanvasImage(dataUrl);
      addUploadedImage(dataUrl);
      setSourceImage(dataUrl);
      setUpscaleScale(response.scale);
      setStatusMessage(`Upscaling complete (${response.scale}x) with ${response.model}. Saved to history as UPSCALL.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatusMessage('Upscaling stopped.');
      } else {
        const message = error instanceof Error ? error.message : 'Upscaling failed. Please try again.';
        setErrorMessage(message);
        setStatusMessage(null);
      }
    } finally {
      setIsUpscaling(false);
      requestController.current = null;
    }
  }, [
    isUpscaling,
    setIsUpscaling,
    sourceImage,
    toBase64Payload,
    upscaleScale,
    selectedModel,
    setCanvasImage,
    addUploadedImage,
    addGeneration,
    currentProject,
    setCurrentProject,
    setUpscaleScale,
  ]);

  React.useEffect(() => {
    const handleTrigger = () => {
      void handleUpscaleAction();
    };
    window.addEventListener('triggerUpscaleAction', handleTrigger);
    return () => {
      window.removeEventListener('triggerUpscaleAction', handleTrigger);
    };
  }, [handleUpscaleAction]);

  if (!showPromptPanel) {
    return (
      <div
        className="relative h-full flex-shrink-0 bg-gray-950 border-r border-gray-800 flex items-center justify-center"
        style={{ width: '48px' }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPromptPanel(true)}
          title="Show prompt panel"
          className="h-9 w-9 rounded-full border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Show prompt panel"
        >
          <ChevronLeft className="h-5 w-5 rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="relative h-full flex-shrink-0 bg-gray-950 border-r border-gray-800 overflow-visible"
      style={{ width: `${Math.round(promptPanelWidth)}px` }}
    >
      <div
        className="absolute inset-y-0 -right-1 w-3 cursor-col-resize group z-20"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        aria-label="Resize prompt panel"
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 right-0 w-1 bg-gray-700/40 group-hover:bg-teal-400/70 transition-all" />
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-0.5 h-16 bg-teal-400 rounded-full shadow-lg shadow-teal-500/40" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            setShowPromptPanel(false);
          }}
          title="Hide prompt panel"
          className="absolute top-6 -right-3 h-8 w-8 rounded-full border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors z-[9999] opacity-60 hover:opacity-100 pointer-events-auto shadow-lg"
          aria-label="Hide prompt panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-full overflow-y-auto sidebar-scrollbar">
        <div className="p-5 space-y-5">
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 shadow-lg shadow-teal-500/10">
            <header className="px-4 py-3 border-b border-gray-800/80">
              <p className="text-xs uppercase tracking-wider text-teal-300">Upscale</p>
              <h2 className="text-base font-semibold text-gray-100">Upscale Model</h2>
            </header>

            <div className="p-4 space-y-5">
              <div className="rounded-lg border border-dashed border-teal-500/40 bg-gray-900/60 p-4 text-center space-y-3">
                {sourceImage ? (
                  <div className="overflow-hidden rounded-lg border border-gray-800/60 bg-black/40">
                    <img
                      src={sourceImage}
                      alt="Selected for upscaling"
                      className="mx-auto max-h-48 w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    <p className="text-sm font-medium text-gray-100">No image selected</p>
                    <p className="mt-1">Upload or send an image to begin upscaling.</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 w-full rounded-full border border-teal-500/40 text-teal-300 hover:text-teal-200 hover:border-teal-300"
                  aria-label={sourceImage ? 'Replace image for upscaling' : 'Upload image for upscaling'}
                  onClick={handleUploadButtonClick}
                  disabled={isUpscaling}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {sourceImage ? 'Replace image' : 'Upload image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Upscale Model</label>
                {models.length > 0 ? (
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                      disabled={isUpscaling || loadingModels}
                    >
                      {models.map((model) => (
                        <option key={model} value={model} className="bg-gray-950 text-gray-900">
                          {model}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-500">
                    <span>No Imagen models available</span>
                  </div>
                )}
                {loadingModels && (
                  <p className="text-[11px] text-gray-500">Loading model list…</p>
                )}
                <p className="text-[11px] leading-snug text-amber-400/90">
                  Models are fetched from Google Imagen. Upscaling uses mock processing and returns the same image.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t.scaleLabel || 'Scale'}</span>
                  <span className="text-sm font-semibold text-gray-100">{upscaleScale}x</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={upscaleScale}
                  onChange={(event) => setUpscaleScale(Number(event.target.value))}
                  className="w-full h-2 rounded-full bg-gray-800/70 accent-teal-400"
                  disabled={isUpscaling || loadingModels}
                />
              </div>

              <div className="rounded-lg border border-gray-800/90 bg-gray-900/80">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800/70"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Advanced Options
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="space-y-4 px-4 pb-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Creativity</span>
                        <span className="text-xs text-gray-200">{creativity}</span>
                      </div>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={1}
                        value={creativity}
                        onChange={(event) => setCreativity(Number(event.target.value))}
                        className="w-full h-2 rounded-full bg-gray-800/70 accent-purple-400"
                        disabled={isUpscaling}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Structure</span>
                        <span className="text-xs text-gray-200">{structure}</span>
                      </div>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={1}
                        value={structure}
                        onChange={(event) => setStructure(Number(event.target.value))}
                        className="w-full h-2 rounded-full bg-gray-800/70 accent-blue-400"
                        disabled={isUpscaling}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {statusMessage && (
                  <p className="text-xs text-teal-300" role="status" aria-live="polite">
                    {statusMessage}
                  </p>
                )}
                {errorMessage && (
                  <p className="text-xs text-red-400" role="alert">
                    {errorMessage}
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full justify-center bg-teal-500 text-black font-semibold hover:bg-teal-400 disabled:opacity-60"
                  onClick={handleUpscaleAction}
                  aria-pressed={isUpscaling}
                  disabled={!selectedModel || !sourceImage || loadingModels}
                >
                  {isUpscaling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.stopUpscaling || 'Stop Upscaling'}
                    </span>
                  ) : (
                    <span>{`${t.startUpscaling || 'Upscale'} ×${upscaleScale}`}</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
