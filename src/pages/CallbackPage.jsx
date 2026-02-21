import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  exchangeCodeForToken,
  getProfile,
  validateAndConsumeState,
} from '../auth/spotifyPKCE';
import { useAuthStore } from '../store/authStore';

/**
 * Rota /callback: recebe ?code= do Spotify, troca por tokens, busca perfil, só então limpa URL e redireciona.
 * Protegido contra execução dupla (StrictMode / double mount) e reuso do code.
 */
export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState(null);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    const code = searchParams.get('code');
    const stateFromUrl = searchParams.get('state');
    if (!code) {
      setError('Código de autorização não recebido.');
      return;
    }
    if (!validateAndConsumeState(stateFromUrl)) {
      setError('Estado de segurança inválido. Tente fazer login novamente.');
      return;
    }

    hasHandledRef.current = true;
    let cancelled = false;

    async function handleCallback() {
      try {
        const { accessToken, refreshToken } = await exchangeCodeForToken(code);
        const userProfile = await getProfile(accessToken);
        setAuth(accessToken, refreshToken, userProfile);
        window.history.replaceState({}, document.title, '/');
        navigate('/', { replace: true });
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Falha ao concluir login.');
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-full bg-[var(--color-primary)] px-6 py-2 font-bold text-white hover:bg-[var(--color-primary-hover)]"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="auth-spinner" aria-hidden="true" />
      <p className="text-[var(--color-text-secondary)]">Conectando ao Spotify...</p>
    </div>
  );
}
