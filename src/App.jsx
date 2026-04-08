import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { UIProvider } from './context/UIContext';
import { LayoutWithSidebar, ProtectedRoute } from './components';
import {
  LoginPage,
  HomePage,
  BibliotecaPage,
  SettingsPage,
  CallbackPage,
  PlaylistDetailsPage,
} from './pages';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UIProvider>
          <PlayerProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<CallbackPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <LayoutWithSidebar />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="biblioteca" element={<BibliotecaPage />} />
                <Route path="biblioteca/artistas" element={<BibliotecaPage />} />
                <Route path="biblioteca/albums" element={<BibliotecaPage />} />
                <Route path="biblioteca/podcasts" element={<BibliotecaPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
                <Route path="playlist/:id" element={<PlaylistDetailsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PlayerProvider>
        </UIProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
