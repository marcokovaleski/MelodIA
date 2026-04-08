import { memo } from 'react';
import type { PlayerBusyAction } from '../context/PlayerContext';

interface PlayerControlsProps {
  isPlaying: boolean;
  shuffleOn: boolean;
  repeatState: string;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  disabled?: boolean;
  busyAction: PlayerBusyAction;
}

function isBusy(
  action: PlayerBusyAction,
  key: 'play' | 'pause' | 'next' | 'previous' | 'shuffle' | 'repeat',
): boolean {
  if (!action) return false;
  if (action === 'play' && (key === 'play' || key === 'pause')) return true;
  if (action === 'pause' && key === 'pause') return true;
  return action === key;
}

function PlayerControlsInner({
  isPlaying,
  shuffleOn,
  repeatState,
  onPlayPause,
  onNext,
  onPrevious,
  onShuffle,
  onRepeat,
  disabled,
  busyAction,
}: PlayerControlsProps) {
  const busy = Boolean(busyAction);
  const playPauseIcon = isPlaying ? 'pause' : 'play_arrow';
  const rs = (repeatState || 'off').toLowerCase();
  const repeatActive = rs === 'context' || rs === 'track';
  const repeatIcon = rs === 'track' ? 'repeat_one' : 'repeat';

  const btnBase =
    'flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-primary)] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10';
  const activeRing =
    'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40';

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={onShuffle}
        disabled={disabled || busy}
        aria-label={shuffleOn ? 'Desativar ordem aleatória' : 'Ordem aleatória'}
        aria-pressed={shuffleOn}
        className={`${btnBase} ${shuffleOn ? activeRing : ''}`}
      >
        {isBusy(busyAction, 'shuffle') ? (
          <span className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <span className="material-symbols-outlined text-xl">shuffle</span>
        )}
      </button>

      <button
        type="button"
        onClick={onPrevious}
        disabled={disabled || busy}
        aria-label="Faixa anterior"
        className={btnBase}
      >
        {isBusy(busyAction, 'previous') ? (
          <span className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <span className="material-symbols-outlined text-2xl">skip_previous</span>
        )}
      </button>

      <button
        type="button"
        onClick={onPlayPause}
        disabled={disabled || busy}
        aria-label={isPlaying ? 'Pausar' : 'Tocar'}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-md transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy(busyAction, 'play') || isBusy(busyAction, 'pause') ? (
          <span className="h-6 w-6 animate-pulse rounded-full bg-white/70" aria-hidden />
        ) : (
          <span className="material-symbols-outlined text-3xl filled">{playPauseIcon}</span>
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={disabled || busy}
        aria-label="Próxima faixa"
        className={btnBase}
      >
        {isBusy(busyAction, 'next') ? (
          <span className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <span className="material-symbols-outlined text-2xl">skip_next</span>
        )}
      </button>

      <button
        type="button"
        onClick={onRepeat}
        disabled={disabled || busy}
        aria-label={
          rs === 'off'
            ? 'Repetir contexto'
            : rs === 'context'
              ? 'Repetir faixa'
              : 'Desativar repetição'
        }
        aria-pressed={repeatActive}
        className={`${btnBase} ${repeatActive ? activeRing : ''}`}
      >
        {isBusy(busyAction, 'repeat') ? (
          <span className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-text-muted)]" aria-hidden />
        ) : (
          <span className="material-symbols-outlined text-xl">{repeatIcon}</span>
        )}
      </button>
    </div>
  );
}

export default memo(PlayerControlsInner);
