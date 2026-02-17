import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, MusicCard, Button } from '../components';

const MOCK_PLAYLIST = {
  title: 'Sua Playlist de Rock',
  coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwBwkOzZeJ2OmK1-6-kxioBFhH8zUtqYI8bICHjPOHf8LPibS3V12FHArgwYP4VZoBVRGEx-Qw05DhwqwAid5QtZgwVvIMRMscyUhBv1c9D3_K_vDnFaHWGuC-Yp8dGTD8r17igUkr5IegpLbTL5TAUVzf4rDzibHvnA5u2vuqbKtPYxLFTpIH-22uymuhqd3MTivAX4aYw6kiCAbZfoFbAUsoAEY-Viuwcz5J4tXz6GrD61ikA0SU_GxbVKYOiPdeArTcjXRXIjo',
  currentTrack: { title: 'Thunderstruck', artist: 'AC/DC' },
  tracks: [
    { title: 'Enter Sandman', artist: 'Metallica', duration: '5:31' },
    { title: "Welcome to the Jungle", artist: "Guns N' Roses", duration: '4:34' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', duration: '5:01' },
  ],
};

export default function GeneratePlaylistPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(location.state?.prompt || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    if (location.state?.prompt) setPrompt(location.state.prompt);
  }, [location.state?.prompt]);

  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form?.querySelector('input[name="prompt"]');
    const value = input?.value?.trim();
    if (value) {
      setPrompt(value);
      // TODO: chamar N8N/API para gerar nova playlist
    }
  };

  const allTracks = [MOCK_PLAYLIST.currentTrack, ...MOCK_PLAYLIST.tracks];
  const currentTrack = allTracks[currentTrackIndex];

  return (
    <div className="flex flex-col gap-6 px-4 pb-4 pt-3">
      <form onSubmit={handleSearch} className="flex flex-col min-w-40 h-12 w-full">
        <label htmlFor="search-prompt" className="sr-only">
          Descreva a playlist
        </label>
        <div className="flex w-full flex-1 items-stretch rounded-xl h-12 border border-[var(--color-border)] bg-white">
          <span className="flex items-center justify-center pl-4 text-[var(--color-text-muted)]" aria-hidden>
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            id="search-prompt"
            name="prompt"
            type="text"
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl border-none bg-white text-[var(--color-text-primary)] placeholder:text-gray-400 focus:border-none focus:outline-none focus:ring-0 h-full px-4 pl-2 text-base"
            placeholder="Uma playlist de rock para malhar pesado"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
      </form>

      <div className="rounded-lg border border-[var(--color-border)] p-4">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">
          {MOCK_PLAYLIST.title}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div
            className="aspect-square h-28 w-28 shrink-0 rounded-md bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${MOCK_PLAYLIST.coverUrl}")` }}
            role="img"
            aria-label="Capa da playlist"
          />
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold leading-tight text-[var(--color-text-primary)]">
                  {currentTrack?.title}
                </p>
                <p className="text-sm font-normal text-[var(--color-text-subtle)]">
                  {currentTrack?.artist}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-[var(--color-text-subtle)]" aria-label="Mais opções">
                <span className="material-symbols-outlined">more_horiz</span>
              </Button>
            </div>
            <div className="mt-4 flex h-1.5 items-center">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: '50%' }}
              />
              <div
                className="h-full flex-1 rounded-full bg-[var(--color-border)]"
                style={{ width: '50%' }}
              />
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Faixa anterior"
                onClick={() => setCurrentTrackIndex((i) => (i > 0 ? i - 1 : allTracks.length - 1))}
              >
                <span className="material-symbols-outlined text-3xl">skip_previous</span>
              </Button>
              <Button
                variant="primary"
                size="iconLg"
                className="bg-[var(--color-primary)] text-white"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                onClick={() => setIsPlaying((p) => !p)}
              >
                <span className={`material-symbols-outlined text-4xl ${isPlaying ? 'filled' : ''}`}>
                  play_arrow
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Próxima faixa"
                onClick={() => setCurrentTrackIndex((i) => (i < allTracks.length - 1 ? i + 1 : 0))}
              >
                <span className="material-symbols-outlined text-3xl">skip_next</span>
              </Button>
            </div>
          </div>
        </div>

        <ul className="mt-4 flex flex-col" aria-label="Faixas da playlist">
          {MOCK_PLAYLIST.tracks.map((track, i) => (
            <MusicCard
              key={i}
              title={track.title}
              artist={track.artist}
              duration={track.duration}
              isPlaying={currentTrackIndex === i + 1 && isPlaying}
              onPlay={() => {
                setCurrentTrackIndex(i + 1);
                setIsPlaying(true);
              }}
              onMore={() => {}}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
