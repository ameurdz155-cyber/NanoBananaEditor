/**
 * Boards Service
 * Handles communication with the boards backend API
 */

// @ts-ignore - Vite env variables
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:9000';

interface SaveImageResponse {
  success: boolean;
  image_id: string;
  board_id: string;
  message: string;
}

interface BoardImage {
  id: string;
  user_id: string;
  board_id: string;
  board_name: string;
  image_data: string;
  path?: string;
  timestamp: number;
  created_at: string;
}

/**
 * Save an image to a specific board in the backend
 */
export async function saveImageToBoard(
  boardId: string,
  imageId: string,
  imageData: string,
  boardName?: string,
  path?: string
): Promise<SaveImageResponse> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/boards/${boardId}/save-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      image_id: imageId,
      image_data: imageData,
      board_name: boardName,
      path: path,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to save image' }));
    throw new Error(error.detail || 'Failed to save image to board');
  }

  return response.json();
}

/**
 * Get all images from a specific board
 */
export async function getBoardImages(boardId: string): Promise<BoardImage[]> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/boards/${boardId}/images`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch images' }));
    throw new Error(error.detail || 'Failed to fetch board images');
  }

  return response.json();
}

/**
 * Remove an image from a board
 */
export async function removeImageFromBoard(
  boardId: string,
  imageId: string
): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/boards/${boardId}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to remove image' }));
    throw new Error(error.detail || 'Failed to remove image from board');
  }
}
