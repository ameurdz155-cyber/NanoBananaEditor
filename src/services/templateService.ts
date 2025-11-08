/**
 * Template API Service
 */

import { PromptTemplate } from '../types';
import { joinBackendPath } from './apiConfig';

export interface TemplateCreateRequest {
  name: string;
  description?: string;
  positivePrompt: string;
  negativePrompt?: string;
  categoryId?: string;
  emoji?: string;
  image?: string;
  isDefault?: boolean;
}

export interface TemplateUpdateRequest {
  name?: string;
  description?: string;
  positivePrompt?: string;
  negativePrompt?: string;
  categoryId?: string | null;
  emoji?: string | null;
  image?: string | null;
  isDefault?: boolean;
}

const getAuthToken = (): string | null => localStorage.getItem('access_token');

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchTemplates = async (): Promise<PromptTemplate[]> => {
  const response = await fetch(joinBackendPath('/api/v1/templates'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let message = 'Failed to load templates';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data;
};

export const createTemplate = async (payload: TemplateCreateRequest): Promise<PromptTemplate> => {
  const response = await fetch(joinBackendPath('/api/v1/templates'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to create template';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  return response.json();
};

export const updateTemplate = async (
  templateId: string,
  payload: TemplateUpdateRequest
): Promise<PromptTemplate> => {
  const response = await fetch(joinBackendPath(`/api/v1/templates/${templateId}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to update template';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  return response.json();
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  const response = await fetch(joinBackendPath(`/api/v1/templates/${templateId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let message = 'Failed to delete template';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.detail === 'string') {
        message = errorBody.detail;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }
};
