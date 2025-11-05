import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest } from '../services/authService';

interface AuthState {
  token: string | null;
  user: { username: string; plan?: 'free' | 'premium' } | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isPremiumUser: false,
      login: async (username: string, password: string) => {
        const result = await loginRequest({ username, password });
        const plan = result.plan === 'premium' ? 'premium' : 'free';
        set({
          token: result.access_token,
          user: { username: result.username, plan },
          isAuthenticated: true,
          isPremiumUser: plan === 'premium',
        });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isPremiumUser: false });
      },
    }),
    {
      name: 'ai-pod-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isPremiumUser: state.isPremiumUser,
      }),
    }
  )
);
