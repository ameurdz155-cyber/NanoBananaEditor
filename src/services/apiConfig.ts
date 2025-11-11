const FALLBACK_BASE_URL = 'http://127.0.0.1:9000';

const sanitizeBaseUrl = (value: string | undefined | null): string => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return FALLBACK_BASE_URL;
  }

  try {
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;
    const url = new URL(withScheme);
    return url.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_BASE_URL;
  }
};

const BASE_URL = sanitizeBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);

const API_KEY = (() => {
  const raw = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
})();

export const getStoredBackendUrl = (): string => BASE_URL;

export const getStoredApiKey = (): string | null => API_KEY;

export const joinBackendPath = (path: string): string => {
  const base = getStoredBackendUrl().replace(/\/$/, '');
  const cleanPath = !path.startsWith('/') ? `/${path}` : path;
  
  // Add cache-busting timestamp to prevent browser caching
  const cacheBuster = `_t=${Date.now()}`;
  const separator = path.includes('?') ? '&' : '?';
  
  return `${base}${cleanPath}${separator}${cacheBuster}`;
};

export const buildJsonHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Disable caching
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(extra ?? {}),
  };
  
  // Add JWT token for authentication
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add API key if available
  const apiKey = getStoredApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  
  return headers;
};
