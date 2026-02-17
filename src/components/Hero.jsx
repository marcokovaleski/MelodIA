import Input from './Input';
import Button from './Button';

const EMOJIS = ['🎵', '🎶', '🎼'];
const DELAYS = ['0.1s', '0.3s', '0.5s'];

export default function Hero({
  title = 'Sua playlist perfeita, com um toque de IA.',
  subtitle = 'Digite um comando e deixe que a nossa inteligência artificial crie a trilha sonora ideal para qualquer momento.',
  placeholder = 'Ex: uma playlist de rock animado para treinar na academia',
  hint = 'Digite um comando para gerar sua playlist.',
  onSubmit,
  isLoading,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form?.querySelector('input[name="prompt"]');
    const value = input?.value?.trim();
    if (value && onSubmit) onSubmit(value);
  };

  return (
    <section className="w-full max-w-2xl mx-auto text-center" aria-labelledby="hero-title">
      <div className="mb-8 flex items-center justify-center gap-2">
        {EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="animate-rise text-3xl text-[var(--color-primary)]"
            style={{ animationDelay: DELAYS[i] }}
            aria-hidden
          >
            {emoji}
          </span>
        ))}
      </div>
      <h2
        id="hero-title"
        className="mb-4 text-3xl font-bold tracking-tighter text-[var(--color-text-primary)] sm:text-4xl md:text-5xl"
      >
        {title}
      </h2>
      <p className="mb-10 text-lg text-[var(--color-text-secondary)]">{subtitle}</p>

      <form onSubmit={handleSubmit} className="relative mx-auto max-w-xl">
        <div className="relative flex items-stretch">
          <input
            name="prompt"
            type="text"
            className="form-input h-14 w-full rounded-full border border-gray-300 bg-white px-6 pr-16 text-base text-[var(--color-text-primary)] placeholder:text-gray-400 shadow-sm transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/50 sm:h-16 sm:text-lg focus:outline-none"
            placeholder={placeholder}
            aria-label="Descreva a playlist que deseja criar"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-full bg-[var(--color-primary)] px-5 text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50"
            aria-label="Gerar playlist"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{hint}</p>
    </section>
  );
}
