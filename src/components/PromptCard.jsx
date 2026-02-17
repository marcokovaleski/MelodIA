/**
 * Card de prompt de exemplo (Explore).
 */
export default function PromptCard({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(text)}
      className="cursor-pointer rounded-lg border border-white/20 bg-white/10 p-4 text-left text-[var(--color-pure-white)] transition-all hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <p className="font-semibold">&quot;{text}&quot;</p>
    </button>
  );
}
