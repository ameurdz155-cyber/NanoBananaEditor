/**
 * Fetch wrapper that automatically handles token refresh on 401 errors
 */

import { useAuthStore } from '../store/useAuthStore';

/**
 * Performs a fetch request with automatic token refresh on 401 errors
 * Also proactively refreshes tokens that are expiring soon
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @returns Response object
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const authStore = useAuthStore.getState();
  
  // Proactively refresh if token is expiring soon
  if (authStore.isTokenExpiringSoon()) {
    console.log('Token expiring soon, refreshing proactively...');
    await authStore.refreshAuthToken();
    
    // Update the Authorization header with the new token
    const newToken = useAuthStore.getState().token;
    if (newToken && init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', `Bearer ${newToken}`);
      } else if (Array.isArray(init.headers)) {
        const authIndex = init.headers.findIndex(([key]) => key.toLowerCase() === 'authorization');
        if (authIndex !== -1) {
          init.headers[authIndex] = ['Authorization', `Bearer ${newToken}`];
        } else {
          init.headers.push(['Authorization', `Bearer ${newToken}`]);
        }
      } else {
        (init.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      }
    }
  }
  
  // Make the initial request
  let response = await fetch(input, init);

  // If we get a 401 Unauthorized, try to refresh the token and retry
  if (response.status === 401) {
    console.log('Received 401, attempting token refresh...');
    
    const authStore = useAuthStore.getState();
    const refreshSuccess = await authStore.refreshAuthToken();

    if (refreshSuccess) {
      console.log('Token refreshed successfully, retrying request...');
      
      // Update the Authorization header with the new token
      if (init?.headers) {
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          // Handle different header types (Headers object, array, or plain object)
          if (init.headers instanceof Headers) {
            init.headers.set('Authorization', `Bearer ${newToken}`);
          } else if (Array.isArray(init.headers)) {
            // Find and update Authorization header in array
            const authIndex = init.headers.findIndex(([key]) => key.toLowerCase() === 'authorization');
            if (authIndex !== -1) {
              init.headers[authIndex] = ['Authorization', `Bearer ${newToken}`];
            } else {
              init.headers.push(['Authorization', `Bearer ${newToken}`]);
            }
          } else {
            // Plain object
            (init.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          }
        }
      }

      // Retry the request with the new token
      response = await fetch(input, init);
    } else {
      console.warn('Token refresh failed, user will be logged out');
    }
  }

  return response;
}
