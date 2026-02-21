/**
 * Spotify Authorization Code Flow + PKCE
 * Redirect URI: use 127.0.0.1 (não localhost) no desenvolvimento.
 *
 * Fluxo: Redirecionar → Receber code → Trocar por tokens (uma única vez) → Nunca reutilizar code.
 */

import { rateLimitedFetch } from '../services/spotify/spotifyRateLimiter';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const VERIFIER_KEY = 'spotify_code_verifier';
const STATE_KEY = 'spotify_auth_state';

// ---------------------------------------------------------------------------
// SCOPES – adicione ou remova conforme as permissões necessárias no app
// Documentação: https://developer.spotify.com/documentation/web-api/concepts/scopes
// ---------------------------------------------------------------------------
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-read',
];

/**
 * Configuração de autenticação (clientId e redirectUri podem vir do .env).
 * scopes é montado dinamicamente a partir de SPOTIFY_SCOPES.
 */

function getSpotifyAuthConfig() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  if (!clientId) {
    throw new Error("VITE_SPOTIFY_CLIENT_ID não está definido no arquivo .env");
  }

  const scopesString = SPOTIFY_SCOPES.join(' ');
  return {
    clientId,
    redirectUri: getRedirectUri(),
    scopes: scopesString,
  };
}

/**
 * Redirect URI: deve ser idêntico no Spotify Dashboard, na URL de authorize e no token.
 * SEM barra final. Em produção, use VITE_SPOTIFY_REDIRECT_URI no .env.
 */
export function getRedirectUri() {
  const fromEnv = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof window === 'undefined') return 'http://127.0.0.1:5173/callback';
  const port = window.location.port || '5173';
  return `http://127.0.0.1:${port}/callback`;
}

// ---------------------------------------------------------------------------
// PKCE: code_verifier e code_challenge
// ---------------------------------------------------------------------------

export function generateRandomString(length = 128) {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
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

// ---------------------------------------------------------------------------
// State (CSRF) – gerar ao iniciar login e validar no callback
// ---------------------------------------------------------------------------

function generateState() {
  return generateRandomString(32);
}

/**
 * Valida o state retornado na URL do callback e remove do armazenamento.
 * Retorna true se válido; false se ausente ou não confere.
 */
export function validateAndConsumeState(stateFromUrl) {
  if (!stateFromUrl || typeof stateFromUrl !== 'string') return false;
  const stored = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return stored !== null && stored === stateFromUrl;
}

// ---------------------------------------------------------------------------
// URL de autorização – montagem dinâmica com scopes e encoding correto
// ---------------------------------------------------------------------------

/**
 * Monta a URL estática para o login (sem code_challenge/state/verifier).
 * Usado apenas para referência; o login real usa buildAuthorizationUrl().
 */
export function getAuthorizationUrlParams() {
  const { clientId, redirectUri, scopes } = getSpotifyAuthConfig();
  return {
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
  };
}

/**
 * Constrói a URL completa de autorização com code_challenge e state.
 * Scopes são passados como string (ex: "scope1 scope2"); URLSearchParams faz o encoding (espaço → %20).
 */
function buildAuthorizationUrl(codeChallenge, state) {
  const { clientId, redirectUri, scopes } = getSpotifyAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Passo 1: Redirecionar para o Spotify (salvar verifier e state ANTES)
// ---------------------------------------------------------------------------

/**
 * Redireciona para o Spotify. Deve ser chamado uma vez por clique (LoginPage desabilita o botão).
 * Garante: verifier e state salvos antes do redirect; nunca reutilizar o mesmo code depois.
 */
export async function redirectToSpotifyLogin() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  localStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const url = buildAuthorizationUrl(challenge, state);
  window.location.href = url;
}

// ---------------------------------------------------------------------------
// Passo 2: Trocar code por tokens (usar code uma única vez; remover verifier só após sucesso)
// ---------------------------------------------------------------------------

/**
 * Troca o authorization code por access_token e refresh_token.
 * Requisitos: code, grant_type=authorization_code, redirect_uri, client_id, code_verifier.
 * O code só pode ser usado UMA vez; o verifier é removido somente após resposta 200.
 */
export async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Code verifier não encontrado');

  const { clientId, redirectUri } = getSpotifyAuthConfig();
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

// ---------------------------------------------------------------------------
// Perfil do usuário
// ---------------------------------------------------------------------------

export async function getProfile(accessToken) {
  const response = await rateLimitedFetch(`${SPOTIFY_API_BASE}/me`, {
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

/**
 * Remove todos os dados de sessão Spotify do storage (localStorage e sessionStorage).
 * Deve ser chamado no logout para garantir que não reste verifier/state.
 */
export function clearSpotifySession() {
  try {
    localStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
  } catch (_) {
    // ignore
  }
}

// Export para uso em .env / documentação (scopes como array)
export { SPOTIFY_SCOPES };
