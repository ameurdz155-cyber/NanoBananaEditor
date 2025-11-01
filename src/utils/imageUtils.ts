export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:image/png;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function createImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}

export function resizeImageToFit(
  image: HTMLImageElement, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  return {
    width: image.width * ratio,
    height: image.height * ratio
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function downloadImage(base64: string, filename: string): void {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Resize or crop an image to the target dimensions while preserving detail.
 * Returns a data URL in PNG format.
 */
export async function transformImageToDimensions(
  sourceDataUrl: string,
  targetWidth: number,
  targetHeight: number,
  fit: 'cover' | 'contain' = 'cover'
): Promise<string> {
  if (!sourceDataUrl.startsWith('data:')) {
    return sourceDataUrl;
  }

  if (targetWidth <= 0 || targetHeight <= 0) {
    return sourceDataUrl;
  }

  const img = new Image();
  const loadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });
  img.src = sourceDataUrl;
  await loadPromise;

  // If the image already matches the requested size, no need to transform.
  if (img.naturalWidth === targetWidth && img.naturalHeight === targetHeight) {
    return sourceDataUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return sourceDataUrl;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (fit === 'cover') {
    const scale = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const dx = (targetWidth - drawWidth) / 2;
    const dy = (targetHeight - drawHeight) / 2;
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  } else {
    const scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const dx = (targetWidth - drawWidth) / 2;
    const dy = (targetHeight - drawHeight) / 2;
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  }

  return canvas.toDataURL('image/png');
}