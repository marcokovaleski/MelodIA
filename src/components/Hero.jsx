import { forwardRef } from 'react';

const EMOJIS = ['🎵', '🎶', '🎼'];
const DELAYS = ['0.1s', '0.3s', '0.5s'];

const Hero = forwardRef(function Hero(
  {
    title = 'Sua playlist perfeita, com um toque de IA.',
    subtitle = 'Digite um comando e deixe que a nossa inteligência artificial crie a trilha sonora ideal para qualquer momento.',
    placeholder = 'Ex: uma playlist de rock animado para treinar na academia',
    hint = 'Digite um comando para gerar sua playlist.',
    value = '',
    onChange,
    onSubmit,
    isLoading,
    successMessage,
    errorMessage,
  },
  ref,
) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    const v = value.trim();
    if (v && onSubmit) onSubmit(v);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={ref}
            name="prompt"
            type="text"
            className="form-input h-14 w-full rounded-full border border-gray-300 bg-white px-6 text-base text-[var(--color-text-primary)] placeholder:text-gray-400 shadow-sm transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/50 sm:h-16 sm:text-lg focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder}
            aria-label="Descreva a playlist que deseja criar"
            disabled={isLoading}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-16"
            aria-label="Gerar playlist"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="material-symbols-outlined animate-spin text-xl"
                  aria-hidden
                >
                  progress_activity
                </span>
                Gerando playlist...
              </>
            ) : (
              'Gerar Playlist'
            )}
          </button>
        </div>
      </form>
      <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{hint}</p>
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!errorMessage && successMessage ? (
        <p className="mt-3 text-sm text-green-600" role="status">
          {successMessage}
        </p>
      ) : null}
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
