import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserPlaylistsPaginated } from '../services/spotify/playlists';
import { Tabs, PlaylistCard, Spinner } from '../components';

/**
 * Botão de play para item da lista: no desktop só no hover (.playlist-play-button),
 * no mobile sempre visível (CSS @media max-width 768px).
 * Estilo: verde #1db954, ícone branco, 40px desktop / 36px mobile.
 */
function PlaylistListPlayButton({ onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="playlist-play-button focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-dark)] hover:scale-105"
    >
      <span className="material-symbols-outlined text-3xl">play_arrow</span>
    </button>
  );
}

/**
 * Container do item de playlist no modo lista: hover com destaque e botão play à esquerda.
 */
function PlaylistListItemContainer({ children, playButton }) {
  return (
    <div className="playlist-row group flex items-center gap-4 rounded-lg p-3">
      {playButton}
      {children}
    </div>
  );
}

const TAB_ITEMS = [
  { to: '', label: 'Playlists' },
  { to: 'artistas', label: 'Artistas' },
  { to: 'albums', label: 'Álbuns' },
  { to: 'podcasts', label: 'Podcasts e Shows' },
];

const PLAYLISTS_PER_PAGE = 5;

/**
 * Retorna a URL da imagem de maior resolução (primeiro item do array images do Spotify).
 */
function getPlaylistImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  return first?.url ?? null;
}

/**
 * Skeleton animado para um card de playlist no loading.
 */
function PlaylistCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="aspect-square w-full animate-pulse rounded-lg bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
    </div>
  );
}

export default function BibliotecaPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.userProfile?.id) ?? null;

  const [playlists, setPlaylists] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const loaderRef = useRef(null);

  const loadInitialPlaylists = useCallback(async () => {
    if (!accessToken) {
      setPlaylists([]);
      setOffset(0);
      setHasMore(false);
      setIsLoadingPlaylists(false);
      setError(null);
      return;
    }

    setPlaylists([]);
    setOffset(0);
    setHasMore(true);
    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const data = await getUserPlaylistsPaginated(accessToken, currentUserId, 0);
      setPlaylists(data.playlistsFiltradas ?? []);
      setOffset(PLAYLISTS_PER_PAGE);
      setHasMore(data.hasNext);
    } catch (err) {
      setError(err?.message ?? 'Não foi possível carregar as playlists.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [accessToken, currentUserId]);

  const loadMorePlaylists = useCallback(async () => {
    if (!accessToken || isLoadingPlaylists || !hasMore) return;

    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const currentOffset = offset;
      const data = await getUserPlaylistsPaginated(
        accessToken,
        currentUserId,
        currentOffset,
      );
      setPlaylists((prev) => [...prev, ...(data.playlistsFiltradas ?? [])]);
      setOffset((prev) => prev + PLAYLISTS_PER_PAGE);
      setHasMore(data.hasNext);
    } catch (err) {
      setError(err?.message ?? 'Não foi possível carregar as playlists.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, [accessToken, currentUserId, offset, isLoadingPlaylists, hasMore]);

  useEffect(() => {
    loadInitialPlaylists();
  }, [loadInitialPlaylists]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMorePlaylists();
      },
      { threshold: 1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMorePlaylists]);

  const isInitialLoad = playlists.length === 0 && isLoadingPlaylists;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black leading-tight tracking-tighter text-[var(--color-text-primary)] md:text-4xl">
            Sua Biblioteca
          </h1>
          <p className="text-base font-normal leading-normal text-[var(--color-text-subtle)]">
            Todas as suas playlists em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] p-1 dark:bg-[var(--color-surface-dark)]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Visualização em grade"
            aria-pressed={viewMode === 'grid'}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${viewMode === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            aria-label="Visualização em lista"
            aria-pressed={viewMode === 'list'}
          >
            <span className="material-symbols-outlined">list</span>
          </button>
        </div>
      </header>

      <Tabs items={TAB_ITEMS} basePath="/biblioteca" />

      {/* Loading inicial: skeleton dos cards */}
      {isInitialLoad && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Erro: mensagem + botão tentar novamente */}
      {!isInitialLoad && error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]">
          <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]">
            error_outline
          </span>
          <p className="text-[var(--color-text-primary)]">{error}</p>
          <button
            type="button"
            onClick={() => void loadInitialPlaylists()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Lista de playlists (imagem maior = images[0], nome, total de músicas) */}
      {!error && playlists.length > 0 && (
        <div className="min-h-0 flex-1">
          <div
            className={
              viewMode === 'list'
                ? 'flex flex-col gap-3'
                : 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6'
            }
          >
              {playlists.map((playlist) => {
                const imageUrl = getPlaylistImageUrl(playlist.images);
                const totalTracks = playlist?.items?.total ?? 0;
                const subtitle =
                  totalTracks === 1
                    ? '1 música'
                    : `${totalTracks} músicas`;

                const playlistState = {
                  playlistName: playlist.name ?? 'Sem nome',
                  image: imageUrl,
                  total: totalTracks,
                  ownerName: playlist.owner?.display_name ?? '',
                };

                if (viewMode === 'list') {
                  return (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      state={playlistState}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg"
                    >
                      <PlaylistListItemContainer
                        playButton={
                          <PlaylistListPlayButton
                            ariaLabel={`Reproduzir ${playlist.name ?? 'Playlist'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Futuro: disparar reprodução da playlist
                            }}
                          />
                        }
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-md object-cover"
                            width={56}
                            height={56}
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] text-white">
                            <span className="material-symbols-outlined text-2xl">
                              queue_music
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-[var(--color-text-primary)]">
                            {playlist.name ?? 'Sem nome'}
                          </p>
                          <p className="truncate text-sm text-[var(--color-text-subtle)]">
                            {subtitle}
                          </p>
                        </div>
                      </PlaylistListItemContainer>
                    </Link>
                  );
                }

                return (
                  <PlaylistCard
                    key={playlist.id}
                    id={playlist.id}
                    title={playlist.name ?? 'Sem nome'}
                    subtitle={subtitle}
                    coverUrl={imageUrl}
                    to={`/playlist/${playlist.id}`}
                    state={playlistState}
                  />
                );
              })}
          </div>
        </div>
      )}

      {!error && !isInitialLoad && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]">
          <span className="material-symbols-outlined text-6xl text-[var(--color-text-muted)]">
            queue_music
          </span>
          <p className="text-[var(--color-text-primary)]">
            Nenhuma playlist encontrada.
          </p>
          <p className="text-sm text-[var(--color-text-subtle)]">
            Crie playlists no Spotify ou no MelodIA para vê-las aqui.
          </p>
        </div>
      )}

      {/* Infinite scroll: sentinel + indicador (mesmo padrão que PlaylistDetailsPage) */}
      {!error && (playlists.length > 0 || isInitialLoad) && hasMore && (
        <div
          ref={loaderRef}
          className="flex flex-col items-center justify-center gap-2 py-6"
          aria-hidden
        >
          {isLoadingPlaylists && playlists.length > 0 && (
            <p className="text-sm text-[var(--color-text-subtle)]">
              Carregando mais playlists...
            </p>
          )}
          {isLoadingPlaylists && <Spinner />}
        </div>
      )}
    </div>
  );
}
