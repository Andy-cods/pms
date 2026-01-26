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
    tokens,
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

  // Initialize auth state on mount
  useEffect(() => {
    if (hasCheckedAuth) return;

    const initAuth = async () => {
      setHasCheckedAuth(true);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      // If user is already hydrated from storage, avoid extra API calls
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authApi.getProfile();
        if (profile?.user) {
          setUser(profile.user);
        }
      } catch (err) {
        storeLogout();
        return;
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [hasCheckedAuth, setHasCheckedAuth, setLoading, setUser, storeLogout, user]);

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
    tokens,
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
      setAuth(data.user, data.tokens);
      router.push('/dashboard');
    },
  });
}

export function useClientLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ClientLoginPayload) => authApi.clientLogin(payload),
    onSuccess: (data: ClientAuthResponse) => {
      // Store client tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('clientId', data.client.id);
        localStorage.setItem('clientName', data.client.companyName);
      }
      router.push('/client/dashboard');
    },
  });
}

export function useRefreshToken() {
  const { setTokens, logout } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      return authApi.refreshToken({ refreshToken });
    },
    onSuccess: (data) => {
      setTokens(data);
    },
    onError: () => {
      logout();
    },
  });
}
