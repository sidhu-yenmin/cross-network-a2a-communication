import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageSquare, Briefcase, Settings, LogOut, Hexagon } from 'lucide-react';

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/projects', label: 'Active Projects', icon: Briefcase },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Hexagon className="brand-icon" size={28} color="var(--primary-accent)" />
        <h2>Client Portal</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button onClick={logout} className="nav-item logout">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
