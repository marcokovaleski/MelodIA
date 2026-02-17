import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';

/**
 * Ícone unificado do app: usado no Navbar e na Sidebar.
 * - variant="header" → sempre ícone + texto (Navbar).
 * - variant="sidebar" → ícone + texto só quando sidebarOpen; senão só ícone.
 * Clique: toggleSidebar() e navigate('/') para refletir na hora.
 */
export default function AppLogo({ variant = 'header', className = '', textClass = 'text-[var(--color-text-primary)]' }) {
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useUI();

  const isSidebar = variant === 'sidebar';
  const showText = isSidebar ? sidebarOpen : true;

  const handleClick = (e) => {
    e.preventDefault();
    toggleSidebar();
    navigate('/', { replace: false });
  };

  return (
    <Link
      to="/"
      onClick={handleClick}
      className={`flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg ${isSidebar && !sidebarOpen ? 'justify-center' : ''} ${className}`}
      aria-label="MelodIA - Página inicial"
    >
      <span
        className={`material-symbols-outlined text-[var(--color-primary)] shrink-0 ${isSidebar && !sidebarOpen ? 'text-3xl' : 'text-4xl'}`}
        aria-hidden
      >
        music_note
      </span>
      {showText && (
        <span className="min-w-0 flex flex-col overflow-hidden">
          <span className={`text-xl font-bold tracking-tight sm:text-2xl truncate ${textClass}`}>
            MelodIA
          </span>
          {isSidebar && (
            <span className="text-sm text-[var(--color-text-subtle)] truncate">Seu DJ Pessoal</span>
          )}
        </span>
      )}
    </Link>
  );
}
