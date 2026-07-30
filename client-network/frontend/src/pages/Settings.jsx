import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { User, Mail, Building, Bell, Shield, Save } from 'lucide-react';

export default function Settings() {
  const { token } = useAuth();
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
          <h1>Settings</h1>
          <p>Manage your account preferences and profile.</p>
        </div>

        <div className="dashboard-grid">
          
          {/* Profile Settings */}
          <div className="glass-container dashboard-card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <User size={20} color="var(--primary-accent)" /> 
              Profile Information
            </h3>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <input type="text" className="form-input" defaultValue="John Doe" />
                    <User className="input-icon" size={20} />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Company Name</label>
                  <div className="input-wrapper">
                    <input type="text" className="form-input" defaultValue="Acme Corp" />
                    <Building className="input-icon" size={20} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input type="email" className="form-input" defaultValue="john.doe@acmecorp.com" readOnly style={{ opacity: 0.7 }} />
                  <Mail className="input-icon" size={20} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-primary" style={{ width: 'auto' }}>
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="glass-container dashboard-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--primary-accent)" /> 
                Notifications
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Email Alerts</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary-accent)', width: '20px', height: '20px' }} />
              </div>
            </div>

            <div className="glass-container dashboard-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--primary-accent)" /> 
                Security
              </h3>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                Change Password
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
