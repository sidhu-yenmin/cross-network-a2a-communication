import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, User, Bot, Inbox } from 'lucide-react';

export default function Messages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdStr = searchParams.get('projectId');
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : null;
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
      projectId: projectId,
      sender: 'agent', // Company side (represented as agent here)
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
    setInputValue('');
    
    // Auto-reply for demo purposes
    if (newMsg.text.toLowerCase().includes('hello') || newMsg.text.toLowerCase().includes('hi')) {
      setTimeout(() => {
        const replyMsg = {
          id: Date.now().toString(),
          projectId: projectId,
          sender: 'user', // Client side
          text: 'Hello! I am waiting for an update on my project request.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const newUpdated = [...updatedMessages, replyMsg];
        setMessages(newUpdated);
        localStorage.setItem('chat_messages', JSON.stringify(newUpdated));
      }, 1500);
    }
  };

  if (!token) return null;

  const displayedMessages = projectId 
    ? messages.filter(msg => msg.projectId === projectId)
    : [];

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Chat</h1>
          <p>Communicate with the Client Representative Agent regarding project requests.</p>
        </div>
        <button 
          onClick={() => navigate('/incoming-requests')}
          className="btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
        >
          <Inbox size={16} /> View Requests
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', marginTop: '1.5rem', overflow: 'hidden' }}>
        
        {/* Chat History Area */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!projectId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <p>Please select a project request from the Project Requests tab to view its chat history.</p>
            </div>
          ) : displayedMessages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <p>No messages yet for this request. Send a message to start a conversation.</p>
            </div>
          ) : (
            displayedMessages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '1rem', flexDirection: msg.sender === 'agent' ? 'row-reverse' : 'row' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: msg.sender === 'agent' ? 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)' : 'rgba(255, 255, 255, 0.05)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: msg.sender === 'agent' ? 'white' : 'var(--text-primary)' 
                }}>
                  {msg.sender === 'agent' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div style={{ 
                  background: msg.sender === 'agent' ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255, 255, 255, 0.03)', 
                  border: msg.sender === 'agent' ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '1rem', 
                  borderRadius: msg.sender === 'agent' ? '12px 0 12px 12px' : '0 12px 12px 12px', 
                  maxWidth: '80%' 
                }}>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{msg.text}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block', textAlign: msg.sender === 'agent' ? 'right' : 'left' }}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder={projectId ? "Type your message..." : "Select a request first..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ flex: 1 }} 
              disabled={!projectId}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={!projectId || !inputValue.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
