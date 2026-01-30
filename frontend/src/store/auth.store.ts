import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean;

  // Actions
  setAuth: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  setHasCheckedAuth: (checked: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasCheckedAuth: false,

      setAuth: (user) => {
        // Tokens are managed via httpOnly cookies only - no localStorage
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true,
        });
      },

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setHasCheckedAuth: (checked) => set({ hasCheckedAuth: checked }),

      logout: () => {
        // Cookies are cleared by the backend on logout
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasCheckedAuth: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
