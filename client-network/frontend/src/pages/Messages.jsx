import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Send, User, Bot, Briefcase, Plus } from 'lucide-react';

export default function Messages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdStr = searchParams.get('projectId');
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : null;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load messages from localStorage on mount
    if (!token) {
      navigate('/');
      return;
    }
    const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    setMessages(savedMessages);
  }, [token]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      projectId: projectId,
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
    setInputValue('');
    
    // Call backend API for real interactive LLM chat
    if (token) {
      // Get the history just for this project (or null if direct chat)
      const history = messages
        .filter(m => m.projectId === projectId)
        .map(m => ({ sender: m.sender, text: m.text }));

      const queryParam = projectId ? `?project_id=${projectId}` : '';
      
      setIsTyping(true);
      fetch(`http://localhost:8001/api/projects/chat${queryParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMsg.text,
          history: history
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("API response was not ok");
        return res.json();
      })
      .then(data => {
        // If a new project was created by the agent, update the URL
        if (data.project_id && data.project_id !== projectId) {
          navigate(`/messages?projectId=${data.project_id}`, { replace: true });
          // Update the messages that had null projectId to the new one
          setMessages(prev => {
            const updated = prev.map(m => m.projectId === null ? { ...m, projectId: data.project_id } : m);
            localStorage.setItem('chat_messages', JSON.stringify(updated));
            return updated;
          });
        }

        const replyMsg = {
          id: Date.now().toString() + "-agent",
          projectId: data.project_id || projectId,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => {
          const newUpdated = [...prev, replyMsg];
          localStorage.setItem('chat_messages', JSON.stringify(newUpdated));
          return newUpdated;
        });

      })
      .catch(err => console.error("Failed to get chat response:", err))
      .finally(() => setIsTyping(false));
    }
  };

  if (!token) return null;

  const displayedMessages = projectId 
    ? messages.filter(msg => msg.projectId === projectId)
    : messages.filter(msg => msg.projectId === null);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="dashboard-header flex-between">
          <div>
            <h1>Chat</h1>
            <p>Communicate with your assigned Client Representative Agent.</p>
          </div>
          {projectId ? (
            <button 
              onClick={() => navigate('/projects?new=true')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.6rem 1.25rem', 
                background: 'var(--primary-accent)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '999px', 
                fontWeight: '600', 
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary-accent-hover)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'var(--primary-accent)'; }}
            >
              <Plus size={16} /> New Request
            </button>
          ) : (
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
          )}
        </div>

        <div className="glass-container dashboard-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
          
          {/* Chat History Area */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {displayedMessages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <p>{!projectId ? "Welcome! You can start a new project by chatting below, or select an existing project." : "No messages yet for this project. Send a message to start a conversation."}</p>
              </div>
            ) : (
              displayedMessages.map(msg => (
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
            
            {/* Quick Reply Button for Approval */}
            {displayedMessages.length > 0 && 
             displayedMessages[displayedMessages.length - 1].sender === 'agent' && 
             displayedMessages[displayedMessages.length - 1].text.includes('Shall I proceed') && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginLeft: '3.5rem', marginTop: '-0.5rem' }}>
                <button 
                  onClick={() => {
                    setInputValue("Yes, proceed");
                    setTimeout(() => {
                      document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }, 50);
                  }}
                  style={{
                    background: 'var(--primary-accent)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Yes, proceed and share
                </button>
              </div>
            )}
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(99, 102, 241, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'var(--primary-accent)' 
                }}>
                  <Bot size={20} />
                </div>
                <div style={{ 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--input-border)', 
                  padding: '1rem', 
                  borderRadius: '0 12px 12px 12px', 
                  maxWidth: '80%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <div style={{width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both'}}></div>
                  <div style={{width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.2s'}}></div>
                  <div style={{width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
            <div className="input-wrapper" style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type your message to the agent..."
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
