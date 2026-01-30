'use client';

import { useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi, type LoginPayload, type ClientLoginPayload } from '@/lib/api/auth';
import type { AuthResponse, ClientAuthResponse } from '@/types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasCheckedAuth,
    setAuth,
    setUser,
    setLoading,
    setHasCheckedAuth,
    logout: storeLogout,
  } = useAuthStore();
  const router = useRouter();

  // Initialize auth state on mount - verify via API, not localStorage
  useEffect(() => {
    if (hasCheckedAuth) return;

    const initAuth = async () => {
      setHasCheckedAuth(true);

      // If user is already hydrated from sessionStorage, verify with API
      if (user) {
        try {
          const profile = await authApi.getProfile();
          if (profile?.user) {
            setUser(profile.user);
          }
        } catch {
          storeLogout();
        } finally {
          setLoading(false);
        }
        return;
      }

      // Try to verify auth via httpOnly cookie (sent automatically)
      try {
        const profile = await authApi.getProfile();
        if (profile?.user) {
          setAuth(profile.user);
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };

    initAuth();
  }, [hasCheckedAuth, setHasCheckedAuth, setLoading, setAuth, setUser, storeLogout, user]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      storeLogout();
      router.push('/login');
    }
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data: AuthResponse) => {
      // Tokens are set as httpOnly cookies by the backend
      setAuth(data.user);
      router.push('/dashboard');
    },
  });
}

export function useClientLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ClientLoginPayload) => authApi.clientLogin(payload),
    onSuccess: (data: ClientAuthResponse) => {
      // Tokens are set as httpOnly cookies by the backend
      // Store client display info in sessionStorage (non-sensitive)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('clientId', data.client.id);
        sessionStorage.setItem('clientName', data.client.companyName);
      }
      router.push('/client/dashboard');
    },
  });
}

export function useRefreshToken() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      // Refresh token is sent via httpOnly cookie automatically
      return authApi.refreshToken({});
    },
    onError: () => {
      logout();
    },
  });
}
