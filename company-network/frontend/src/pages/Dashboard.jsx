import React from 'react';
import { 
  Inbox, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h1>Overview</h1>
        <p>Monitor your company network activity and AI agent statuses.</p>
      </div>

      <div className="dashboard-grid">
        <div 
          className="dashboard-card glass-panel stat-card"
          onClick={() => navigate('/incoming-requests')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-icon-wrapper blue">
            <Inbox size={24} />
          </div>
          <div className="stat-content">
            <h3>Project Requests</h3>
            <p className="stat-value">3</p>
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
            <p className="stat-value">2</p>
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
            <p className="stat-value">1</p>
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
            <p className="stat-value">12</p>
            <span className="stat-label">Historically Approved</span>
          </div>
          <ArrowRight className="stat-action" size={20} />
        </div>
      </div>
      
      <div className="recent-activity glass-panel mt-8">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-indicator blue"></div>
            <p><strong>Client Agent</strong> sent a new project request: <em>Healthcare Platform</em></p>
            <span className="activity-time">2 mins ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-indicator purple"></div>
            <p><strong>Technical Agent</strong> completed architecture analysis for <em>E-Commerce App</em></p>
            <span className="activity-time">1 hour ago</span>
          </div>
          <div className="activity-item">
            <div className="activity-indicator green"></div>
            <p><strong>Manager</strong> approved proposal for <em>Finance Dashboard</em></p>
            <span className="activity-time">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
