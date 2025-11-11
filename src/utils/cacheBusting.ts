/**
 * Cache busting utilities to prevent browser caching issues
 */

// Generate a version hash based on build time
const APP_VERSION = Date.now().toString(36);

/**
 * Add cache-busting parameter to URL
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${APP_VERSION}&_=${Date.now()}`;
}

/**
 * Clear all browser caches
 */
export async function clearAllCaches(): Promise<void> {
  // Clear service worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ Service worker caches cleared');
  }
  
  // Clear session storage (keep localStorage for user data)
  if ('sessionStorage' in window) {
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
  }
  
  console.log('✅ All caches cleared');
}

/**
 * Force reload CSS without cache
 */
export function reloadStylesheets(): void {
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
  links.forEach((link) => {
    const href = link.href.split('?')[0];
    link.href = addCacheBuster(href);
  });
  console.log('✅ Stylesheets reloaded');
}

/**
 * Add no-cache headers to fetch requests
 */
export function createNoCacheFetch() {
  return (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const cacheBustedUrl = addCacheBuster(urlString);
    
    const headers = new Headers(init?.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return fetch(cacheBustedUrl, {
      ...init,
      headers,
      cache: 'no-store'
    });
  };
}

/**
 * Initialize cache busting on app start
 */
export function initCacheBusting(): void {
  // Clear caches on load
  clearAllCaches().catch(console.error);
  
  // Log app version
  console.log(`🚀 App Version: ${APP_VERSION}`);
  
  // Reload stylesheets if needed
  if (document.readyState === 'complete') {
    reloadStylesheets();
  } else {
    window.addEventListener('load', reloadStylesheets);
  }
}
