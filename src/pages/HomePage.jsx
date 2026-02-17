import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero, PromptCard, MusicCard } from "../components";
import { useUI } from "../context/UIContext";

const EXAMPLE_PROMPTS = [
  "Uma playlist para relaxar no fim de tarde, com Lofi e Bossa Nova.",
  "Crie uma trilha sonora épica para uma sessão de jogos de RPG.",
  "Músicas pop dos anos 2000 para uma festa animada.",
];

const TOP_ARTISTS = [
  {
    name: "Artista Exemplo 1",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaOjcGfMR2lwy_mviQ_dl-IlxEp5UPcwo5svY-e86Tjs92DG2roqXFgnmYW8qqrpyjPAXehzuJcNt-RB7B2YoPwL40HHLjOQZMRIn0SL5P7PuJLIXteBfOZ8kyr_4zaGVUMSKqyapb57aZgBzCbci3gWqiWCC1C2SO8B-9e1WKuzjpMhGdsVNd-jXkBNGBHdjF7i1olEnzIg2AHX2bAlp3_FH15u4ES8kuPSp3wqlOm1m_WRlWr0l8AHdrWsNTwtXuUOJyskUXRndS",
  },
  {
    name: "Artista Exemplo 2",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYtQQ1ox5FYn9At2Ndjyy8a9krsCc1R4XQHyrwd5zIMcwK1mrLhmt8OUdphUITO-U-kfoNA0GBNEt8AqMggX7gqRoUnPw8NpOKsOut2kijT06MFLw95FkhD1HREDYn13-qSYGrKUGDt8AacDB5eE8wPQQ3q84g0GBBI0kZj5Zv2fzyXMk3Td94TXQ9CVNEDfQF22g4gJNAkTBHk_DYhhyslGzoCsfooBInFJmk7Fn1pm_AE6flNNdec4lG2OMTnjPWoiyaFPMFAr51",
  },
  {
    name: "Artista Exemplo 3",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMTZWxkhBgOTexpn3DrGgdDJFS9nSxxlUluzy5FUafUu0ML_LJ_L8MaVIM8lBj4v_PAKlo9bwa5HzLenEIvYT3fXfUQp_N9Xq9EiHfJOFkV9dgvE3uQQWI-PN5WNhG0Cp8DowafBy_bCnUMH77lW7CpLiMXTix-h5e4-ccP7qd7lrm776ZlzsYVrDl3Mgbdn3ZXLVjPuyPHD_6792wGFLntdS5RjaVDJsYY5Cb8LGGyUVtokvXuR9P3OjeJ3eduZ7Wq2hApZhh-FpK",
  },
  {
    name: "Artista Exemplo 4",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANYhLVizpOcHrfLRFolkGU-vBRDB4KYdO3tFKL7NJv52Gj7AD65nvRCQz-VIH84os4cF02Q9WoyKCkN--otKTO1rSWpnBUxeqXrOVvuNwMTVDmQyYqH7yUMmqSBTv1KHOglTW3PtacPhhRZF_J85ikex2EM5myeCoW93HeR4B_0EK3z1156oJNW7wMt8CnqwegUGzo1sI2RT71qPTrnORGPXykVt9-2y3xzj6Idk1FfHkEG3oKB260YJ-uqrCaI4bppZvCfTc1vhSE",
  },
  {
    name: "Artista Exemplo 5",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKA9l9jp8473vWNomvZ6jHuBm2R6qpFXUVzGGzUeFlaG9SCwfubRQLyhHYVUpNRA1DHjIee_TCPnYtqJTLBi_WB8NHvh8Q1dYqLd4ujpcAdK7WnThUVOnwmFTHRuReDrhFPNCuVjS9yWg-f2Na15-t9hdIpqkPyLR89s-MpItEjk8Cjj4ptkKH7wFW9uitp6J3qrLXbiODNsrsfcsIl4PhpZy-74BZMObS6wqaty3bhMUaT2S_inZYkrpqFA3otybCr48j3iUQaUgr",
  },
];

