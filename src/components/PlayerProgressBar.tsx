import { useCallback, useMemo, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { formatDuration } from '../utils/formatDuration';

interface PlayerProgressBarProps {
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  disabled?: boolean;
  onSeek?: (positionMs: number) => void;
  busy?: boolean;
}

export default function PlayerProgressBar({
  progressMs,
  durationMs,
  isPlaying,
  disabled,
  onSeek,
  busy,
}: PlayerProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const pct = useMemo(() => {
    if (!durationMs || durationMs <= 0) return 0;
    return Math.min(100, Math.max(0, (progressMs / durationMs) * 100));
  }, [progressMs, durationMs]);

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!onSeek || !barRef.current || !durationMs) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width > 0 ? x / rect.width : 0;
      onSeek(Math.floor(ratio * durationMs));
    },
    [durationMs, onSeek],
  );

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || busy || !onSeek) return;
    handlePointer(e.clientX);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek || disabled || busy) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = Math.min(10_000, durationMs * 0.05 || 5000);
      const next =
        e.key === 'ArrowRight'
          ? Math.min(durationMs, progressMs + step)
          : Math.max(0, progressMs - step);
      onSeek(next);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div
        ref={barRef}
        role={onSeek ? 'slider' : 'progressbar'}
        tabIndex={onSeek && !disabled ? 0 : undefined}
        aria-valuenow={Math.round(progressMs)}
        aria-valuemin={0}
        aria-valuemax={durationMs}
        aria-label="Progresso da faixa"
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`group relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] ${
          onSeek && !disabled && !busy ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <div
          className={`h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200 ease-out ${
            isPlaying ? '' : 'opacity-80'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between font-variant-numeric tabular-nums text-xs text-[var(--color-text-subtle)]">
        <span>{formatDuration(progressMs)}</span>
        <span>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );
}
