import { NavLink } from 'react-router-dom';

/**
 * Abas horizontais (ex.: Biblioteca - Playlists / Artistas / Álbuns).
 */
export default function Tabs({ items, basePath = '' }) {
  return (
    <nav aria-label="Abas" className="-mb-px flex space-x-8 border-b border-[var(--color-border)]">
      {items.map(({ to, label }) => {
        const path = basePath ? [basePath, to].filter(Boolean).join('/') : to;
        return (
          <NavLink
            key={path}
            to={path}
            end={to === '' || path === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`
            }
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
