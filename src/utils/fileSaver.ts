import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

function getExtensionFromMime(mime: string | null): string {
  if (!mime) return 'png';

  switch (mime.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'png';
  }
}

function appendExtension(filename: string, extension: string): string {
  if (!filename) {
    return `ai-studio-pro-${Date.now()}.${extension}`;
  }

  if (filename.toLowerCase().endsWith(`.${extension}`)) {
    return filename;
  }

  // Remove existing extension before appending to avoid duplicates
  const cleaned = filename.includes('.')
    ? filename.slice(0, filename.lastIndexOf('.'))
    : filename;

  return `${cleaned}.${extension}`;
}

async function getImagePayload(source: string): Promise<{
  bytes: Uint8Array;
  blob: Blob;
  mimeType: string;
  extension: string;
}> {
  if (source.startsWith('data:')) {
    const matches = source.match(/^data:(.*?);base64,(.*)$/);
    const mimeType = matches?.[1] || 'image/png';
    const base64Data = matches?.[2] || source.split(',')[1] || '';
    if (!base64Data) {
      throw new Error('Invalid data URL supplied for saving.');
    }

  const rawBytes = base64ToUint8Array(base64Data);
  const arrayBuffer = new ArrayBuffer(rawBytes.length);
  const bytes = new Uint8Array(arrayBuffer);
  bytes.set(rawBytes);
  const blob = new Blob([bytes], { type: mimeType });
  const extension = getExtensionFromMime(mimeType);

  return { bytes, blob, mimeType, extension };
  }

  const response = await fetch(source, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Failed to fetch image for download (${response.status})`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const mimeType = blob.type || response.headers.get('content-type') || 'image/png';
  const extension = getExtensionFromMime(mimeType);

  return { bytes, blob, mimeType, extension };
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save an image using Tauri's file dialog
 */
export async function saveImageWithDialog(source: string, defaultName?: string): Promise<boolean> {
  let payload: Awaited<ReturnType<typeof getImagePayload>> | undefined;
  let filename = appendExtension(defaultName ?? '', 'png');

  try {
    payload = await getImagePayload(source);
    filename = appendExtension(defaultName ?? '', payload.extension);

    console.log('Opening native save dialog...');
    const uniqueExtensions = Array.from(new Set(['png', 'jpg', 'jpeg', payload.extension]));

    const filePath = await save({
      title: 'Save Image',
      filters: uniqueExtensions.map((ext) => ({
        name: `${ext.toUpperCase()} Image`,
        extensions: [ext]
      })),
      defaultPath: filename,
    });

    console.log('Selected path:', filePath);

    if (filePath) {
      await writeFile(filePath, payload.bytes);
      console.log('File saved successfully via Tauri!');
      return true;
    }

    console.log('Save cancelled by user');
    return false;
  } catch (error: any) {
  if (!payload) {
      console.error('Failed preparing image for download:', error);
      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
        return false;
      }
      throw error;
    }

    // Check if it's really not in Tauri or just an error
    if (error?.message?.includes('not running under tauri') || error?.message?.includes('window.__TAURI_INTERNALS__')) {
      console.log('Not in Tauri environment, using browser download');
      downloadBlob(payload.blob, filename);
      return true;
    }

    console.error('Error saving file:', error);
    try {
      downloadBlob(payload.blob, filename);
      return true;
    } catch (fallbackError) {
      console.error('Browser save fallback failed:', fallbackError);
    }
    
    return false;
  }
}