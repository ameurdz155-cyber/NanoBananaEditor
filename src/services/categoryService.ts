/**
 * Category API Service
 * Handles all category-related API calls
 */

import { PromptCategory } from '../types';
import { joinBackendPath } from './apiConfig';

export interface CategoryCreateRequest {
  name: string;
  description?: string;
  emoji?: string;
  image?: string;
  isDefault?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  emoji?: string;
  image?: string;
  isDefault?: boolean;
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Get authorization headers
 */
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch all categories for the current user
 */
export const fetchCategories = async (): Promise<PromptCategory[]> => {
  const url = joinBackendPath('/api/v1/categories');
  const headers = getAuthHeaders();
  
  console.log('[CategoryService] Fetching categories from:', url);
  console.log('[CategoryService] Auth headers:', headers);
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  console.log('[CategoryService] Response status:', response.status);
  
  if (!response.ok) {
    let errorMessage = `Failed to fetch categories: ${response.statusText} (${response.status})`;
    try {
      const errorData = await response.json();
      console.error('[CategoryService] Error response:', errorData);
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      console.error('[CategoryService] Error response (text):', errorText);
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('[CategoryService] Received data:', data);
  return data;
};

/**
 * Create a new category
 */
export const createCategory = async (
  category: CategoryCreateRequest
): Promise<PromptCategory> => {
  const url = joinBackendPath('/api/v1/categories');
  console.log('[CategoryService] Creating category');
  console.log('[CategoryService] Create URL:', url);
  console.log('[CategoryService] Create payload:', {
    ...category,
    image: category.image ? `${category.image.substring(0, 50)}...` : undefined
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });

  console.log('[CategoryService] Create response status:', response.status);

  if (!response.ok) {
    let errorMessage = 'Failed to create category';
    try {
      const error = await response.json();
      console.error('[CategoryService] Create error:', error);
      errorMessage = error.detail || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      console.error('[CategoryService] Create error (text):', errorText);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('[CategoryService] Create result:', result);
  return result;
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: string,
  category: CategoryUpdateRequest
): Promise<PromptCategory> => {
  const url = joinBackendPath(`/api/v1/categories/${id}`);
  console.log('[CategoryService] Updating category:', id);
  console.log('[CategoryService] Update URL:', url);
  console.log('[CategoryService] Update payload:', {
    ...category,
    image: category.image ? `${category.image.substring(0, 50)}...` : undefined
  });
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(category),
  });

  console.log('[CategoryService] Update response status:', response.status);

  if (!response.ok) {
    let errorMessage = 'Failed to update category';
    try {
      const error = await response.json();
      console.error('[CategoryService] Update error:', error);
      errorMessage = error.detail || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      console.error('[CategoryService] Update error (text):', errorText);
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('[CategoryService] Update result:', result);
  return result;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(joinBackendPath(`/api/v1/categories/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete category');
  }
};

/**
 * Get a specific category by ID
 */
export const getCategory = async (id: string): Promise<PromptCategory> => {
  const response = await fetch(joinBackendPath(`/api/v1/categories/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }

  return response.json();
};
