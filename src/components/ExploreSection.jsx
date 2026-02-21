import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { rateLimitedFetch } from '../services/spotify/spotifyRateLimiter';
import PromptCard from './PromptCard';

const EXAMPLE_PROMPTS = [
  'Uma playlist para relaxar no fim de tarde, com Lofi e Bossa Nova.',
  'Crie uma trilha sonora épica para uma sessão de jogos de RPG.',
  'Músicas pop dos anos 2000 para uma festa animada.',
];

const SPOTIFY_TOP_ARTISTS_URL =
  'https://api.spotify.com/v1/me/top/artists?limit=5';
const SPOTIFY_TOP_TRACKS_URL =
  'https://api.spotify.com/v1/me/top/tracks?limit=5';

/**
 * Retorna a URL da imagem de maior resolução (primeiro item do array images do Spotify).
 */
function getBestImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images[0]?.url ?? null;
}

export default function ExploreSection({ onPromptClick }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);

  async function fetchTopArtists() {
    const token = accessToken || useAuthStore.getState().accessToken;
    if (!token) return;
    setLoadingArtists(true);
    try {
      const res = await rateLimitedFetch(SPOTIFY_TOP_ARTISTS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Top artists: ${res.status}`);
      const data = await res.json();
      setTopArtists((data.items || []).slice(0, 5));
    } catch (err) {
      console.error('fetchTopArtists', err);
    } finally {
      setLoadingArtists(false);
    }
  }

  async function fetchTopTracks() {
    const token = accessToken || useAuthStore.getState().accessToken;
    if (!token) return;
    setLoadingTracks(true);
    try {
      const res = await rateLimitedFetch(SPOTIFY_TOP_TRACKS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Top tracks: ${res.status}`);
      const data = await res.json();
      setTopTracks((data.items || []).slice(0, 5));
    } catch (err) {
      console.error('fetchTopTracks', err);
    } finally {
      setLoadingTracks(false);
    }
  }

  useEffect(() => {
    fetchTopArtists();
    fetchTopTracks();
  }, []);

  return (
    <div className="w-full">
      <h2 className="mb-10 text-center text-3xl font-bold tracking-tighter text-[var(--color-pure-white)] sm:text-4xl md:text-5xl">
        Explore o MelodIA
      </h2>

      <div className="mb-12" aria-labelledby="prompts-heading">
        <h3
          id="prompts-heading"
          className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
        >
          Prompts de Exemplo
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_PROMPTS.map((text, i) => (
            <PromptCard key={i} text={text} onClick={onPromptClick} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div aria-labelledby="artists-heading">
          <h3
            id="artists-heading"
            className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
          >
            Top 5 Artistas
          </h3>
          <ul className="space-y-0 rounded-lg border border-white/20 bg-white/10 p-2 divide-y divide-white/10">
            {loadingArtists && (
              <li className="flex items-center justify-center p-6">
                <div className="auth-spinner" aria-hidden="true" />
              </li>
            )}
            {!loadingArtists &&
              topArtists.map((artist) => {
                const imgUrl = getBestImageUrl(artist.images);
                return (
                  <li key={artist.id} className="flex items-center gap-4 p-3">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={artist.name}
                        className="h-12 w-12 rounded-full object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-white/20" />
                    )}
                    <span className="text-lg font-medium text-[var(--color-pure-white)]">
                      {artist.name}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div aria-labelledby="tracks-heading">
          <h3
            id="tracks-heading"
            className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
          >
            Top 5 Músicas Mais Ouvidas
          </h3>
          <ul className="space-y-0 rounded-lg border border-white/20 bg-white/10 p-2 divide-y divide-white/10">
            {loadingTracks && (
              <li className="flex items-center justify-center p-6">
                <div className="auth-spinner" aria-hidden="true" />
              </li>
            )}
            {!loadingTracks &&
              topTracks.map((track) => {
                const coverUrl = track.album?.images?.[0]?.url ?? null;
                const artistNames = track.artists?.map((a) => a.name).join(', ') ?? '';
                return (
                  <li key={track.id} className="flex items-center gap-4 p-3">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={track.name}
                        className="h-12 w-12 rounded-md object-cover"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-white/20" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-white">
                        {track.name}
                      </span>
                      <span className="text-sm text-white">{artistNames}</span>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
}
