import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:8001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail || 'Failed to send reset link');
      
      setStatus({ type: 'success', message: data.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-wrapper">
      <div className="glass-container auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email and we'll send a reset link</p>
        </div>

        {status.message && (
          <div style={{ 
            color: status.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)', 
            marginBottom: '1rem', 
            textAlign: 'center', 
            background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
            padding: '0.5rem', 
            borderRadius: '8px' 
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleReset}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                className="form-input" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="input-icon" size={20} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }} disabled={loading}>
            {loading ? 'Sending...' : <>Send Reset Link <Send size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
