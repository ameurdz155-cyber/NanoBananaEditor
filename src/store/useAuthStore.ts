import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest, registerRequest } from '../services/authService';

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isPremiumUser: false,
      login: async (username: string, password: string) => {
        const result = await loginRequest({ username, password });
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
        set({ 
          token: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false, 
          isPremiumUser: false 
        });
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
    }
  )
);
