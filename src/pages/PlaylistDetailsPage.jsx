import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getPlaylistItems, removePlaylistItems } from '../services/spotify/playlistItems';
import { getPlaylist } from '../services/spotify/playlistDetails';
import { invalidateSpotifyCacheForPlaylist } from '../services/spotify/spotifyRateLimiter';
import { editPlaylist } from '../services/playlistEditService';
import { toPlaylistUri } from '../services/spotifyPlayerService';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { formatDuration } from '../utils/formatDuration';
import {
  TrackItemCard,
  Spinner,
  PlaylistTrackIndexCell,
  PlaylistTrackDurationCell,
} from '../components';

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
    id: track.id ?? `${entry.added_at}-${title}`,
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

const SWIPE_DELETE_WIDTH = 80;
const SWIPE_DELETE_THRESHOLD = 56;
const SWIPE_REVEAL_SNAP = 24;
const SWIPE_DIRECTION_LOCK_PX = 8;
const SWIPE_PLAY_CANCEL_PX = 10;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

/**
 * Linha de faixa com play por toque e swipe-to-delete no mobile;
 * desktop mantém hover nas células de índice e duração.
 */
function PlaylistTrackRow({
  item,
  onPlay,
  onRemove,
  playDisabled,
  removeDisabled,
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const swipeOffsetRef = useRef(0);
  const isHorizontalSwipeRef = useRef(null);
  const didSwipeRef = useRef(false);
  const isTouchActiveRef = useRef(false);

  const updateSwipeOffset = useCallback((value) => {
    swipeOffsetRef.current = value;
    setSwipeOffset(value);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!isMobileViewport()) return;

    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    didSwipeRef.current = false;
    isTouchActiveRef.current = true;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isMobileViewport() || !isTouchActiveRef.current) return;

    const touch = e.touches[0];
    const deltaX = touchStartXRef.current - touch.clientX;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      const absX = Math.abs(touch.clientX - touchStartXRef.current);
      const absY = Math.abs(deltaY);
      if (absX > SWIPE_DIRECTION_LOCK_PX || absY > SWIPE_DIRECTION_LOCK_PX) {
        isHorizontalSwipeRef.current = absX > absY;
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    if (deltaX > SWIPE_PLAY_CANCEL_PX) {
      didSwipeRef.current = true;
    }

    if (deltaX > 0) {
      updateSwipeOffset(Math.min(deltaX, SWIPE_DELETE_WIDTH));
    } else {
      updateSwipeOffset(0);
    }
  }, [updateSwipeOffset]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobileViewport()) return;

    isTouchActiveRef.current = false;
    setIsDragging(false);
    isHorizontalSwipeRef.current = null;

    const finalOffset = swipeOffsetRef.current;
    if (finalOffset >= SWIPE_DELETE_THRESHOLD) {
      didSwipeRef.current = true;
      updateSwipeOffset(0);
      onRemove?.();
      return;
    }

    if (finalOffset >= SWIPE_REVEAL_SNAP) {
      didSwipeRef.current = true;
      updateSwipeOffset(SWIPE_DELETE_WIDTH);
      return;
    }

    updateSwipeOffset(0);
  }, [onRemove, updateSwipeOffset]);

  const handleRowClick = useCallback(() => {
    if (!isMobileViewport()) return;

    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }

    if (swipeOffsetRef.current > 0) {
      updateSwipeOffset(0);
      return;
    }

    if (!playDisabled) {
      onPlay?.();
    }
  }, [onPlay, playDisabled, updateSwipeOffset]);

  const handleDeleteClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateSwipeOffset(0);
      onRemove?.();
    },
    [onRemove, updateSwipeOffset],
  );

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-red-600 md:hidden"
        aria-hidden={swipeOffset === 0}
      >
        <button
          type="button"
          disabled={removeDisabled}
          onClick={handleDeleteClick}
          className="flex h-full w-full items-center justify-center text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Remover ${item.title}`}
        >
          <span className="material-symbols-outlined text-2xl">delete</span>
        </button>
      </div>

      <div
        onClick={handleRowClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative touch-pan-y bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] md:touch-auto md:bg-transparent md:dark:bg-transparent ${
          isDragging ? '' : 'transition-transform duration-200 ease-out'
        } md:translate-x-0`}
        style={
          swipeOffset > 0 || isDragging
            ? { transform: `translateX(-${swipeOffset}px)` }
            : undefined
        }
      >
        <TrackItemCard
          leading={
            <>
              <span
                className="flex h-12 w-10 shrink-0 items-center justify-end pr-1 text-sm font-medium tabular-nums text-[var(--color-text-muted)] md:hidden"
                aria-hidden
              >
                {item.globalIndex + 1}
              </span>
              <div className="hidden md:block">
                <PlaylistTrackIndexCell
                  indexOneBased={item.globalIndex + 1}
                  onPlay={onPlay}
                  disabled={playDisabled}
                />
              </div>
            </>
          }
          trailing={
            <>
              <span className="shrink-0 text-sm text-[var(--color-text-muted)] md:hidden">
                {item.duration}
              </span>
              <div className="hidden md:block">
                <PlaylistTrackDurationCell
                  duration={item.duration}
                  trackLabel={item.title}
                  onRemove={onRemove}
                  disabled={removeDisabled}
                />
              </div>
            </>
          }
          image={item.image}
          title={item.title}
          subtitle={item.subtitle}
          duration={item.duration}
          explicit={item.explicit}
        />
      </div>
    </div>
  );
}

export default function PlaylistDetailsPage() {
  const { id: playlistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { playPlaylistUri, playFromPlaylistPosition: playFromPositionWithEnsure, busyAction } =
    useSpotifyPlayer();

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
  const [editPrompt, setEditPrompt] = useState('');
  const [isUpdatingPlaylist, setIsUpdatingPlaylist] = useState(false);
  const [editFeedback, setEditFeedback] = useState(null);
  const [removingTrackId, setRemovingTrackId] = useState(null);
  const [removeFeedback, setRemoveFeedback] = useState(null);
  const isPlaybackBusy = Boolean(busyAction);
  const loaderRef = useRef(null);
  /** Evita segunda página disparada 2x pelo IntersectionObserver antes de isLoadingTracks atualizar */
  const isLoadingMoreRef = useRef(false);
  const tracksOffsetRef = useRef(0);

  const playlistUri = useMemo(() => {
    try {
      return toPlaylistUri(playlistId);
    } catch {
      return null;
    }
  }, [playlistId]);

  const loadHeader = useCallback(
    async ({ forceRefresh = false, bypassCache = false, itemsTotal } = {}) => {
      if (!accessToken || !playlistId) return;
      if (state.playlistName && !forceRefresh) {
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
        const data = await getPlaylist(accessToken, playlistId, { bypassCache });
        const resolvedTotal = Math.max(data.total ?? 0, itemsTotal ?? 0);
        setHeader({
          playlistName: data.name,
          image: data.image,
          total: resolvedTotal,
          ownerName: data.ownerName,
        });
      } catch (err) {
        setError(err?.message ?? 'Não foi possível carregar a playlist.');
      } finally {
        setIsLoadingHeader(false);
      }
    },
    [accessToken, playlistId, state.playlistName, state.image, state.total, state.ownerName],
  );

  const loadPlaylist = useCallback(
    async ({ forceRefreshHeader = false, bypassCache = false } = {}) => {
      if (!accessToken || !playlistId) return;
      setError(null);
      setTracks([]);
      setOffset(0);
      tracksOffsetRef.current = 0;
      isLoadingMoreRef.current = false;
      setHasMore(true);
      setIsLoadingTracks(true);
      try {
        const data = await getPlaylistItems(accessToken, playlistId, TRACKS_PER_PAGE, 0, {
          bypassCache,
        });
        const rawItems = data.items ?? [];
        const itemsTotal = data.total ?? rawItems.length;
        tracksOffsetRef.current = rawItems.length;
        setTracks(rawItems);
        setOffset(rawItems.length);
        setHasMore(rawItems.length < itemsTotal);
        await loadHeader({
          forceRefresh: forceRefreshHeader,
          bypassCache,
          itemsTotal,
        });
        setHeader((prev) => ({
          ...prev,
          total: Math.max(prev.total ?? 0, itemsTotal),
        }));
      } catch (err) {
        setError(err?.message ?? 'Não foi possível carregar as faixas.');
      } finally {
        setIsLoadingTracks(false);
      }
    },
    [accessToken, playlistId, loadHeader],
  );

  const loadMoreTracks = useCallback(async () => {
    if (
      !accessToken ||
      !playlistId ||
      isLoadingTracks ||
      !hasMore ||
      isLoadingMoreRef.current
    ) {
      return;
    }
    isLoadingMoreRef.current = true;
    setIsLoadingTracks(true);
    setError(null);
    try {
      const currentOffset = tracksOffsetRef.current;
      const data = await getPlaylistItems(
        accessToken,
        playlistId,
        TRACKS_PER_PAGE,
        currentOffset,
        { bypassCache: false },
      );
      const rawItems = data.items ?? [];
      const itemsTotal = data.total ?? currentOffset + rawItems.length;
      tracksOffsetRef.current = currentOffset + rawItems.length;
      setTracks((prev) => {
        const seen = new Set(
          prev.map((entry) => (entry?.item ?? entry?.track)?.id).filter(Boolean),
        );
        const uniqueNew = rawItems.filter((entry) => {
          const id = (entry?.item ?? entry?.track)?.id;
          return id ? !seen.has(id) : true;
        });
        return [...prev, ...uniqueNew];
      });
      setOffset(tracksOffsetRef.current);
      setHasMore(tracksOffsetRef.current < itemsTotal);
    } catch (err) {
      setError(err?.message ?? 'Não foi possível carregar as faixas.');
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingTracks(false);
    }
  }, [accessToken, playlistId, isLoadingTracks, hasMore]);

  useEffect(() => {
    if (!playlistId) {
      navigate('/', { replace: true });
      return;
    }
    if (!accessToken) return;

    const fromCreate = Boolean(location.state?.fromCreate);
    if (fromCreate) {
      invalidateSpotifyCacheForPlaylist(playlistId);
    }

    void loadPlaylist({ forceRefreshHeader: fromCreate, bypassCache: fromCreate });
  }, [playlistId, accessToken, loadPlaylist, navigate, location.state?.fromCreate]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el || isLoadingTracks || !hasMore || tracks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreTracks();
      },
      { root: null, rootMargin: '120px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreTracks, isLoadingTracks, hasMore, tracks.length]);

  const retry = useCallback(() => {
    setError(null);
    loadPlaylist();
  }, [loadPlaylist]);

  const handleEditPlaylist = useCallback(async () => {
    const trimmedPrompt = editPrompt.trim();
    if (!trimmedPrompt || !playlistId || !accessToken || isUpdatingPlaylist) return;

    setEditFeedback(null);
    setIsUpdatingPlaylist(true);

    try {
      await editPlaylist(trimmedPrompt, playlistId, accessToken);
      setEditPrompt('');
      setEditFeedback({
        type: 'success',
        message: 'Playlist atualizada com sucesso!',
      });
      invalidateSpotifyCacheForPlaylist(playlistId);
      await loadPlaylist({ forceRefreshHeader: true, bypassCache: true });
    } catch (err) {
      console.error(err);
      setEditFeedback({
        type: 'error',
        message: 'Erro ao atualizar playlist. Tente novamente.',
      });
    } finally {
      setIsUpdatingPlaylist(false);
    }
  }, [editPrompt, playlistId, accessToken, isUpdatingPlaylist, loadPlaylist]);

  const handlePlayPlaylist = useCallback(() => {
    if (!playlistUri) return;
    void playPlaylistUri(playlistUri);
  }, [playlistUri, playPlaylistUri]);

  const handlePlayFromPosition = useCallback(
    (positionZeroBased) => {
      if (!playlistUri) return;
      void playFromPositionWithEnsure(playlistUri, positionZeroBased);
    },
    [playlistUri, playFromPositionWithEnsure],
  );

  const handleRemoveTrack = useCallback(
    async (trackId) => {
      if (!accessToken || !playlistId || !trackId || removingTrackId) return;

      const entry = tracks.find((e) => (e?.item ?? e?.track)?.id === trackId);
      if (!entry) return;

      const track = entry?.item ?? entry?.track;
      const trackUri =
        track?.uri ??
        (track?.id ? `spotify:track:${track.id}` : `spotify:track:${trackId}`);
      if (!trackUri) return;

      const previousTracks = tracks;
      const previousTotal = header.total;
      const previousOffset = tracksOffsetRef.current;

      setRemovingTrackId(trackId);
      setRemoveFeedback(null);

      setTracks((prev) => prev.filter((e) => (e?.item ?? e?.track)?.id !== trackId));
      tracksOffsetRef.current = Math.max(0, tracksOffsetRef.current - 1);
      setHeader((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total ?? 1) - 1),
      }));

      try {
        await removePlaylistItems(accessToken, playlistId, [trackUri]);
        invalidateSpotifyCacheForPlaylist(playlistId);
      } catch (err) {
        setTracks(previousTracks);
        tracksOffsetRef.current = previousOffset;
        setHeader((prev) => ({ ...prev, total: previousTotal }));
        const isPermissionError =
          err?.message?.includes('403') ||
          err?.message?.toLowerCase().includes('forbidden');
        setRemoveFeedback({
          type: 'error',
          message: isPermissionError
            ? 'Não foi possível remover a faixa. O token pode não ter permissão — verifique os escopos playlist-modify-public e playlist-modify-private.'
            : 'Não foi possível remover a faixa. Tente novamente.',
        });
      } finally {
        setRemovingTrackId(null);
      }
    },
    [accessToken, playlistId, tracks, header.total, removingTrackId],
  );

  if (!playlistId) return null;

  const totalLabel =
    header.total === 1 ? '1 música' : `${header.total} músicas`;

  const normalizedTracks = tracks
    .map((entry, globalIndex) => {
      const normalized = normalizeTrackItem(entry);
      if (!normalized) return null;
      return { ...normalized, globalIndex };
    })
    .filter(Boolean);
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
        {!error && normalizedTracks.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handlePlayPlaylist}
              disabled={isPlaybackBusy || !accessToken}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Reproduzir playlist"
            >
              <span className="material-symbols-outlined text-4xl filled">play_arrow</span>
            </button>
          </div>
        )}

        {!error && (
          <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Refinar playlist com base em um prompt..."
                disabled={isUpdatingPlaylist}
                className="h-12 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--color-border-dark)]"
              />
              <button
                type="button"
                onClick={handleEditPlaylist}
                disabled={!editPrompt.trim() || isUpdatingPlaylist}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                aria-busy={isUpdatingPlaylist}
              >
                {isUpdatingPlaylist ? (
                  <>
                    <span
                      className="material-symbols-outlined animate-spin text-xl"
                      aria-hidden
                    >
                      progress_activity
                    </span>
                    Adicionando músicas...
                  </>
                ) : (
                  'Atualizar Playlist'
                )}
              </button>
            </div>
            {editFeedback?.message && (
              <p
                className={`mt-3 text-sm ${
                  editFeedback.type === 'error'
                    ? 'text-red-500'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {editFeedback.message}
              </p>
            )}
          </div>
        )}

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
          <>
            {removeFeedback?.message && (
              <p
                role="alert"
                className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                  removeFeedback.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] dark:border-[var(--color-border-dark)]'
                }`}
              >
                {removeFeedback.message}
              </p>
            )}
            <ul className="space-y-1" aria-label="Faixas da playlist">
            {normalizedTracks.map((item) => (
              <li key={`${item.id}-${item.globalIndex}`}>
                <PlaylistTrackRow
                  item={item}
                  onPlay={() => handlePlayFromPosition(item.globalIndex)}
                  onRemove={() => handleRemoveTrack(item.id)}
                  playDisabled={isPlaybackBusy || !accessToken}
                  removeDisabled={!accessToken || removingTrackId === item.id}
                />
              </li>
            ))}
            </ul>
          </>
        )}

        {/* Load more: Intersection Observer dispara loadMoreTracks */}
        {!error && normalizedTracks.length > 0 && hasMore && !isInitialLoad && (
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
