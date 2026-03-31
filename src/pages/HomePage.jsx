import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hero, ExploreSection } from '../components';
import { useUI } from '../context/UIContext';
import { useGeneratePlaylist } from '../hooks/useGeneratePlaylist';

const HERO_SUCCESS_MS = 500;

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setNavbarScrollVariant } = useUI();
  const sectionHomeRef = useRef(null);
  const sectionExploreRef = useRef(null);
  const heroInputRef = useRef(null);
  const [prompt, setPrompt] = useState('');

  const { execute, isLoading, successMessage, errorMessage, clearFeedback } = useGeneratePlaylist();

  useEffect(() => {
    const explore = sectionExploreRef.current;
    if (!explore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== explore) return;
          setNavbarScrollVariant(entry.isIntersecting ? 'dark' : 'light');
        });
      },
      { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );
    observer.observe(explore);
    return () => {
      observer.disconnect();
      setNavbarScrollVariant('light');
    };
  }, [setNavbarScrollVariant]);

  useEffect(() => {
    const p = location.state?.heroPrompt;
    if (typeof p !== 'string' || !p.trim()) return;

    setPrompt(p);
    const rest = { ...(location.state ?? {}) };
    delete rest.heroPrompt;
    navigate(location.pathname, {
      replace: true,
      state: Object.keys(rest).length ? rest : undefined,
    });
  }, [location.state?.heroPrompt, location.pathname, navigate]);

  useEffect(() => {
    if (!location.state?.scrollToHero) return;

    sectionHomeRef.current?.scrollIntoView({ behavior: 'smooth' });

    const focusHero = location.state?.focusHero;
    const timer = window.setTimeout(() => {
      if (focusHero) heroInputRef.current?.focus();
      const rest = { ...(location.state ?? {}) };
      delete rest.scrollToHero;
      delete rest.focusHero;
      navigate(location.pathname, {
        replace: true,
        state: Object.keys(rest).length ? rest : undefined,
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.state?.scrollToHero, location.state?.focusHero, navigate]);

  const handleHeroSubmit = async (trimmedPrompt) => {
    clearFeedback();
    const res = await execute(trimmedPrompt);
    if (res?.success && res?.playlistId) {
      await new Promise((r) => setTimeout(r, HERO_SUCCESS_MS));
      navigate(`/playlist/${res.playlistId}`, {
        state: { total: res.tracks ?? 0 },
      });
    }
  };

  const handlePromptClick = (text) => {
    navigate('/', {
      state: {
        heroPrompt: text,
        scrollToHero: true,
        focusHero: true,
      },
    });
  };

  return (
    <div className="w-full flex flex-col">
      <section
        ref={sectionHomeRef}
        id="hero-section"
        className="flex min-h-screen w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
        aria-label="Criar playlist"
      >
        <div className="mx-auto w-full max-w-screen-xl flex flex-col items-center">
          <Hero
            ref={heroInputRef}
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleHeroSubmit}
            isLoading={isLoading}
            successMessage={successMessage}
            errorMessage={errorMessage}
          />
        </div>
      </section>

      <section
        ref={sectionExploreRef}
        className="flex min-h-screen w-screen min-w-full flex-col bg-[var(--color-primary-light)] px-4 py-12 sm:px-6 lg:px-8 -mx-4 -mb-4 md:-mx-6 md:-mb-6 lg:-mx-8 lg:-mb-8"
        aria-label="Explorar"
      >
        <ExploreSection onPromptClick={handlePromptClick} />
      </section>
    </div>
  );
}
