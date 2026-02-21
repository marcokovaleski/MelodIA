import { Link } from 'react-router-dom';

/**
 * Card de item (faixa ou episódio) na lista de uma playlist.
 *
 * @param {object} props
 * @param {string | null} props.image - URL do thumbnail (álbum ou episódio)
 * @param {string} props.title - Nome da faixa/episódio
 * @param {string} props.subtitle - Artistas ou detalhe do episódio
 * @param {string} props.duration - Duração formatada (mm:ss)
 * @param {boolean} [props.explicit] - Se é conteúdo explícito
 * @param {string} [props.to] - Link opcional (para ações futuras)
 */
export default function TrackItemCard({
  image,
  title,
  subtitle,
  duration,
  explicit = false,
  to,
}) {
  const content = (
    <>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            width={48}
            height={48}
          />
        ) : (
          <span className="material-symbols-outlined text-2xl text-[var(--color-text-muted)]">
            music_note
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-semibold text-[var(--color-text-primary)]">
          {title}
          {explicit && (
            <span
              className="shrink-0 rounded bg-[var(--color-text-muted)] px-1.5 py-0.5 text-[10px] font-bold text-white"
              title="Conteúdo explícito"
            >
              E
            </span>
          )}
        </p>
        <p className="truncate text-sm text-[var(--color-text-subtle)]">
          {subtitle}
        </p>
      </div>
      <span className="shrink-0 text-sm text-[var(--color-text-muted)]">
        {duration}
      </span>
    </>
  );

  const wrapperClass =
    'flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:hover:bg-[var(--color-surface-dark)]';

  if (to) {
    return (
      <Link to={to} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={wrapperClass} role="button" tabIndex={0}>
      {content}
    </div>
  );
}
