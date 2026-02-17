/**
 * Spotify Authorization Code Flow + PKCE
 * Redirect URI obrigatório: 127.0.0.1 (não localhost)
 */

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const VERIFIER_KEY = 'spotify_code_verifier';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '5a6e13e0438346fe8974c2bb4ec3f564';
const scopes = 'user-read-private user-read-email';

/**
 * Redirect URI: loopback 127.0.0.1 (Spotify não aceita localhost).
 * SEM barra final. Deve ser idêntico no Dashboard, no /authorize e no /api/token.
 */
export function getRedirectUri() {
  if (typeof window === 'undefined') return 'http://127.0.0.1:5173/callback';
  const port = window.location.port || '5173';
  return `http://127.0.0.1:${port}/callback`;
}

export function generateRandomString(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Redireciona para o fluxo de autorização do Spotify (Passo 1).
 * O code_verifier é salvo no localStorage ANTES do redirect (uma única vez por clique).
 */
export async function redirectToSpotifyLogin() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem(VERIFIER_KEY, verifier);

  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Troca o código de autorização por access_token e refresh_token (Passo 2).
 * O code só pode ser usado UMA vez. O verifier é removido SOMENTE após sucesso.
 */
export async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Code verifier não encontrado');

  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await response.json();

  localStorage.removeItem(VERIFIER_KEY);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? 3600,
  };
}

/**
 * Busca o perfil do usuário (/me).
 */
export async function getProfile(accessToken) {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error('Falha ao buscar perfil');

  const data = await response.json();
  return {
    id: data.id,
    display_name: data.display_name ?? '',
    email: data.email ?? '',
    avatar: data.images?.[0]?.url ?? null,
  };
}
