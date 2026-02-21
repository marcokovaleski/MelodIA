/**
 * Função global de logout.
 * Limpa tokens, estado de autenticação e redireciona para a tela de Login.
 * Deve ser chamada ao clicar em "Sair" (Navbar/Sidebar) ou por AuthContext.logout().
 */
import { clearSpotifySession } from './spotifyPKCE';
import { useAuthStore } from '../store/authStore';

export function handleLogout() {
  clearSpotifySession();
  useAuthStore.getState().logout();
  window.location.href = '/login';
}
