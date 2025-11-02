const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:9000';

export const BACKEND_URL_STORAGE_KEY = 'ai_pod_backend_url';
export const API_KEY_STORAGE_KEY = 'gemini_api_key';

const sanitizeBaseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_BASE_URL;
  }

  try {
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;
    const url = new URL(withScheme);
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_BASE_URL;
  }
};

export const getStoredBackendUrl = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_BASE_URL;
  }
  const stored = window.localStorage.getItem(BACKEND_URL_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_BASE_URL;
  }
  return sanitizeBaseUrl(stored);
};

export const setStoredBackendUrl = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!value.trim()) {
    window.localStorage.removeItem(BACKEND_URL_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(BACKEND_URL_STORAGE_KEY, sanitizeBaseUrl(value));
};

export const getStoredApiKey = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const key = window.localStorage.getItem(API_KEY_STORAGE_KEY);
  return key && key.trim() ? key.trim() : null;
};

export const setStoredApiKey = (value: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!value || !value.trim()) {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
};

export const joinBackendPath = (path: string): string => {
  const base = getStoredBackendUrl().replace(/\/$/, '');
  if (!path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
};

export const buildJsonHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra ?? {}),
  };
  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
};
