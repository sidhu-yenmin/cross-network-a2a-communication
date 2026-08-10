import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:8002/api/gateway/incoming-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch requests", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProjects();
  }, [token]);

  // Derived counts
  const pendingAnalysis = projects.filter(p => p.agent_status === 'PENDING_ANALYSIS').length;
  const analyzing = projects.filter(p => p.agent_status === 'ANALYZING' || p.agent_status === 'PAUSED').length;
  const pendingApproval = projects.filter(p => p.agent_status === 'PENDING_MANAGEMENT_APPROVAL').length;
  const approved = projects.filter(p => p.agent_status === 'APPROVED' || p.agent_status === 'PROPOSAL_GENERATED').length;

  // Generate dynamic recent activity
  const recentActivity = projects.slice(0, 3).map(p => {
    let text = "";
    let colorClass = "blue";
    if (p.agent_status === 'APPROVED') {
      text = `Management approved proposal for "${p.name}"`;
      colorClass = "green";
    } else if (p.agent_status === 'REJECTED') {
      text = `Management rejected proposal for "${p.name}"`;
      colorClass = "red";
    } else if (p.agent_status === 'PENDING_MANAGEMENT_APPROVAL') {
      text = `Client approved estimation for "${p.name}". Awaiting PM manual approval.`;
      colorClass = "orange";
    } else if (p.agent_status === 'ANALYZING') {
      text = `Specialist agents are working on project: "${p.name}"`;
      colorClass = "purple";
    } else {
      text = `Received new project request from Client Agent: "${p.name}"`;
      colorClass = "blue";
    }
    return {
      id: p.id,
      text,
      time: new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      colorClass
    };
  });

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h1>Overview</h1>
        <p>Monitor your company network activity and AI agent statuses.</p>
      </div>

      {loading ? (
        <p style={{ marginTop: '2rem' }}>Loading dashboard data...</p>
      ) : (
        <>
          <div className="dashboard-grid">
            <div 
              className="dashboard-card glass-panel stat-card"
              onClick={() => navigate('/incoming-requests', { state: { defaultTab: 'All' } })}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="stat-icon-wrapper blue">
                <Inbox size={24} />
              </div>
              <div className="stat-content">
                <h3>Project Requests</h3>
                <p className="stat-value">{pendingAnalysis}</p>
                <span className="stat-label">Awaiting Assignment</span>
              </div>
              <ArrowRight className="stat-action" size={20} />
            </div>
            
            <div 
              className="dashboard-card glass-panel stat-card"
              onClick={() => navigate('/incoming-requests', { state: { defaultTab: 'Analyse' } })}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="stat-icon-wrapper purple">
                <Activity size={24} />
              </div>
              <div className="stat-content">
                <h3>Active Analysis</h3>
                <p className="stat-value">{analyzing}</p>
                <span className="stat-label">Agents Processing</span>
              </div>
              <ArrowRight className="stat-action" size={20} />
            </div>

            <div 
              className="dashboard-card glass-panel stat-card"
              onClick={() => navigate('/incoming-requests', { state: { defaultTab: 'Pending' } })}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="stat-icon-wrapper orange">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h3>Pending Approvals</h3>
                <p className="stat-value">{pendingApproval}</p>
                <span className="stat-label">Requires Review</span>
              </div>
              <ArrowRight className="stat-action" size={20} />
            </div>

            <div 
              className="dashboard-card glass-panel stat-card"
              onClick={() => navigate('/incoming-requests', { state: { defaultTab: 'Approved' } })}
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="stat-icon-wrapper green">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <h3>Completed Proposals</h3>
                <p className="stat-value">{approved}</p>
                <span className="stat-label">Historically Approved</span>
              </div>
              <ArrowRight className="stat-action" size={20} />
            </div>
          </div>
          
          <div className="recent-activity glass-panel mt-8">
            <h3>Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No activity logged yet.</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map(act => (
                  <div key={act.id} className="activity-item">
                    <div className={`activity-indicator ${act.colorClass}`}></div>
                    <p>{act.text}</p>
                    <span className="activity-time">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
