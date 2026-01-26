import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, TokensDto } from '@/types';

interface AuthState {
  user: AuthUser | null;
  tokens: TokensDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean;

  // Actions
  setAuth: (user: AuthUser, tokens: TokensDto) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: TokensDto) => void;
  setLoading: (loading: boolean) => void;
  setHasCheckedAuth: (checked: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      hasCheckedAuth: false,

      setAuth: (user, tokens) => {
        // Store tokens in localStorage for API interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true,
        });
      },

      setUser: (user) => set({ user }),

      setTokens: (tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        set({ tokens });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setHasCheckedAuth: (checked) => set({ hasCheckedAuth: checked }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          hasCheckedAuth: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
