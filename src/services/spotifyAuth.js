/**
 * Spotify OAuth - Estrutura inicial para integração futura.
 * Não implementado: apenas contratos e stubs para expansão.
 */

const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Gera URL de autorização Spotify (OAuth 2.0).
 * @param {string} clientId - Client ID do app (variável de ambiente)
 * @param {string} redirectUri - URI de callback
 * @param {string[]} scopes - Escopos (e.g. playlist-modify-public, user-read-email)
 * @returns {string} URL para redirecionar o usuário
 */
export function getSpotifyAuthUrl(clientId, redirectUri, scopes = []) {
  const scope = scopes.length ? scopes.join(' ') : 'playlist-modify-public playlist-read-private user-read-email user-read-private';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope,
    show_dialog: 'true',
  });
  return `${SPOTIFY_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Troca code por access_token (backend ou cliente com client_secret).
 * Stub: implementar no backend por segurança.
 * @param {string} code - Código retornado no redirect
 * @param {string} redirectUri - Mesmo usado em getSpotifyAuthUrl
 */
export async function exchangeCodeForToken(code, redirectUri) {
  // TODO: chamar backend que usa client_secret e retorna { access_token, refresh_token, expires_in }
  return { access_token: null, refresh_token: null, expires_in: 0 };
}

/**
 * Refresh do access token usando refresh_token.
 * Stub: implementar no backend.
 */
export async function refreshAccessToken(refreshToken) {
  return { access_token: null, expires_in: 0 };
}

/**
 * Verifica se há token válido (ex.: em memória ou storage).
 * Stub para uso futuro com Context.
 */
export function hasValidSpotifyToken() {
  return false;
}

export { SPOTIFY_AUTH_BASE, SPOTIFY_API_BASE };
