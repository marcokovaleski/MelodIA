/**
 * Tipos de referência para itens de playlist do Spotify (JSDoc).
 * Use estes tipos em @param e @returns com JSDoc.
 *
 * @typedef {{ url: string; height: number | null; width: number | null }} SpotifyImage
 *
 * @typedef {{
 *   id: string;
 *   name: string;
 *   album: { images: SpotifyImage[]; name: string };
 *   artists: { id: string; name: string }[];
 *   duration_ms: number;
 *   explicit: boolean;
 *   preview_url: string | null;
 * }} SpotifyTrack
 *
 * @typedef {{
 *   id: string;
 *   name: string;
 *   images: SpotifyImage[];
 *   description: string;
 *   duration_ms: number;
 *   explicit: boolean;
 * }} SpotifyEpisode
 *
 * @typedef {{
 *   added_at: string | null;
 *   is_local: boolean;
 *   track: SpotifyTrack | SpotifyEpisode | null;
 * }} SpotifyPlaylistTrackItem
 *
 * @typedef {{
 *   items: SpotifyPlaylistTrackItem[];
 *   total: number;
 *   limit: number;
 *   offset: number;
 *   next: string | null;
 * }} PlaylistItemsResponse
 */

export {};
