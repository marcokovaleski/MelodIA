import { Link } from 'react-router-dom';

/**
 * Card de playlist - grid da biblioteca e explorar.
 */
export default function PlaylistCard({
  id,
  title,
  subtitle,
  coverUrl,
  to,
  onPlay,
}) {
  const content = (
    <>
      <div className="relative w-full overflow-hidden rounded-lg bg-center bg-no-repeat aspect-square bg-cover shadow-md transition-all duration-300 group-hover:shadow-xl">
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onPlay) onPlay();
          }}
          className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:bottom-4 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
          aria-label={`Reproduzir ${title}`}
        >
          <span className="material-symbols-outlined text-3xl">play_arrow</span>
        </button>
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bold text-[var(--color-text-primary)]">{title}</h3>
        {subtitle && (
          <p className="truncate text-sm text-[var(--color-text-subtle)]">{subtitle}</p>
        )}
      </div>
    </>
  );

  const cardClass =
    'group flex cursor-pointer flex-col gap-3 playlist-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg';

  if (to) {
    return (
      <Link to={to} className={cardClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClass} role="article">
      {content}
    </div>
  );
}
