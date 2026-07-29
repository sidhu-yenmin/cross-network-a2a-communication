import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Send, User, Bot, Briefcase } from 'lucide-react';

export default function Messages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load messages from localStorage on mount
    const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    setMessages(savedMessages);
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
    setInputValue('');
    
    // Auto-reply for demo purposes (optional)
    if (newMsg.text.toLowerCase().includes('yes') || newMsg.text.toLowerCase().includes('proceed')) {
      setTimeout(() => {
        const replyMsg = {
          id: Date.now().toString(),
          sender: 'agent',
          text: 'Great! I have shared your requirements with the Manager Agent. They will review it and coordinate with the rest of the team. You will be notified once a formal proposal is ready.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const newUpdated = [...updatedMessages, replyMsg];
        setMessages(newUpdated);
        localStorage.setItem('chat_messages', JSON.stringify(newUpdated));
      }, 1500);
    }
  };

  if (!token) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="dashboard-header flex-between">
          <div>
            <h1>Chat</h1>
            <p>Communicate with your assigned Client Representative Agent.</p>
          </div>
          <button 
            onClick={() => navigate('/projects')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.6rem 1.25rem', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary-accent)', 
              border: '1px solid rgba(99, 102, 241, 0.2)', 
              borderRadius: '999px', 
              fontWeight: '600', 
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'; }}
          >
            <Briefcase size={16} /> View Projects
          </button>
        </div>

        <div className="glass-container dashboard-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
          
          {/* Chat History Area */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <p>No messages yet. Submit a project request to start a conversation.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '1rem', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--primary-accent) 0%, var(--secondary-accent) 100%)' : 'rgba(99, 102, 241, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: msg.sender === 'user' ? 'white' : 'var(--primary-accent)' 
                  }}>
                    {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div style={{ 
                    background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)', 
                    border: msg.sender === 'user' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--input-border)', 
                    padding: '1rem', 
                    borderRadius: msg.sender === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px', 
                    maxWidth: '80%' 
                  }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{msg.text}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
            <div className="input-wrapper" style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type your message..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ flex: 1, paddingLeft: '1rem' }} 
              />
              <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.25rem' }} disabled={!inputValue.trim()}>
                <Send size={18} />
              </button>
            </div>
          </form>
          
        </div>
      </main>
    </div>
  );
}
