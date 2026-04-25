// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.rol)) {
    // Redirige al dashboard correspondiente según el rol
    const redirectMap = {
      DOCTOR: '/dashboard-doctor',
      PACIENTE: '/dashboard-paciente',
      ADMIN: '/dashboard',
      RECEPCIONISTA: '/dashboard',
    };
    return <Navigate to={redirectMap[user.rol] || '/dashboard'} replace />;
  }

  return children;
}
