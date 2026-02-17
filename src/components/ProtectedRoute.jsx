import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';

/**
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
