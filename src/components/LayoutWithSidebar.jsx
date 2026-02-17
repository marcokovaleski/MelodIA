import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { useUI } from '../context/UIContext';
import { useAuthStore, selectUserAvatar } from '../store/authStore';

const defaultAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCRHfrO5aNmOjG7WdR8r4rbkrj2nYDxMZattlaig3kSGpEQxOZK-j1OVer-YuSGcW40DiuFZeGtDxmt7SNPET3Bd2VER0q6tqq5yYCuXYbcQ97e2KVNi-z0OJNHULf0jFN6qfaO6zo_OXXcwNH6lgwNXN5U_L-M8_LfF7I4rBlhhl-uRCvEUvM29Owz1EAAd-D22NHec6ADchtWIQysDzcQD1VRlXHgZnpiWQnlFr22WEn09AUB2sCcm8oIQcC6VrhjULdgKgi5A5l-';

/**
 * Layout adaptativo:
 * - Desktop (md+): Navbar + conteúdo com pt-20.
 * - Mobile: placeholder menu (abre sidebar) + avatar estático; ao abrir sidebar ambos somem; fechamento só pelo overlay.
 */
export default function LayoutWithSidebar() {
  const { sidebarOpen, toggleSidebar } = useUI();
  const userAvatarFromStore = useAuthStore(selectUserAvatar);
  const avatarUrl = userAvatarFromStore ?? defaultAvatar;

  return (
    <div className="relative flex min-h-screen w-full">
      <Sidebar />

      {/* Backdrop mobile: único fechamento quando sidebar aberta */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      {/* Placeholder menu — só mobile; visível só com sidebar fechada; abre sidebar ao clicar; vazio para SVG posterior */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-md transition-opacity duration-[0.25s] ease-out md:hidden hover:opacity-100 ${
          sidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-80'
        }`}
        aria-label="Abrir menu"
        aria-expanded={sidebarOpen}
      >
        <img src="/Vector.svg" alt="sidebar-icon" className="h-6 w-6 object-contain" />
      </button>

      {/* Avatar — só mobile; puramente visual; imagem do Spotify quando autenticado */}
      <div
        className={`fixed top-4 right-4 z-[10000] h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/90 shadow-lg backdrop-blur-md transition-opacity duration-[0.25s] ease-out md:hidden ${
          sidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-80'
        }`}
        role="img"
        aria-hidden
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 pt-24 md:p-6 md:pt-20 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
