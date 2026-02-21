import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';
import { useUI } from '../context/UIContext';
import { useAuthStore, selectUserAvatar } from '../store/authStore';
import { handleLogout } from '../auth/logout';

const defaultAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCRHfrO5aNmOjG7WdR8r4rbkrj2nYDxMZattlaig3kSGpEQxOZK-j1OVer-YuSGcW40DiuFZeGtDxmt7SNPET3Bd2VER0q6tqq5yYCuXYbcQ97e2KVNi-z0OJNHULf0jFN6qfaO6zo_OXXcwNH6lgwNXN5U_L-M8_LfF7I4rBlhhl-uRCvEUvM29Owz1EAAd-D22NHec6ADchtWIQysDzcQD1VRlXHgZnpiWQnlFr22WEn09AUB2sCcm8oIQcC6VrhjULdgKgi5A5l-';

/**
 * Navbar desktop: [ AppLogo ] [ Início | Sua Biblioteca ] [ + Criar Nova Playlist ] [ Configurações ] [ Avatar ]
 * Visível apenas em md+ (LayoutWithSidebar esconde no mobile).
 * Avatar: imagem do perfil Spotify quando autenticado; apenas visual (sem ação ao clicar).
 */
export default function Navbar({ userAvatar: userAvatarProp, variant: variantProp = 'light' }) {
  const userAvatarFromStore = useAuthStore(selectUserAvatar);
  const userAvatar = userAvatarFromStore ?? userAvatarProp ?? defaultAvatar;
  const { navbarScrollVariant } = useUI();
  const variant = navbarScrollVariant ?? variantProp;
  const isDark = variant === 'dark';
  const borderClass = isDark ? 'border-gray-800' : 'border-[var(--color-secondary)]';
  const bgClass = isDark ? 'bg-[var(--color-deep-black)]' : 'bg-white';
  const linkClass = isDark
    ? 'text-gray-400 hover:text-white'
    : 'text-gray-600 hover:text-[var(--color-text-primary)]';
  const configClass = isDark
    ? 'text-white hover:bg-gray-800'
    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-text-primary)]';

  return (
    <header
      className={`hidden md:flex sticky top-0 z-10 items-center justify-between border-b transition-colors duration-300 ease-out ${borderClass} ${bgClass} px-4 py-3 sm:px-6 lg:px-8`}
      role="banner"
    >
      <div className="flex shrink-0">
        <AppLogo
          variant="header"
          textClass={isDark ? 'text-white' : 'text-[var(--color-text-primary)]'}
        />
      </div>

      <nav
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-8"
        aria-label="Navegação principal"
      >
        <Link to="/" className={`text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded ${linkClass}`}>
          Início
        </Link>
        <Link to="/biblioteca" className={`text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded ${linkClass}`}>
          Sua Biblioteca
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Link
          to="/criar-playlist"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span className="whitespace-nowrap">Criar Nova Playlist</span>
        </Link>
        <Link
          to="/configuracoes"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${configClass}`}
          aria-label="Configurações"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${configClass}`}
          aria-label="Sair"
          title="Sair"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
        <div
          className="h-9 w-9 rounded-full bg-cover bg-center sm:h-10 sm:w-10"
          style={{ backgroundImage: `url("${userAvatar}")` }}
          role="img"
          aria-label="Avatar do usuário"
        />
      </div>
    </header>
  );
}
