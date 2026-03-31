import { NavLink, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import AppLogo from './AppLogo';
import { handleLogout } from '../auth/logout';

const navItems = [
  { to: '/', icon: 'home', label: 'Início', end: true },
  { to: '/biblioteca', icon: 'library_music', label: 'Sua Biblioteca' },
  { to: '/configuracoes', icon: 'settings', label: 'Configurações' },
];

/**
 * Sidebar: apenas mobile.
 * - Desktop: não renderiza (md:hidden).
 * - Mobile: overlay fixo, slide-in da esquerda; não empurra conteúdo.
 */
export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUI();
  const navigate = useNavigate();

  const goToHero = () => {
    navigate('/', { state: { scrollToHero: true, focusHero: true } });
    toggleSidebar();
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-[9999] flex h-screen w-64 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl transition-transform duration-300 ease-out md:hidden dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu lateral"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AppLogo variant="sidebar" className="text-[var(--color-text-primary)] dark:text-[var(--color-pure-white)]" />
          </div>

          <nav className="flex flex-col gap-2 pt-4" aria-label="Navegação principal">
            {navItems.map(({ to, icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                onClick={toggleSidebar}
                end={end ?? false}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium leading-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] dark:bg-[var(--color-primary)] dark:text-white'
                      : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                  }`
                }
              >
                <span
                  className="material-symbols-outlined shrink-0"
                  style={to === '/biblioteca' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {icon}
                </span>
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={goToHero}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium leading-normal text-[var(--color-text-primary)] transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:text-white dark:hover:bg-gray-700"
            >
              <span className="material-symbols-outlined shrink-0">add_circle</span>
              <span className="truncate">Criar Playlist</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={goToHero}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[var(--color-primary)] px-4 text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <span className="truncate">Criar Nova Playlist</span>
          </button>
          <button
            type="button"
            onClick={() => {
              toggleSidebar();
              handleLogout();
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