const TOP_TRACKS = [
  {
    title: "Nome da Música 1",
    artist: "Artista da Música 1",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgF87mu3sZKns9D_h9vNqzqIXjOTHfFR6LnQAdahI1qg_rfDhjX08_wM_-L4t3ikU87aUNU9YEtshjMeRCd1DWh5EKWLyVIxJtHcxRhekHdqNjlmL4dp1ioV4_elkr0DGJImchAldKqFS3MTWy4j8DCjSm04QSEX4KK0Cs_kx5OkcHSnYj3LFCMvUDTPlCn0uXKuxz9QhWoPj3rVER9CRH8Hx_AVEhaXs7cc81ExoRQv009WVxX57NJTESz0p-GYc_EgszwMSllxIp",
  },
  {
    title: "Nome da Música 2",
    artist: "Artista da Música 2",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA83_DmyfcFD3ZOaVchosU2Dwpw_izTBVhQ9lGxCflD3EEwpUl5iugyK_j3gcaXe6YvR3TXLD4JpNsEPAzJhMxH_MK6x71KQCJScfJ-cGHHEJwXuDcnaVgmaffrzLgLpCgNsEDlagchQMgVjxKhjxQZVoFsyIkRpfRe9tDsVWxNcXO2XW_9mWW9xGr4-F7fCFAbegmpGqDRzmstNaNmdNszfKv7jF-bwsdY9_GFKLhHwA4p1biUR2OmPT5YemCsTxXmgd7V5LeZb_so",
  },
  {
    title: "Nome da Música 3",
    artist: "Artista da Música 3",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhrAw9HEAHpqLBOV-S0lj6QJSbkIeBPEMhqPFGZ_j1EsJvrhNLsYA08H5VGkdeczzPmrNBLHTc03vGPg9T5i_mcTaD-gvx07sZ1_Hza8M67K7lf-jhQTFa2EWHYGqf5x7ezTb5aHQeZpnSMtEASJagt4paVG9k8nFLc43ciTqCwXVQ2IhSyIbITGWkgKsmDlIxsyPBlvm6u8H28Rd_HYIOz_WFGA3oNjapTNfZoOqoUJ3j919StwVq8nQUaEeUmiKsmX9hxbm3dPbO",
  },
  {
    title: "Nome da Música 4",
    artist: "Artista da Música 4",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCcB-Fj2p4vY-N-un6k6JGThfMzentTGYeH7d9P8kbjVGePSGQ0g8phbWwuLSDVkRPBvLcTtk1NERjDuYb_CKqC_Is-_guj4Bb7bdtnZg9Hn-mijlpuMaYYGh1_dTMh7OuxDW4lFc5pOki8-2_u7ukvF692irxbZ2rNhhVfw_ayuKJexx9aC60nQquSkm-xNiimE8XW8_Q0L7irmJHx4MDtDdBHW5YwtwiTh7iSDiQUvzScpOJWWMZ3uZ9QwPqnpuHcq6iSg5gc_Ljk",
  },
  {
    title: "Nome da Música 5",
    artist: "Artista da Música 5",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCr_ME7Sn61HgIMe2yOAUypeTRDbrkyTJ8A4vKSUB1CcVMWYNSAsOPncYJsgirVPUfcob2p25i4r8S3ErRhWUiuDLh3_21ykO7ItZxmLsUBJbzDkKKWPXzVq4VVulfiecQZ1EFSgEgiGxJxwIqvhWzosWRdWJUvE-B7zotiTqmEZzInCtOmMZBg_fjfqOZuQ5KWczig9Y7guD-wHTi58U3_9MONiVksFgWrtJx6BzSYx1qpGAfPyAhx7W-rAeSZP9JPN1SDE7aVO3Re",
  },
];

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
        <div className="w-full">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tighter text-[var(--color-pure-white)] sm:text-4xl md:text-5xl">
            Explore o MelodIA
          </h2>

          <div className="mb-12" aria-labelledby="prompts-heading">
            <h3
              id="prompts-heading"
              className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
            >
              Prompts de Exemplo
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EXAMPLE_PROMPTS.map((text, i) => (
                <PromptCard key={i} text={text} onClick={handlePromptClick} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div aria-labelledby="artists-heading">
              <h3
                id="artists-heading"
                className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
              >
                Top 5 Artistas
              </h3>
              <ul className="space-y-0 rounded-lg border border-white/20 bg-white/10 p-2 divide-y divide-white/10">
                {TOP_ARTISTS.map((artist, i) => (
                  <li key={i} className="flex items-center gap-4 p-3">
                    <img
                      src={artist.image}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                    />
                    <span className="text-lg font-medium text-[var(--color-pure-white)]">
                      {artist.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div aria-labelledby="tracks-heading">
              <h3
                id="tracks-heading"
                className="mb-6 text-2xl font-bold text-[var(--color-pure-white)]"
              >
                Top 5 Músicas Mais Ouvidas
              </h3>

              <ul className="space-y-0 rounded-lg border border-white/20 bg-white/10 p-2 divide-y divide-white/10">
                {TOP_TRACKS.map((track, i) => (
                  <li key={i} className="flex items-center gap-4 p-3">
                    {/* Se a sua lista tiver a imagem da capa, ela fica aqui */}
                    {track.cover && (
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}

                    <div className="flex flex-col">
                      {/* Título da música 100% branco e em negrito */}
                      <span className="text-base font-bold text-white">
                        {track.title}
                      </span>

                      {/* Nome do artista 100% branco */}
                      <span className="text-sm text-white">{track.artist}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
