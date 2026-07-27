import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Send, User, Bot } from 'lucide-react';

export default function Messages() {
  const { token } = useAuth();
  if (!token) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="dashboard-header">
          <h1>Messages</h1>
          <p>Communicate with your assigned Client Representative Agent.</p>
        </div>

        <div className="glass-container dashboard-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
          
          {/* Chat History Area */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Agent Message */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)' }}>
                <Bot size={20} />
              </div>
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', padding: '1rem', borderRadius: '0 12px 12px 12px', maxWidth: '80%' }}>
                <p style={{ margin: 0, color: 'var(--text-primary)' }}>Hello! I am your Client Representative Agent. I've reviewed your request for the E-Commerce Platform Redesign. Could you please clarify if you need a payment gateway integration in Phase 1?</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>10:42 AM</span>
              </div>
            </div>

            {/* User Message */}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row-reverse' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent) 0%, var(--secondary-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={20} />
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px 0 12px 12px', maxWidth: '80%' }}>
                <p style={{ margin: 0, color: 'var(--text-primary)' }}>Yes, we need Stripe integration for Phase 1. We will hold off on PayPal until Phase 2.</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block', textAlign: 'right' }}>10:45 AM</span>
              </div>
            </div>

          </div>

          {/* Chat Input Area */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
            <div className="input-wrapper" style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type your message..." 
                style={{ flex: 1, paddingLeft: '1rem' }} 
              />
              <button className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.25rem' }}>
                <Send size={18} />
              </button>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
