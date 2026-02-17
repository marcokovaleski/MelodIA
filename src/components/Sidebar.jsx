import { NavLink } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import AppLogo from './AppLogo';

const navItems = [
  { to: '/', icon: 'home', label: 'Início' },
  { to: '/criar-playlist', icon: 'add_circle', label: 'Criar Playlist' },
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
            {navItems.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium leading-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    isActive
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] dark:bg-[var(--color-primary)] dark:text-white'
                      : 'text-[var(--color-text-primary)] hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700'
                  }`
                }
                end={to === '/'}
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
          </nav>
        </div>

        <div className="mt-auto">
          <NavLink
            to="/criar-playlist"
            onClick={toggleSidebar}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[var(--color-primary)] px-4 text-white text-sm font-bold leading-normal tracking-wide shadow-sm hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <span className="truncate">Criar Nova Playlist</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
