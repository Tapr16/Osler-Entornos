// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  ADMIN: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/pacientes', icon: '👤', label: 'Pacientes' },
    { to: '/doctores', icon: '👨‍⚕️', label: 'Doctores' },
    { to: '/citas', icon: '📅', label: 'Citas Médicas' },
  ],
  RECEPCIONISTA: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/pacientes', icon: '👤', label: 'Pacientes' },
    { to: '/doctores', icon: '👨‍⚕️', label: 'Doctores' },
    { to: '/citas', icon: '📅', label: 'Citas Médicas' },
  ],
  DOCTOR: [
    { to: '/dashboard-doctor', icon: '🏠', label: 'Mi Panel' },
  ],
  PACIENTE: [
    { to: '/dashboard-paciente', icon: '🏠', label: 'Mi Panel' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = navItems[user.rol] || navItems.RECEPCIONISTA;
  const initials = `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🩺</div>
        <div>
          <h1>Osler</h1>
          <span>Sistema Médico</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">Navegación</p>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user.nombre} {user.apellido}</div>
            <div className="user-role">{user.rol}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
