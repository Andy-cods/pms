import { api } from './index';
import type { AuthResponse, ClientAuthResponse, TokensDto } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ClientLoginPayload {
  accessCode: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  clientLogin: async (payload: ClientLoginPayload): Promise<ClientAuthResponse> => {
    const { data } = await api.post<ClientAuthResponse>('/auth/client-login', payload);
    return data;
  },

  refreshToken: async (payload: RefreshTokenPayload): Promise<TokensDto> => {
    const { data } = await api.post<TokensDto>('/auth/refresh', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export default authApi;
