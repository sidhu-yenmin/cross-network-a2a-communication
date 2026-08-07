import React, { useState, useEffect } from 'react';
import { Send, Edit3, CheckCircle, Server, Briefcase, FileText, ChevronDown, FolderOpen, Save, X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProposalAccordion = ({ project, defaultOpen = false }) => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(project.agent_status);
  
  // Local state for edits
  const [draft, setDraft] = useState({
    cost: project.proposal_data?.financial_estimate?.estimated_cost || '',
    timeline: project.proposal_data?.delivery_schedule?.duration || '',
    architecture: project.proposal_data?.technical_design?.architecture || '',
    backend: project.proposal_data?.technical_design?.backend || '',
    database: project.proposal_data?.technical_design?.database || ''
  });

  const handleSave = () => {
    // In a fully integrated app, this would trigger an API call to save the edits.
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset draft to original
    setDraft({
      cost: project.proposal_data?.financial_estimate?.estimated_cost || '',
      timeline: project.proposal_data?.delivery_schedule?.duration || '',
      architecture: project.proposal_data?.technical_design?.architecture || '',
      backend: project.proposal_data?.technical_design?.backend || '',
      database: project.proposal_data?.technical_design?.database || ''
    });
    setIsEditing(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid var(--primary)',
    background: 'rgba(79, 70, 229, 0.05)',
    fontWeight: '500',
    color: 'var(--text-main)',
    textAlign: 'right'
  };

  return (
    <div className="glass-panel mb-6 overflow-hidden" style={{ transition: 'all 0.3s' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isOpen ? 'rgba(79, 70, 229, 0.03)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <FolderOpen size={24} className="text-primary" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>{project.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Client ID: {project.client_project_id}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {status === 'PENDING_MANAGEMENT_APPROVAL' && (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#ea580c', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Pending PM Approval</span>
          )}
          {status === 'APPROVED' && (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Approved</span>
          )}
          {status === 'REJECTED' && (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Rejected</span>
          )}
          {status !== 'PENDING_MANAGEMENT_APPROVAL' && status !== 'APPROVED' && status !== 'REJECTED' && (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Ready for Review</span>
          )}
          <ChevronDown 
            size={24} 
            className="text-muted" 
            style={{ 
              transition: 'transform 0.3s ease', 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
            }} 
          />
        </div>
      </button>
      
      <div 
        style={{ 
          maxHeight: isOpen ? '3000px' : '0', 
          opacity: isOpen ? 1 : 0,
          transition: 'all 0.5s ease-in-out',
          overflow: 'hidden' 
        }}
      >
        <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.3)' }}>
          {project.proposal_data && (
            <div className="proposal-document glass-panel p-10 bg-white" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid var(--glass-border)' }}>
              <div className="text-center mb-10 pb-8 border-b border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h2>
                <p className="text-lg text-gray-500">Prepared for Client ID: {project.client_project_id}</p>
              </div>

              {/* Client Requirements Section */}
              <div className="mb-10 p-6 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                <h3 className="text-lg font-semibold mb-4 text-indigo-700 flex items-center gap-2" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <FileText size={20} /> Client Request Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Description:</strong>
                    <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.description}</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Target Platforms:</strong>
                      <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.target_platforms || 'N/A'}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Target Audience:</strong>
                      <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.target_audience || 'N/A'}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Expected Timeline:</strong>
                      <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.expected_timeline || 'N/A'}</p>
                    </div>
                    <div>
                      <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Budget Range:</strong>
                      <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.budget_range || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Key Features:</strong>
                    <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.key_features || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>Existing Systems:</strong>
                    <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{project.existing_systems || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '1.25rem', fontWeight: '700' }}>AI Requirement Analysis & Proposal</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Business Analysis</h4>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0.25rem 0' }}>Functional Requirements:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', marginBottom: '0.5rem', color: '#334155', listStyleType: 'disc' }}>
                      {project.proposal_data.business_analysis.functional_requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0.25rem 0' }}>Non-Functional Requirements:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#334155', listStyleType: 'disc' }}>
                      {project.proposal_data.business_analysis.non_functional_requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Technical Architecture</h4>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Approach:</strong> {project.proposal_data.technical_design.architecture}</p>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Frontend:</strong> {project.proposal_data.technical_design.frontend || 'React / Web'}</p>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Backend:</strong> {project.proposal_data.technical_design.backend}</p>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Database:</strong> {project.proposal_data.technical_design.database}</p>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Delivery Schedule</h4>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Duration:</strong> {project.proposal_data.delivery_schedule.duration}</p>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0.25rem 0' }}>Milestones:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#334155', listStyleType: 'disc' }}>
                      {project.proposal_data.delivery_schedule.milestones.map((m, i) => (
                        <li key={i} style={{ marginBottom: '0.4rem' }}>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Financial Estimate</h4>
                    <p style={{ margin: '0.4rem 0', color: '#334155' }}><strong>Estimated Cost:</strong> {project.proposal_data.financial_estimate.estimated_cost}</p>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0.25rem 0' }}>Team Composition:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#334155', listStyleType: 'disc' }}>
                      {project.proposal_data.financial_estimate.team_composition.map((role, i) => <li key={i}>{role}</li>)}
                    </ul>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b' }}>Risk Assessment</h4>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0.25rem 0' }}>Identified Risks:</p>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '0.95rem', color: '#334155', listStyleType: 'disc' }}>
                      {project.proposal_data.risk_assessment.risks.map((r, i) => (
                        <li key={i} style={{ marginBottom: '0.4rem' }}>
                          <strong>{r.description}</strong>: {r.mitigation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-6">
                {status === 'PENDING_MANAGEMENT_APPROVAL' ? (
                  <>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:8000/api/gateway/incoming-requests/${project.id}/management-approve`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            setStatus('APPROVED');
                          }
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                      className="btn-primary w-full justify-center"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                    >
                      <CheckCircle size={16} /> Approve Proposal
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:8000/api/gateway/incoming-requests/${project.id}/management-reject`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            setStatus('REJECTED');
                          }
                        } catch (e) {
                          alert(e.message);
                        }
                      }}
                      className="btn-danger w-full justify-center"
                      style={{ background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', fontWeight: '600' }}
                    >
                      <X size={16} /> Reject Proposal
                    </button>
                  </>
                ) : status === 'APPROVED' ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Officially Approved by Management
                  </div>
                ) : status === 'REJECTED' ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#dc2626', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <X size={18} /> Rejected by Management
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Awaiting client's review before final approval.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProposalApproval() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/gateway/incoming-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        
        // Filter out any projects that do not have proposal_data
        const generatedProposals = data.filter(p => p.proposal_data);
        setProjects(generatedProposals);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProjects();
  }, [token]);

  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>Proposal Approval</h1>
        <p>Review the final AI-generated proposals for all projects before sending them to the client.</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {loading ? (
          <p>Loading proposals...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted">No generated proposals found. Wait for the AI pipeline to finish analyzing incoming requests.</div>
        ) : (
          projects.map((project, index) => (
            <ProposalAccordion 
              key={project.id} 
              project={project} 
              defaultOpen={index === 0} 
            />
          ))
        )}
      </div>
    </div>
  );
}
