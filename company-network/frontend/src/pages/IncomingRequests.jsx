import React, { useState, useEffect } from 'react';
import { User, Calendar, Briefcase, ChevronRight, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/gateway/incoming-requests', {
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
      const response = await fetch(`http://localhost:8000/api/gateway/incoming-requests/${projectId}/assign-ai`, {
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
  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>Incoming Requests</h1>
        <p>Review new project requests from clients and assign them to the AI analysis pipeline.</p>
      </div>

      <div className="request-list">
        {loading ? (
          <p>Loading incoming requests...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        ) : requests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No incoming requests yet.</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="request-card glass-panel">
              <div className="request-card-header">
                <div className="request-title-group">
                  <h3>{request.name}</h3>
                  <span className={`status-badge ${request.agent_status === 'PENDING_ANALYSIS' ? 'badge-blue' : 'badge-orange'}`}>
                    {request.agent_status}
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
                  className="btn-primary" 
                  onClick={() => handleAssignToAI(request.id)}
                  disabled={request.agent_status !== 'PENDING_ANALYSIS'}
                >
                  <Play size={16} /> {request.agent_status === 'PENDING_ANALYSIS' ? 'Assign to AI' : 'Processing...'}
                </button>
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
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                className="btn-primary"
                onClick={() => handleAssignToAI(selectedRequest.id)}
                disabled={selectedRequest.agent_status !== 'PENDING_ANALYSIS'}
              >
                <Play size={16} /> {selectedRequest.agent_status === 'PENDING_ANALYSIS' ? 'Assign to AI' : 'Processing...'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
