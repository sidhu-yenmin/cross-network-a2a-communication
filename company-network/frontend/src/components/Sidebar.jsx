import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Inbox, 
  BrainCircuit, 
  CheckSquare, 
  History, 
  LogOut,
  Shield,
  FileSearch,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Project Requests', href: '/incoming-requests', icon: Inbox },
  // { name: 'Requirement Analysis', href: '/requirement-analysis', icon: FileSearch },
  // { name: 'AI Analysis Console', href: '/ai-analysis', icon: BrainCircuit },
  { name: 'Proposal Approval', href: '/proposal-approval', icon: CheckSquare },
  { name: 'Proposal History', href: '/proposal-history', icon: History },
  { name: 'Chat', href: '/messages', icon: MessageSquare },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <Shield className="brand-icon" size={28} />
        <span className="brand-title">Company Net</span>
      </div>
      
      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn-outline logout-btn w-full">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
