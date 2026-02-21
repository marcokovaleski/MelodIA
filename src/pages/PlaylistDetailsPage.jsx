import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPlaylistItems } from '../services/spotify/playlistItems';
import { getPlaylist } from '../services/spotify/playlistDetails';
import { formatDuration } from '../utils/formatDuration';
import { TrackItemCard, Spinner } from '../components';

const TRACKS_PER_PAGE = 10;

/**
 * Extrai dados para exibição a partir de um item da API.
 * API pode retornar items[x].item ou items[x].track (Spotify oficial).
 * Prioriza .item conforme resposta real do usuário.
 */
function normalizeTrackItem(entry) {
  const track = entry?.item ?? entry?.track;
  if (!track) return null;

  const isEpisode = track.type === 'episode';
  let image = null;
  let title = track.name ?? 'Sem nome';
  let subtitle = '';
  const durationMs = track.duration_ms ?? 0;
  const explicit = Boolean(track.explicit);

  if (isEpisode) {
    image = Array.isArray(track.images) && track.images.length > 0 ? track.images[0]?.url ?? null : null;
    subtitle = track.description ?? 'Episódio';
  } else {
    const images = track.album?.images;
    image = images && images.length > 0 ? (images[2]?.url ?? images[0]?.url) ?? null : null;
    const artists = track.artists ?? [];
    subtitle = artists.map((a) => a?.name).filter(Boolean).join(', ') || 'Artista';
  }

  return {
    id: track.id ?? entry.added_at + title,
    image,
    title,
    subtitle,
    duration: formatDuration(durationMs),
    explicit,
  };
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end">
      <div className="h-52 w-52 shrink-0 animate-pulse rounded-lg bg-[var(--color-border)] shadow-xl dark:bg-[var(--color-border-dark)] md:h-60 md:w-60" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
      </div>
    </div>
  );
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-2">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
      </div>
      <div className="h-4 w-10 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
    </div>
  );
}

export default function PlaylistDetailsPage() {
  const { id: playlistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);

  const state = location.state || {};
  const [header, setHeader] = useState({
    playlistName: state.playlistName ?? '',
    image: state.image ?? null,
    total: state.total ?? 0,
    ownerName: state.ownerName ?? '',
  });
  const [tracks, setTracks] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHeader, setIsLoadingHeader] = useState(!state.playlistName && !!playlistId);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [error, setError] = useState(null);
  const initialLoadDone = useRef(false);
  const loaderRef = useRef(null);

  const loadHeader = useCallback(async () => {
    if (!accessToken || !playlistId) return;
    if (state.playlistName) {
      setHeader({
        playlistName: state.playlistName,
        image: state.image ?? null,
        total: state.total ?? 0,
        ownerName: state.ownerName ?? '',
      });
      return;
    }
    setIsLoadingHeader(true);
    try {
      const data = await getPlaylist(accessToken, playlistId);
      setHeader({
        playlistName: data.name,
        image: data.image,
        total: data.total,
        ownerName: data.ownerName,
      });
    } catch (err) {
      setError(err?.message ?? 'Não foi possível carregar a playlist.');
    } finally {
      setIsLoadingHeader(false);
    }
  }, [accessToken, playlistId, state.playlistName, state.image, state.total, state.ownerName]);

  const loadMoreTracks = useCallback(async () => {
    if (!accessToken || !playlistId || isLoadingTracks || !hasMore) return;
    setIsLoadingTracks(true);
    setError(null);
    try {
      const currentOffset = offset;
      const data = await getPlaylistItems(
        accessToken,
        playlistId,
        TRACKS_PER_PAGE,
        currentOffset,
      );
      const rawItems = data.items ?? [];
      setTracks((prev) => [...prev, ...rawItems]);
      setOffset((prev) => prev + TRACKS_PER_PAGE);
      setHasMore(!!data.next);
    } catch (err) {
      setError(err?.message ?? 'Não foi possível carregar as faixas.');
    } finally {
      setIsLoadingTracks(false);
    }
  }, [accessToken, playlistId, offset, isLoadingTracks, hasMore]);

  useEffect(() => {
    if (!playlistId || !accessToken) return;
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadMoreTracks();
    }
  }, [playlistId, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps -- initial load once

  useEffect(() => {
    if (!playlistId) {
      navigate('/', { replace: true });
      return;
    }
    loadHeader();
  }, [playlistId, loadHeader, navigate]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreTracks();
      },
      { threshold: 1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreTracks]);

  const retry = useCallback(() => {
    setError(null);
    setTracks([]);
    setOffset(0);
    setHasMore(true);
    initialLoadDone.current = false;
    loadHeader();
    loadMoreTracks();
  }, [loadHeader, loadMoreTracks]);

  if (!playlistId) return null;

  const totalLabel =
    header.total === 1 ? '1 música' : `${header.total} músicas`;

  const normalizedTracks = tracks.map(normalizeTrackItem).filter(Boolean);
  const isInitialLoad = tracks.length === 0 && isLoadingTracks;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--color-primary-light)] to-[var(--color-surface)] pt-4 dark:to-[var(--color-surface-dark)]">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent dark:from-[var(--color-surface-dark)]" />
        <div className="relative px-4 pb-8 md:px-6">
          {isLoadingHeader ? (
            <HeaderSkeleton />
          ) : (
            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <div className="flex shrink-0 justify-center md:justify-start">
                {header.image ? (
                  <img
                    src={header.image}
                    alt=""
                    className="h-52 w-52 rounded-lg object-cover shadow-xl md:h-60 md:w-60"
                    width={240}
                    height={240}
                  />
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] shadow-xl md:h-60 md:w-60">
                    <span className="material-symbols-outlined text-8xl text-white/90">
                      queue_music
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 text-[var(--color-text-primary)]">
                <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Playlist
                </p>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                  {header.playlistName || 'Sem nome'}
                </h1>
                {header.ownerName && (
                  <p className="text-[var(--color-text-secondary)]">{header.ownerName}</p>
                )}
                <p className="text-sm text-[var(--color-text-subtle)]">{totalLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]">
            <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]">
              error_outline
            </span>
            <p className="text-[var(--color-text-primary)]">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 font-bold text-white hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Tentar novamente
            </button>
          </div>
        )}

        {!error && isInitialLoad && (
          <div className="space-y-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <TrackRowSkeleton key={i} />
            ))}
          </div>
        )}

        {!error && !isInitialLoad && normalizedTracks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]">
            <span className="material-symbols-outlined text-6xl text-[var(--color-text-muted)]">
              queue_music
            </span>
            <p className="text-[var(--color-text-primary)]">Nenhuma faixa nesta playlist.</p>
          </div>
        )}

        {!error && normalizedTracks.length > 0 && (
          <ul className="space-y-1" aria-label="Faixas da playlist">
            {normalizedTracks.map((item) => (
              <li key={item.id}>
                <TrackItemCard
                  image={item.image}
                  title={item.title}
                  subtitle={item.subtitle}
                  duration={item.duration}
                  explicit={item.explicit}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Load more: Intersection Observer dispara loadMoreTracks */}
        {!error && (normalizedTracks.length > 0 || isInitialLoad) && hasMore && (
          <div
            ref={loaderRef}
            className="flex justify-center py-6"
            aria-hidden
          >
            {isLoadingTracks && <Spinner />}
          </div>
        )}
      </div>
    </div>
  );
}
