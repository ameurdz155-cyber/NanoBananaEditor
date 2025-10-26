import { save } from '@tauri-apps/plugin-dialog';
import { writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Save an image using Tauri's file dialog
 */
export async function saveImageWithDialog(dataUrl: string, defaultName?: string): Promise<boolean> {
  try {
    console.log('Opening native save dialog...');
    
    // Try to use Tauri save dialog directly
    const filePath = await save({
      title: 'Save Image',
      filters: [{
        name: 'PNG Image',
        extensions: ['png']
      }, {
        name: 'JPEG Image',
        extensions: ['jpg', 'jpeg']
      }],
      defaultPath: defaultName || `ai-studio-pro-${Date.now()}.png`
    });

    console.log('Selected path:', filePath);

    if (filePath) {
      // Convert base64 to binary and save
      const imageData = base64ToUint8Array(dataUrl);
      console.log('Writing file to:', filePath);
      await writeFile(filePath, imageData);
      console.log('File saved successfully via Tauri!');
      return true;
    }
    
    console.log('Save cancelled by user');
    return false; // User cancelled
  } catch (error: any) {
    // Check if it's really not in Tauri or just an error
    if (error?.message?.includes('not running under tauri') || error?.message?.includes('window.__TAURI_INTERNALS__')) {
      console.log('Not in Tauri environment, using browser download');
      // Fallback to browser download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = defaultName || `ai-studio-pro-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    
    console.error('Error saving file:', error);
    throw error; // Re-throw to see the actual error
  }
}