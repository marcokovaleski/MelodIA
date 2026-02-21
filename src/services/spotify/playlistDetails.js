/**
 * Serviço para dados de uma playlist (capa, nome, owner, total).
 * GET /v1/playlists/{playlist_id}
 * Usado quando a página é aberta por URL sem state (ex.: favorito ou compartilhado).
 */

import { rateLimitedFetch } from './spotifyRateLimiter';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Busca os dados da playlist (nome, capa, owner, total de faixas).
 *
 * @param {string} token - Access token (Bearer)
 * @param {string} playlistId - ID da playlist
 * @returns {Promise<{ id: string; name: string; image: string | null; total: number; ownerName: string }>}
 */
export async function getPlaylist(token, playlistId) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token de autenticação é obrigatório');
  }
  if (!playlistId || typeof playlistId !== 'string') {
    throw new Error('ID da playlist é obrigatório');
  }

  const url = `${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}`;
  const response = await rateLimitedFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Playlist: ${response.status} ${text || response.statusText}`);
  }

  const data = await response.json();
  const image =
    Array.isArray(data.images) && data.images.length > 0
      ? data.images[0]?.url ?? null
      : null;
  const total = data.tracks?.total ?? 0;
  const ownerName = data.owner?.display_name ?? '';

  return {
    id: data.id,
    name: data.name ?? 'Playlist',
    image,
    total,
    ownerName,
  };
}
