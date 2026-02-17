import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from './index';

/**
 * Layout com navbar e footer (páginas sem sidebar).
 */
export default function Layout() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center w-full max-w-screen-xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
