/**
 * Board Service - API calls for managing gallery boards/folders
 */

import { buildJsonHeaders, joinBackendPath } from './apiConfig';
import { fetchWithAuth } from './fetchWithAuth';

export interface Board {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  created_at: number;
  updated_at: number;
  image_ids: string[];
  user_id: string;
}

export interface CreateBoardRequest {
  name: string;
  emoji?: string;
  description?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  emoji?: string;
  description?: string;
}

export interface AddImagesToBoardRequest {
  image_ids: string[];
}

class BoardService {
  private getUrl(path: string = ''): string {
    return joinBackendPath(`/api/v1/boards${path}`);
  }

  /**
   * Create a new board
   */
  async createBoard(data: CreateBoardRequest): Promise<Board> {
    const response = await fetchWithAuth(this.getUrl(), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('A board with this name already exists');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create board');
    }

    return response.json();
  }

  /**
   * Get all boards for the current user
   */
  async getBoards(): Promise<Board[]> {
    const response = await fetchWithAuth(this.getUrl(), {
      method: 'GET',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to fetch boards');
    }

    return response.json();
  }

  /**
   * Get a specific board by ID
   */
  async getBoard(boardId: string): Promise<Board> {
    const response = await fetchWithAuth(this.getUrl(`/${boardId}`), {
      method: 'GET',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to fetch board');
    }

    return response.json();
  }

  /**
   * Update a board
   */
  async updateBoard(boardId: string, data: UpdateBoardRequest): Promise<Board> {
    const response = await fetchWithAuth(this.getUrl(`/${boardId}`), {
      method: 'PUT',
      headers: buildJsonHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      if (response.status === 409) {
        throw new Error('A board with this name already exists');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update board');
    }

    return response.json();
  }

  /**
   * Delete a board
   */
  async deleteBoard(boardId: string): Promise<void> {
    const response = await fetchWithAuth(this.getUrl(`/${boardId}`), {
      method: 'DELETE',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to delete board');
    }
  }

  /**
   * Add images to a board
   */
  async addImagesToBoard(boardId: string, data: AddImagesToBoardRequest): Promise<Board> {
    const response = await fetchWithAuth(this.getUrl(`/${boardId}/images`), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to add images to board');
    }

    return response.json();
  }

  /**
   * Remove an image from a board
   */
  async removeImageFromBoard(boardId: string, imageId: string): Promise<Board> {
    const response = await fetchWithAuth(this.getUrl(`/${boardId}/images/${imageId}`), {
      method: 'DELETE',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Board not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to remove image from board');
    }

    return response.json();
  }
}

export const boardService = new BoardService();
