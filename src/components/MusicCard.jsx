import Button from './Button';

/**
 * Card de música (faixa) - lista de músicas, top tocadas, etc.
 */
export default function MusicCard({
  title,
  artist,
  coverUrl,
  duration,
  isPlaying,
  onPlay,
  onMore,
}) {
  return (
    <li className="flex items-center gap-4 py-3 border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        onClick={onPlay}
        className="flex shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        aria-label={isPlaying ? 'Pausar' : `Reproduzir ${title}`}
      >
        <span className={`material-symbols-outlined text-xl ${isPlaying ? 'filled' : ''}`}>
          play_arrow
        </span>
      </button>
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          className="h-12 w-12 rounded-md object-cover"
          width={48}
          height={48}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{artist}</p>
      </div>
      {duration && (
        <span className="shrink-0 text-sm text-[var(--color-text-muted)]">{duration}</span>
      )}
      {onMore && (
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--color-text-muted)]"
          aria-label="Mais opções"
          onClick={onMore}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </Button>
      )}
    </li>
  );
}
