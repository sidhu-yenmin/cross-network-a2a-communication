import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { LayoutDashboard, Briefcase, Activity } from 'lucide-react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);



  if (!token) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back!</h1>
          <p>Here is an overview of your client portal.</p>
        </div>

        <div className="dashboard-grid">
          <div className="glass-container dashboard-card">
            <LayoutDashboard size={32} className="card-icon" />
            <h3>Project Status</h3>
            <p>Your current active projects and their milestones.</p>
          </div>
          <div className="glass-container dashboard-card">
            <Briefcase size={32} className="card-icon" />
            <h3>New Request</h3>
            <p>Submit a new project requirement or proposal to the company.</p>
          </div>
          <div className="glass-container dashboard-card">
            <Activity size={32} className="card-icon" />
            <h3>Recent Activity</h3>
            <p>Review the latest updates and messages from your assigned agent.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
