import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest } from '../services/authService';

interface AuthState {
  token: string | null;
  user: { username: string; plan?: 'free' | 'premium' | 'admin' } | null;
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  isAdmin: boolean;
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
      isAdmin: false,
      login: async (username: string, password: string) => {
        const result = await loginRequest({ username, password });
        const rawPlan = result.plan;
        const normalizedPlan: 'free' | 'premium' | 'admin' = rawPlan === 'premium' || rawPlan === 'admin'
          ? rawPlan
          : 'free';
        const isAdmin = normalizedPlan === 'admin' || username.trim().toLowerCase() === 'admin';
        const effectivePlan = isAdmin ? 'admin' : normalizedPlan;
        set({
          token: result.access_token,
          user: { username: result.username, plan: effectivePlan },
          isAuthenticated: true,
          isPremiumUser: effectivePlan === 'premium' || isAdmin,
          isAdmin
        });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isPremiumUser: false, isAdmin: false });
      },
    }),
    {
      name: 'ai-pod-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isPremiumUser: state.isPremiumUser,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
