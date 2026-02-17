import { useUI } from '../context/UIContext';

/**
 * Footer com mesmo comportamento de scroll da Navbar: usa navbarScrollVariant do contexto
 * (light sobre Sessão Home, dark sobre Sessão Explore). Transição suave.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const { navbarScrollVariant } = useUI();
  const isDark = navbarScrollVariant === 'dark';

  return (
    <footer
      className={`mt-auto py-6 text-center text-sm transition-colors duration-300 ease-out ${
        isDark ? 'bg-[var(--color-deep-black)] text-gray-400' : 'text-[var(--color-text-secondary)]'
      }`}
      role="contentinfo"
    >
      <p>© {year} MelodIA. Todos os direitos reservados.</p>
    </footer>
  );
}
