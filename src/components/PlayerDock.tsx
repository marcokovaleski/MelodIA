import { useEffect, useMemo, useState, memo } from 'react';
import { usePlayerContext } from '../context/PlayerContext';
import PlayerControls from './PlayerControls';
import PlayerProgressBar from './PlayerProgressBar';

function TrackArtwork({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [imageUrl]);

  const showSkeleton = Boolean(imageUrl) && !loaded;

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--color-border)] shadow-sm dark:bg-[var(--color-border-dark)]">
      {showSkeleton && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[var(--color-border)] to-[var(--color-border)]/40 dark:from-[var(--color-border-dark)] dark:to-[var(--color-border-dark)]/40"
          aria-hidden
        />
      )}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
          <span className="material-symbols-outlined text-3xl">music_note</span>
        </div>
      )}
      <span className="sr-only">Capa: {title}</span>
    </div>
  );
}

const TrackArtworkMemo = memo(TrackArtwork);

/**
 * Barra fixa inferior: capa, progresso sincronizado, shuffle/repeat e toasts.
 */
export default function PlayerDock() {
  const {
    isPlayerDockVisible,
    isPlaying,
    currentTrack,
    progressMs,
    durationMs,
    toast,
    dismissToast,
    busyAction,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    shuffleState,
    repeatState,
    error,
    dismissError,
  } = usePlayerContext();

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => dismissToast(), 7000);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  const artUrl = useMemo(() => {
    const images = currentTrack?.album?.images;
    if (!images?.length) return null;
    return images[0]?.url ?? null;
  }, [currentTrack?.album?.images]);

  const showTrack = currentTrack?.name ?? '';
  const showArtist =
    currentTrack?.artists?.map((a) => a.name).filter(Boolean).join(', ') ?? '';

  return (
    <>
      {(error ?? toast) && (
        <div
          className="fixed top-20 right-4 z-[10001] max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] shadow-lg dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]"
          role="alert"
        >
          <div className="flex items-start justify-between gap-2">
            <p>{error ?? toast}</p>
            <button
              type="button"
              onClick={() => {
                dismissToast();
                dismissError();
              }}
              className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {isPlayerDockVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[10002] border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)]/95 md:left-[var(--sidebar-width,0px)]">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[42%]">
              <TrackArtworkMemo imageUrl={artUrl} title={showTrack} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {showTrack}
                </p>
                <p className="truncate text-xs text-[var(--color-text-subtle)]">{showArtist}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-[2] flex-col gap-2">
              <PlayerControls
                isPlaying={isPlaying}
                shuffleOn={shuffleState}
                repeatState={repeatState}
                onPlayPause={() => void togglePlayPause()}
                onNext={() => void nextTrack()}
                onPrevious={() => void previousTrack()}
                onShuffle={() => void toggleShuffle()}
                onRepeat={() => void cycleRepeat()}
                busyAction={busyAction}
                disabled={false}
              />
              <PlayerProgressBar
                progressMs={progressMs}
                durationMs={durationMs}
                isPlaying={isPlaying}
                onSeek={(ms) => void seekTo(ms)}
                busy={busyAction === 'seek'}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
