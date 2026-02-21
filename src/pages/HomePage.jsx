import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero, ExploreSection } from "../components";
import { useUI } from "../context/UIContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { setNavbarScrollVariant } = useUI();
  const sectionHomeRef = useRef(null);
  const sectionExploreRef = useRef(null);

  useEffect(() => {
    const explore = sectionExploreRef.current;
    if (!explore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== explore) return;
          setNavbarScrollVariant(entry.isIntersecting ? "dark" : "light");
        });
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    observer.observe(explore);
    return () => {
      observer.disconnect();
      setNavbarScrollVariant("light");
    };
  }, [setNavbarScrollVariant]);

  const handleSubmit = (prompt) => {
    navigate("/criar-playlist", { state: { prompt } });
  };

  const handlePromptClick = (text) => {
    navigate("/criar-playlist", { state: { prompt: text } });
  };

  return (
    <div className="w-full flex flex-col">
      {/* Seção 1 – Home */}
      <section
        ref={sectionHomeRef}
        className="flex min-h-screen w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
        aria-label="Criar playlist"
      >
        <div className="mx-auto w-full max-w-screen-xl flex flex-col items-center">
          <Hero onSubmit={handleSubmit} />
        </div>
      </section>

      {/* Seção 2 – Explore: 100% largura e altura da viewport; -mb elimina barra branca antes do Footer */}
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
