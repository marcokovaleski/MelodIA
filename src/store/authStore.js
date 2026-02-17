import { create } from 'zustand';

/**
 * Store de auth em memória apenas — sem persistência.
 * Recarregar, fechar o app ou abrir em outra aba exige login novamente.
 */
export const useAuthStore = create((set) => ({
  accessToken: null,
  refreshToken: null,
  userProfile: null,

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  setProfile: (userProfile) => set({ userProfile }),

  login: () => set({}),

  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      userProfile: null,
    }),

  setAuth: (accessToken, refreshToken, userProfile) =>
    set({ accessToken, refreshToken, userProfile }),
}));

export const selectIsAuthenticated = (state) =>
  !!state.accessToken && !!state.userProfile;

export const selectUserAvatar = (state) =>
  state.userProfile?.avatar ?? null;
