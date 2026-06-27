/**
 * Coluna de duração estilo Spotify: tempo visível; no hover da linha, botão de remover.
 */
export default function PlaylistTrackDurationCell({ duration, onRemove, disabled, trackLabel }) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-end">
      <span className="text-sm text-[var(--color-text-muted)] transition-opacity duration-200 ease-out group-hover:pointer-events-none group-hover:opacity-0">
        {duration}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md text-[var(--color-text-muted)] opacity-0 transition-opacity duration-200 ease-out hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Remover ${trackLabel}`}
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  );
}
