import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { redirectToSpotifyLogin } from "../auth/spotifyPKCE";
import { useAuthStore, selectIsAuthenticated } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSpotifyLogin = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    redirectToSpotifyLogin();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <img
            src="/login_icon.svg"
            alt="Ícone MelodIA"
            className="mx-auto h-17 w-17 object-contain animate-login-icon-in animate-login-pulse sm:h-17 sm:w-17 md:h-17 md:w-17"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-4xl font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
            MelodIA
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Crie playlists personalizadas no Spotify com comandos de linguagem
            natural.
          </p>
        </header>

        <main>
          <button
            type="button"
            onClick={handleSpotifyLogin}
            disabled={isRedirecting}
            className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[var(--color-primary)] px-8 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-70 disabled:pointer-events-none"
          >
            {/* Container para SVG 512x512 — substitua src pelo ícone Spotify quando disponível */}
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
              <img
                src="/spotify-icon.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </span>
            <span>Login com Spotify</span>
          </button>
        </main>

        <footer className="mt-16 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} MelodIA. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
