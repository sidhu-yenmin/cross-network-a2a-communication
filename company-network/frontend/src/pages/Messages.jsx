import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, User, Bot, Inbox, Loader } from 'lucide-react';

// Sender-type to emoji + colour mapping
const AGENT_META = {
  pm:       { emoji: '🧑‍💼', label: 'PM Agent',       color: 'rgba(79, 70, 229, 0.15)',  border: 'rgba(79, 70, 229, 0.3)'  },
  ba:       { emoji: '📊', label: 'BA Agent',       color: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  tech:     { emoji: '🏗️', label: 'Technical Agent', color: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  cost:     { emoji: '💰', label: 'Cost Agent',      color: 'rgba(239, 68, 68, 0.12)',  border: 'rgba(239, 68, 68, 0.3)'  },
  timeline: { emoji: '📅', label: 'Timeline Agent',  color: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  risk:     { emoji: '⚠️', label: 'Risk Agent',      color: 'rgba(234, 179, 8, 0.12)',  border: 'rgba(234, 179, 8, 0.3)'  },
  client:   { emoji: '🤝', label: 'Client Agent',    color: 'rgba(255,255,255,0.04)',   border: 'rgba(255,255,255,0.1)'   },
};

export default function Messages() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdStr = searchParams.get('projectId');          // client_project_id
  const projectId = projectIdStr ? parseInt(projectIdStr, 10) : null;

  const [staticMessages, setStaticMessages] = useState([]);   // from localStorage (client summary)
  const [agentMessages, setAgentMessages] = useState([]);     // from backend (live delegation)
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Load static messages from localStorage (client summary + pm ack)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    setStaticMessages(saved.filter(m => m.projectId === projectId));
  }, [projectId]);

  // Poll backend for live agent messages
  useEffect(() => {
    if (!projectId || !token) return;

    const fetchAgentMessages = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/gateway/agent-messages/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setAgentMessages(data);

        // If we have agent messages, check if still analyzing
        const statuses = await fetch(`http://localhost:8000/api/gateway/incoming-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statuses.ok) {
          const projects = await statuses.json();
          const thisProject = projects.find(p => p.client_project_id === projectId);
          if (thisProject) {
            setIsAnalyzing(thisProject.agent_status === 'ANALYZING');
          }
        }
      } catch (e) {
        console.error('Agent message poll error:', e);
      }
    };

    fetchAgentMessages();
    pollRef.current = setInterval(fetchAgentMessages, 4000); // poll every 4s
    return () => clearInterval(pollRef.current);
  }, [projectId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [staticMessages, agentMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !projectId) return;
    const newMsg = {
      id: Date.now().toString(),
      projectId,
      sender: 'agent',
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...staticMessages, newMsg];
    setStaticMessages(updated);
    const all = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    const others = all.filter(m => m.projectId !== projectId);
    localStorage.setItem('chat_messages', JSON.stringify([...others, ...updated]));
    setInputValue('');
  };

  if (!token) return null;

  // ─── Build unified display list ───────────────────────────────────────────
  // Static messages (client summary + PM ack) already shown at top.
  // Then live agent messages from backend.
  const agentDisplayMessages = agentMessages.map(m => ({
    id: `agent-${m.id}`,
    senderType: m.sender_type,
    senderLabel: m.sender_agent,
    text: m.message,
    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAgent: true
  }));

  return (
    <div className="dashboard-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Agent Chat</h1>
          <p>Live delegation conversation between PM Agent and specialist agents.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAnalyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600' }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Agents are working...
            </div>
          )}
          <button onClick={() => navigate('/incoming-requests')} className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <Inbox size={16} /> View Requests
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', marginTop: '1.5rem', overflow: 'hidden' }}>

        {/* Chat History */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!projectId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <p>Select a project from the Project Requests tab to view the agent chat.</p>
            </div>
          ) : (
            <>
              {/* Static: Client Summary + PM Ack */}
              {staticMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '1rem', flexDirection: msg.sender === 'agent' ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: msg.sender === 'agent' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}>
                    {msg.sender === 'agent' ? '🧑‍💼' : '🤝'}
                  </div>
                  <div style={{
                    background: msg.sender === 'agent' ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.04)',
                    border: msg.sender === 'agent' ? '1px solid rgba(79,70,229,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    padding: '1rem', borderRadius: msg.sender === 'agent' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {msg.sender === 'agent' ? '🧑‍💼 PM Agent' : '🤝 Client Agent'}
                    </div>
                    <pre style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.text}
                    </pre>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block', textAlign: msg.sender === 'agent' ? 'right' : 'left' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Live: Agent delegation messages from DB */}
              {agentDisplayMessages.map(msg => {
                const meta = AGENT_META[msg.senderType] || AGENT_META.pm;
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: meta.color, border: `1px solid ${meta.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}>
                      {meta.emoji}
                    </div>
                    <div style={{
                      background: meta.color,
                      border: `1px solid ${meta.border}`,
                      padding: '1rem',
                      borderRadius: '0 12px 12px 12px',
                      maxWidth: '85%'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {meta.emoji} {msg.senderLabel}
                      </div>
                      <pre style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                        {msg.text}
                      </pre>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator while agents are working */}
              {isAnalyzing && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    🤖
                  </div>
                  <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', padding: '1rem', borderRadius: '0 12px 12px 12px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></div>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}></div>
                    <div style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}></div>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Agent is working...</span>
                  </div>
                </div>
              )}

              {staticMessages.length === 0 && agentDisplayMessages.length === 0 && !isAnalyzing && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <p>No messages yet. Click "Assign to AI" on the project to start the agent delegation.</p>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder={projectId ? "Add a note or question..." : "Select a request first..."}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ flex: 1 }}
              disabled={!projectId}
            />
            <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={!projectId || !inputValue.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
      `}</style>
    </div>
  );
}
