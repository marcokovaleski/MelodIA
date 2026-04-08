/**
 * Coluna de índice estilo Spotify: número visível; no hover, botão de play.
 */
export default function PlaylistTrackIndexCell({ indexOneBased, onPlay, disabled }) {
  return (
    <div className="relative flex h-12 w-10 shrink-0 items-center justify-end pr-1">
      <span
        className="text-sm font-medium tabular-nums text-[var(--color-text-muted)] transition-opacity duration-200 ease-out group-hover:pointer-events-none group-hover:opacity-0"
        aria-hidden
      >
        {indexOneBased}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay?.();
        }}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md text-[var(--color-primary)] opacity-0 transition-opacity duration-200 ease-out hover:scale-105 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Reproduzir a partir da faixa ${indexOneBased}`}
      >
        <span className="material-symbols-outlined text-3xl filled">play_arrow</span>
      </button>
    </div>
  );
}
