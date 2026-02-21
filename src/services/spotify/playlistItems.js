/**
 * Serviço de itens (faixas/episódios) de uma playlist do Spotify.
 * Endpoint: GET /v1/playlists/{playlist_id}/tracks
 *
 * Tipos: ver src/types/playlistItem.js (SpotifyPlaylistTrackItem, PlaylistItemsResponse)
 */

import { rateLimitedFetch } from './spotifyRateLimiter';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Busca os itens (tracks e episódios) de uma playlist.
 *
 * @param {string} token - Access token (Bearer)
 * @param {string} playlistId - ID da playlist no Spotify
 * @param {number} [limit=50] - Quantidade por página (máx. 100)
 * @param {number} [offset=0] - Offset para paginação
 * @returns {Promise<{ items: Array<{ added_at: string|null; is_local: boolean; track: object|null }>; total: number; limit: number; offset: number; next: string|null }>}
 */
export async function getPlaylistItems(token, playlistId, limit = 50, offset = 0) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token de autenticação é obrigatório');
  }
  if (!playlistId || typeof playlistId !== 'string') {
    throw new Error('ID da playlist é obrigatório');
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const url = `${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}/items?${params.toString()}`;

  const response = await rateLimitedFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Playlist items: ${response.status} ${text || response.statusText}`);
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
