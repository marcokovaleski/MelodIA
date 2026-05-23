import { editPlaylistViaN8n } from './n8n';

/**
 * Chama o webhook n8n de edição de playlist (mesma base URL que criar playlist).
 */
export async function editPlaylist(prompt, playlistId, spotifyToken) {
  return editPlaylistViaN8n(prompt, playlistId, spotifyToken);
}
