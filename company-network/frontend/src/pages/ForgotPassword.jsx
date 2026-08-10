import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8002/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.detail || 'Failed to send reset request');
      }
    } catch (err) {
      setError('Network error occurred. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your email to receive a reset link</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span>{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/signin" className="auth-link"><ArrowLeft size={16}/> Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
