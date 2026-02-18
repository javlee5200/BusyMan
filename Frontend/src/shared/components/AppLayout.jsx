import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/equipos', label: 'Equipos' },
  { to: '/ordenes', label: 'Órdenes' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/reportes', label: 'Reportes' },
];

function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="brand">
          BusyMan
        </Link>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <span>Usuario: {user?.username || 'Sesión activa'}</span>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
