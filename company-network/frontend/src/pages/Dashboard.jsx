import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Shield } from 'lucide-react';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav glass-panel">
        <div className="nav-brand">
          <Shield className="brand-icon" size={24} />
          <span>Company Network</span>
        </div>
        <button onClick={handleLogout} className="btn-outline logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Welcome to your Dashboard</h1>
          <p>You have successfully authenticated into the Company Network.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card glass-panel">
            <LayoutDashboard size={32} className="card-icon" />
            <h3>Overview</h3>
            <p>Access your company resources and network configuration here.</p>
          </div>
          <div className="dashboard-card glass-panel">
             <Shield size={32} className="card-icon" />
             <h3>Security</h3>
             <p>Your connection is secure and authenticated.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
