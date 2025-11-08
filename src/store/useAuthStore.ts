import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchCurrentUser, loginRequest, registerRequest } from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_admin: boolean;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  verifyAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isPremiumUser: false,
      login: async (username: string, password: string) => {
        const result = await loginRequest({ username, password });

        // Keep a plain access token entry for legacy consumers that read localStorage directly.
        localStorage.setItem('access_token', result.access_token);
        if (result.refresh_token) {
          localStorage.setItem('refresh_token', result.refresh_token);
        }

        set({
          token: result.access_token,
          refreshToken: result.refresh_token,
          user: {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            full_name: result.user.full_name,
            is_admin: result.user.is_admin,
            is_superuser: result.user.is_superuser,
          },
          isAuthenticated: true,
          isPremiumUser: result.user.is_admin || result.user.is_superuser,
        });
      },
      register: async (email: string, username: string, password: string, fullName?: string) => {
        const user = await registerRequest({ 
          email, 
          username, 
          password,
          full_name: fullName 
        });
        
        // After registration, automatically log in
        const loginResult = await loginRequest({ username, password });

        localStorage.setItem('access_token', loginResult.access_token);
        if (loginResult.refresh_token) {
          localStorage.setItem('refresh_token', loginResult.refresh_token);
        }

        set({
          token: loginResult.access_token,
          refreshToken: loginResult.refresh_token,
          user: {
            id: loginResult.user.id,
            email: loginResult.user.email,
            username: loginResult.user.username,
            full_name: loginResult.user.full_name,
            is_admin: loginResult.user.is_admin,
            is_superuser: loginResult.user.is_superuser,
          },
          isAuthenticated: true,
          isPremiumUser: loginResult.user.is_admin || loginResult.user.is_superuser,
        });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ 
          token: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false, 
          isPremiumUser: false 
        });
      },
      verifyAuth: async () => {
        const stateToken = get().token;
        const token = stateToken ?? localStorage.getItem('access_token');

        if (!token) {
          get().logout();
          return false;
        }

        try {
          const currentUser = await fetchCurrentUser(token);

          localStorage.setItem('access_token', token);
          const refreshToken = localStorage.getItem('refresh_token') ?? null;

          set({
            token,
            refreshToken,
            user: {
              id: currentUser.id,
              email: currentUser.email,
              username: currentUser.username,
              full_name: currentUser.full_name,
              is_admin: currentUser.is_admin,
              is_superuser: currentUser.is_superuser,
            },
            isAuthenticated: true,
            isPremiumUser: currentUser.is_admin || currentUser.is_superuser,
          });

          return true;
        } catch (error) {
          console.warn('Auth verification failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'ai-pod-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isPremiumUser: state.isPremiumUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        if (state.token) {
          localStorage.setItem('access_token', state.token);
        } else {
          localStorage.removeItem('access_token');
        }

        if (state.refreshToken) {
          localStorage.setItem('refresh_token', state.refreshToken);
        } else {
          localStorage.removeItem('refresh_token');
        }
      },
    }
  )
);
