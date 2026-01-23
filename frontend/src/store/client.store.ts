import { create } from 'zustand';

interface ClientInfo {
  id: string;
  companyName: string;
  contactName: string | null;
}

interface ClientState {
  client: ClientInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setClient: (client: ClientInfo | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useClientStore = create<ClientState>((set) => ({
  client: null,
  isAuthenticated: false,
  isLoading: true,

  setClient: (client) =>
    set({
      client,
      isAuthenticated: !!client,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('clientId');
      localStorage.removeItem('clientName');
    }
    set({
      client: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
