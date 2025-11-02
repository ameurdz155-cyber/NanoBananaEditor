import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest } from '../services/authService';

interface AuthState {
  token: string | null;
  user: { username: string } | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        const result = await loginRequest({ username, password });
        set({
          token: result.access_token,
          user: { username: result.username },
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ai-pod-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
