import React, { useState, useEffect } from 'react';
import { User, Calendar, Briefcase, ChevronRight, Play, Pause, RotateCcw, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function IncomingRequests() {
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(location.state?.defaultTab || 'All');
  const { token } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:8002/api/gateway/incoming-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch requests');
        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRequests();
  }, [token]);

  const handleAssignToAI = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${projectId}/assign-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to assign AI');
      }
      
      // Update local state to reflect ANALYZING
      setRequests(requests.map(req => 
        req.id === projectId ? { ...req, agent_status: 'ANALYZING' } : req
      ));
      
      if (selectedRequest && selectedRequest.id === projectId) {
        setSelectedRequest({ ...selectedRequest, agent_status: 'ANALYZING' });
      }
      
    } catch (err) {
      alert(`Error assigning AI: ${err.message}`);
    }
  };

  const handlePauseProject = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${projectId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to pause project');
      }

      // Update local state to reflect PAUSED
      setRequests(requests.map(req =>
        req.id === projectId ? { ...req, agent_status: 'PAUSED' } : req
      ));

      if (selectedRequest && selectedRequest.id === projectId) {
        setSelectedRequest({ ...selectedRequest, agent_status: 'PAUSED' });
      }

    } catch (err) {
      alert(`Error pausing project: ${err.message}`);
    }
  };

  const handleResumeProject = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${projectId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resume project');
      }

      // Update local state to reflect ANALYZING
      setRequests(requests.map(req =>
        req.id === projectId ? { ...req, agent_status: 'ANALYZING' } : req
      ));

      if (selectedRequest && selectedRequest.id === projectId) {
        setSelectedRequest({ ...selectedRequest, agent_status: 'ANALYZING' });
      }

    } catch (err) {
      alert(`Error resuming project: ${err.message}`);
    }
  };

  const handleApproveReproposal = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${projectId}/approve-reproposal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve re-proposal');
      }

      // Update local state to reflect ANALYZING
      setRequests(requests.map(req =>
        req.id === projectId ? { ...req, agent_status: 'ANALYZING' } : req
      ));

      if (selectedRequest && selectedRequest.id === projectId) {
        setSelectedRequest({ ...selectedRequest, agent_status: 'ANALYZING' });
      }
    } catch (err) {
      alert(`Error approving re-proposal: ${err.message}`);
    }
  };

  const handleRejectReproposal = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${projectId}/reject-reproposal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reject re-proposal');
      }

      // Update local state to reflect REJECTED
      setRequests(requests.map(req =>
        req.id === projectId ? { ...req, agent_status: 'REJECTED' } : req
      ));

      if (selectedRequest && selectedRequest.id === projectId) {
        setSelectedRequest({ ...selectedRequest, agent_status: 'REJECTED' });
      }
    } catch (err) {
      alert(`Error rejecting re-proposal: ${err.message}`);
    }
  };

  const handleOpenChat = (request) => {
    const existingMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
    const hasMessagesForProject = existingMessages.some(msg => msg.projectId === request.client_project_id);
    
    if (!hasMessagesForProject) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Client Agent sends a structured summary of all collected requirements
      const summaryLines = [
        `📋 Project Requirements Summary`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🔹 Project Name     : ${request.name || 'N/A'}`,
        `🔹 Description      : ${request.description || 'N/A'}`,
        `🔹 Target Platforms : ${request.target_platforms || 'N/A'}`,
        `🔹 Target Audience  : ${request.target_audience || 'N/A'}`,
        `🔹 Timeline         : ${request.expected_timeline || 'N/A'}`,
        `🔹 Budget Range     : ${request.budget_range || 'N/A'}`,
        `🔹 Key Features     : ${request.key_features || 'N/A'}`,
        `🔹 Existing Systems : ${request.existing_systems || 'N/A'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `✅ All requirements have been collected and verified with the client. Please review and proceed with the proposal.`
      ].join('\n');

      const clientSummaryMsg = {
        id: Date.now().toString(),
        projectId: request.client_project_id,
        sender: 'user', // Client Agent
        text: summaryLines,
        timestamp: now
      };

      // PM Agent acknowledges receipt
      const pmAcknowledgeMsg = {
        id: (Date.now() + 1).toString(),
        projectId: request.client_project_id,
        sender: 'agent', // PM Agent
        text: `✅ Requirements received for "${request.name}". I have reviewed all the collected details. The AI analysis pipeline has been triggered — our BA, Technical, Timeline, Cost, and Risk agents will now process this request and generate a full proposal shortly.`,
        timestamp: now
      };

      localStorage.setItem('chat_messages', JSON.stringify([...existingMessages, clientSummaryMsg, pmAcknowledgeMsg]));
    }
    
    navigate(`/messages?projectId=${request.client_project_id}`);
  };

  // Helper to get the status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING_ANALYSIS': return 'badge-blue';
      case 'ANALYZING': return 'badge-orange';
      case 'PAUSED': return 'badge-amber';
      case 'PROPOSAL_GENERATED': return 'badge-green';
      case 'REPROPOSAL_REQUESTED': return 'badge-orange';
      case 'PENDING_MANAGEMENT_APPROVAL': return 'badge-amber';
      case 'APPROVED': return 'badge-green';
      case 'REJECTED': return 'badge-red';
      default: return 'badge-orange';
    }
  };

  // Helper to get display label for status
  const getStatusLabel = (status) => {
    switch (status) {
      case 'PROPOSAL_GENERATED': return 'APPROVED';
      case 'PAUSED': return 'PAUSED';
      case 'REPROPOSAL_REQUESTED': return 'RE-PROPOSAL REQUESTED';
      case 'PENDING_MANAGEMENT_APPROVAL': return 'PENDING PM APPROVAL';
      case 'APPROVED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      default: return status;
    }
  };

  // Helper to render the action button based on status
  const renderActionButton = (request) => {
    switch (request.agent_status) {
      case 'PENDING_ANALYSIS':
        return (
          <button
            className="btn-primary"
            onClick={() => handleAssignToAI(request.id)}
          >
            <Play size={16} /> Assign to AI
          </button>
        );
      case 'REPROPOSAL_REQUESTED':
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn-success"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => handleApproveReproposal(request.id)}
            >
              Approve Re-proposal
            </button>
            <button
              className="btn-danger"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#ef4444', color: 'white', border: 'none' }}
              onClick={() => handleRejectReproposal(request.id)}
            >
              Reject Re-proposal
            </button>
          </div>
        );
      case 'PENDING_MANAGEMENT_APPROVAL':
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn-success"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${request.id}/management-approve`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    setRequests(requests.map(req => req.id === request.id ? { ...req, agent_status: 'APPROVED' } : req));
                  }
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              Approve
            </button>
            <button
              className="btn-danger"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#ef4444', color: 'white', border: 'none' }}
              onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:8002/api/gateway/incoming-requests/${request.id}/management-reject`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    setRequests(requests.map(req => req.id === request.id ? { ...req, agent_status: 'REJECTED' } : req));
                  }
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              Reject
            </button>
          </div>
        );
      case 'ANALYZING':
        return (
          <button
            className="btn-warning"
            onClick={() => handlePauseProject(request.id)}
          >
            <Pause size={16} /> Pause
          </button>
        );
      case 'PAUSED':
        return (
          <button
            className="btn-success"
            onClick={() => handleResumeProject(request.id)}
          >
            <RotateCcw size={16} /> Resume
          </button>
        );
      case 'APPROVED':
        return (
          <span style={{ color: 'var(--success-color)', fontWeight: '600', fontSize: '0.9rem' }}>Approved</span>
        );
      case 'REJECTED':
        return (
          <span style={{ color: 'var(--danger-color)', fontWeight: '600', fontSize: '0.9rem' }}>Rejected</span>
        );
      default:
        return (
          <button className="btn-primary" disabled>
            <Play size={16} /> Processing...
          </button>
        );
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(request.client_project_id).includes(searchQuery);
    
    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Analyse') return matchesSearch && (request.agent_status === 'ANALYZING' || request.agent_status === 'PAUSED');
    if (filterStatus === 'Pending') return matchesSearch && (request.agent_status === 'PENDING_ANALYSIS' || request.agent_status === 'PENDING_MANAGEMENT_APPROVAL');
    if (filterStatus === 'Paused') return matchesSearch && request.agent_status === 'PAUSED';
    if (filterStatus === 'Approved') return matchesSearch && (request.agent_status === 'PROPOSAL_GENERATED' || request.agent_status === 'APPROVED');
    if (filterStatus === 'Rejected') return matchesSearch && request.agent_status === 'REJECTED';
    
    return matchesSearch;
  });

  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>Project Requests</h1>
        <p>Review new project requests from clients and assign them to the AI analysis pipeline.</p>
      </div>

      <div className="filters-section">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search projects by name or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          <button className={`filter-tab ${filterStatus === 'All' ? 'active' : ''}`} onClick={() => setFilterStatus('All')}>All</button>
          <button className={`filter-tab ${filterStatus === 'Analyse' ? 'active' : ''}`} onClick={() => setFilterStatus('Analyse')}>Analyse</button>
          <button className={`filter-tab ${filterStatus === 'Pending' ? 'active' : ''}`} onClick={() => setFilterStatus('Pending')}>Pending</button>
          <button className={`filter-tab ${filterStatus === 'Paused' ? 'active' : ''}`} onClick={() => setFilterStatus('Paused')}>Paused</button>
          <button className={`filter-tab ${filterStatus === 'Approved' ? 'active' : ''}`} onClick={() => setFilterStatus('Approved')}>Approved</button>
          <button className={`filter-tab ${filterStatus === 'Rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('Rejected')}>Rejected</button>
        </div>
      </div>

      <div className="request-grid">
        {loading ? (
          <p>Loading incoming requests...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <p>No projects match your current filters.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="request-card glass-panel">
              <div className="request-card-header">
                <div className="request-title-group">
                  <h3>{request.name}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(request.agent_status)}`}>
                    {getStatusLabel(request.agent_status)}
                  </span>
                </div>
                <div className="request-meta">
                  <span className="meta-item"><User size={16} /> Client ID: {request.client_project_id}</span>
                  <span className="meta-item"><Calendar size={16} /> {request.expected_timeline}</span>
                </div>
              </div>
              
              <div className="request-card-body">
                <div className="summary-section">
                  <Briefcase size={18} className="text-muted" />
                  <p>{request.description}</p>
                </div>
              </div>

              <div className="request-card-footer">
                <button className="btn-outline" onClick={() => setSelectedRequest(request)}>
                  Review Details <ChevronRight size={16} />
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => handleOpenChat(request)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Chat
                </button>
                {renderActionButton(request)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Details Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-container dashboard-card" style={{ width: '100%', maxWidth: '600px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setSelectedRequest(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.5rem' }}>&times;</span>
            </button>
            
            <h2 style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>Request Details: {selectedRequest.name}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Description:</strong>
                <p>{selectedRequest.description}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Target Platforms:</strong>
                  <p>{selectedRequest.target_platforms}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Target Audience:</strong>
                  <p>{selectedRequest.target_audience}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Expected Timeline:</strong>
                  <p>{selectedRequest.expected_timeline}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Budget Range:</strong>
                  <p>{selectedRequest.budget_range}</p>
                </div>
              </div>
              
              <div>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Key Features:</strong>
                <p>{selectedRequest.key_features}</p>
              </div>
              
              <div>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Existing Systems:</strong>
                <p>{selectedRequest.existing_systems}</p>
              </div>
            </div>

            {selectedRequest.proposal_data && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>AI Requirement Analysis & Proposal</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Business Analysis</h4>
                    <p style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Functional Requirements:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                      {selectedRequest.proposal_data.business_analysis.functional_requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                    <p style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Non-Functional Requirements:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
                      {selectedRequest.proposal_data.business_analysis.non_functional_requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Technical Architecture</h4>
                    <p><strong>Approach:</strong> {selectedRequest.proposal_data.technical_design.architecture}</p>
                    <p><strong>Frontend:</strong> {selectedRequest.proposal_data.technical_design.frontend}</p>
                    <p><strong>Backend:</strong> {selectedRequest.proposal_data.technical_design.backend}</p>
                    <p><strong>Database:</strong> {selectedRequest.proposal_data.technical_design.database}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Timeline Estimate</h4>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Duration:</strong> {selectedRequest.proposal_data.delivery_schedule.duration}</p>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                        {selectedRequest.proposal_data.delivery_schedule.milestones.map((ms, i) => <li key={i}>{ms}</li>)}
                      </ul>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>Cost & Resources</h4>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Estimate:</strong> {selectedRequest.proposal_data.financial_estimate.estimated_cost}</p>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                        {selectedRequest.proposal_data.financial_estimate.team_composition.map((tc, i) => <li key={i}>{tc}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Risk Assessment</h4>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem' }}>
                      {selectedRequest.proposal_data.risk_assessment.risks.map((risk, i) => (
                        <li key={i}><strong>{risk.description}</strong> - <em>Mitigation: {risk.mitigation}</em></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                className="btn-outline" 
                onClick={() => handleOpenChat(selectedRequest)}
                style={{ marginRight: 'auto' }}
              >
                Open Chat
              </button>
              {renderActionButton(selectedRequest)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
