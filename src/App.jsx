import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { LayoutWithSidebar, ProtectedRoute } from './components';
import {
  LoginPage,
  HomePage,
  BibliotecaPage,
  GeneratePlaylistPage,
  SettingsPage,
  CallbackPage,
} from './pages';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UIProvider>
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
              <Route path="criar-playlist" element={<GeneratePlaylistPage />} />
              <Route path="biblioteca" element={<BibliotecaPage />} />
              <Route path="biblioteca/artistas" element={<BibliotecaPage />} />
              <Route path="biblioteca/albums" element={<BibliotecaPage />} />
              <Route path="biblioteca/podcasts" element={<BibliotecaPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="playlist/:id" element={<GeneratePlaylistPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UIProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
