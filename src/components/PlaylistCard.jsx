import { Link } from 'react-router-dom';

/**
 * Card de playlist - grid da biblioteca e explorar.
 * Suporta coverUrl nulo (exibe placeholder estiloso).
 *
 * @param {object} props
 * @param {string} [props.id] - Id da playlist
 * @param {string} props.title - Nome da playlist
 * @param {string} [props.subtitle] - Ex.: "X músicas"
 * @param {string | null} [props.coverUrl] - URL da capa ou null para placeholder
 * @param {string} [props.to] - Link (ex.: /playlist/:id)
 * @param {object} [props.state] - State para passar ao Link (ex.: dados da playlist para PlaylistDetailsPage)
 * @param {() => void} [props.onPlay] - Callback ao clicar em reproduzir
 */
export default function PlaylistCard({
  id,
  title,
  subtitle,
  coverUrl,
  to,
  state,
  onPlay,
}) {
  const hasImage = coverUrl && typeof coverUrl === 'string' && coverUrl.trim() !== '';

  const content = (
    <>
      <div className="relative w-full overflow-hidden rounded-lg bg-center bg-no-repeat aspect-square bg-cover shadow-md transition-all duration-300 group-hover:shadow-xl">
        {hasImage ? (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] text-white/90"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-5xl">queue_music</span>
            <span className="text-xs font-medium">Sem capa</span>
          </div>
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
      <Link to={to} state={state} className={cardClass}>
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
