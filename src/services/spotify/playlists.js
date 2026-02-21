/**
 * Serviço de playlists do Spotify (GET /v1/me/playlists).
 * Tipos esperados da API (para referência):
 *
 * @typedef {{ url: string; height: number | null; width: number | null }} SpotifyImage
 * @typedef {{ total: number }} TracksRef
 * @typedef {{ id: string; name: string; images: SpotifyImage[]; tracks: TracksRef }} SpotifyPlaylist
 * @typedef {{ items: SpotifyPlaylist[]; total: number; limit: number; offset: number; next: string | null }} PlaylistsResponse
 */

import { rateLimitedFetch } from './spotifyRateLimiter';

const SPOTIFY_PLAYLISTS_URL = 'https://api.spotify.com/v1/me/playlists';

/**
 * Busca as playlists do usuário logado.
 *
 * @param {string} token - Access token (Bearer)
 * @param {number} [limit=20] - Quantidade por página (suporte a paginação futura)
 * @param {number} [offset=0] - Offset para paginação
 * @returns {Promise<PlaylistsResponse>} Resposta com items, total, limit, offset, next
 * @throws {Error} Quando a API retorna erro (ex.: 401, 403)
 */
export async function getUserPlaylists(token, limit = 20, offset = 0) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token de autenticação é obrigatório');
  }

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const url = `${SPOTIFY_PLAYLISTS_URL}?${params.toString()}`;

  const response = await rateLimitedFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Playlists: ${response.status} ${text || response.statusText}`);
  }

  const data = await response.json();

  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    limit: data.limit ?? limit,
    offset: data.offset ?? offset,
    next: data.next ?? null,
  };
}

/** Durante os testes: 5 playlists por página (API: limit=5). */
const PLAYLISTS_PER_PAGE = 5;

/**
 * Busca playlists do usuário com paginação real (API Get Current User's Playlists).
 * - limit = 5, offset variável (0, 5, 10, 15, ...).
 * - Filtro local: apenas playlists cujo owner.id === currentUserId.
 * - Usa rateLimitedFetch (não fetch direto).
 *
 * @param {string} token - Access token (Bearer)
 * @param {string} currentUserId - ID do usuário logado (para filtrar owner)
 * @param {number} [offset=0] - Offset da página (0, 5, 10, 15, ...)
 * @returns {Promise<{ playlistsFiltradas: Array; total: number; limit: number; offset: number; hasNext: boolean; hasPrevious: boolean }>}
 */
export async function getUserPlaylistsPaginated(token, currentUserId, offset = 0) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token de autenticação é obrigatório');
  }

  const data = await getUserPlaylists(token, PLAYLISTS_PER_PAGE, offset);

  const rawItems = data.items ?? [];
  const playlistsFiltradas = currentUserId
    ? rawItems.filter((p) => p.owner?.id === currentUserId)
    : rawItems;

  const total = data.total ?? 0;
  const hasNext = !!data.next;
  const hasPrevious = offset > 0;

  return {
    playlistsFiltradas,
    total,
    limit: PLAYLISTS_PER_PAGE,
    offset,
    hasNext,
    hasPrevious,
  };
}
