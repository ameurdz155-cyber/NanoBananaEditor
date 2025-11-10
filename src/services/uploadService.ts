import { joinBackendPath } from './apiConfig';

export interface UploadAssetResponse {
  asset_id: string;
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

/**
 * Build headers for file upload (multipart/form-data).
 * Don't set Content-Type - let the browser set it with boundary.
 */
function buildUploadHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Add JWT token for authentication
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Upload a file to the backend and get a temporary asset URL.
 * This avoids storing large base64 strings in memory and localStorage.
 * Assets are automatically cleaned up after 24 hours.
 */
export async function uploadAsset(file: File): Promise<UploadAssetResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(joinBackendPath('/api/v1/upload/asset'), {
    method: 'POST',
    headers: buildUploadHeaders(),
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to upload asset';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete an uploaded asset from the backend.
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const response = await fetch(joinBackendPath(`/api/v1/assets/${assetId}`), {
    method: 'DELETE',
    headers: buildUploadHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete asset');
  }
}

/**
 * Get the full URL for an asset.
 */
export function getAssetUrl(assetId: string): string {
  return joinBackendPath(`/api/v1/assets/${assetId}`);
}

/**
 * Convert a file to a data URL for preview purposes only.
 * For actual image processing, use uploadAsset() instead.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an asset URL to base64 for backend processing.
 * Only use this when the backend requires base64 input.
 */
export async function assetUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: buildUploadHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset');
  }
  
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 part without data URL prefix
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to convert asset to base64'));
    reader.readAsDataURL(blob);
  });
}
