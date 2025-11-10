/**
 * History Service - API calls for managing generation history
 */

import { buildJsonHeaders, joinBackendPath } from './apiConfig';
import { fetchWithAuth } from './fetchWithAuth';
import { Generation } from '../types';

export interface HistoryListResponse {
  items: Generation[];
  total: number;
}

class HistoryService {
  private getUrl(path: string = ''): string {
    return joinBackendPath(`/api/v1/history${path}`);
  }

  /**
   * Create a new history entry
   */
  async createHistoryEntry(generation: Generation): Promise<Generation> {
    const response = await fetchWithAuth(this.getUrl(), {
      method: 'POST',
      headers: buildJsonHeaders(),
      body: JSON.stringify({
        id: generation.id,
        prompt: generation.prompt,
        negativePrompt: generation.negativePrompt,
        parameters: generation.parameters,
        sourceAssets: generation.sourceAssets,
        outputAssets: generation.outputAssets,
        modelVersion: generation.modelVersion,
        timestamp: generation.timestamp,
        costEstimate: generation.costEstimate,
        tags: generation.tags,
      }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        // Entry already exists, this is okay
        console.log('History entry already exists');
        return generation;
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to save history entry');
    }

    return response.json();
  }

  /**
   * Get all history entries for the current user
   */
  async getHistory(limit: number = 100, offset: number = 0): Promise<HistoryListResponse> {
    const url = `${this.getUrl()}?limit=${limit}&offset=${offset}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to fetch history');
    }

    return response.json();
  }

  /**
   * Get a specific history entry by ID
   */
  async getHistoryItem(historyId: string): Promise<Generation> {
    const response = await fetchWithAuth(this.getUrl(`/${historyId}`), {
      method: 'GET',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('History entry not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to fetch history entry');
    }

    return response.json();
  }

  /**
   * Delete a specific history entry
   */
  async deleteHistoryItem(historyId: string): Promise<void> {
    const response = await fetchWithAuth(this.getUrl(`/${historyId}`), {
      method: 'DELETE',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('History entry not found');
      }
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to delete history entry');
    }
  }

  /**
   * Clear all history for the current user
   */
  async clearHistory(): Promise<void> {
    const response = await fetchWithAuth(this.getUrl(), {
      method: 'DELETE',
      headers: buildJsonHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        throw new Error('Your session has expired. Please log in again.');
      }
      throw new Error('Failed to clear history');
    }
  }
}

export const historyService = new HistoryService();
