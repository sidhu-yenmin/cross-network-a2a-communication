import React, { useState, useEffect } from 'react';
import { Send, Edit3, CheckCircle, Server, Briefcase, FileText, ChevronDown, FolderOpen, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProposalAccordion = ({ project, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  
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
          <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Ready for Review</span>
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

              <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-indigo-700">
                    <Briefcase size={20} /> Project Estimates
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600">Total Cost</span>
                      {isEditing ? (
                        <input style={inputStyle} value={draft.cost} onChange={e => setDraft({...draft, cost: e.target.value})} />
                      ) : (
                        <span className="font-bold text-gray-900">{draft.cost}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600">Estimated Timeline</span>
                      {isEditing ? (
                        <input style={inputStyle} value={draft.timeline} onChange={e => setDraft({...draft, timeline: e.target.value})} />
                      ) : (
                        <span className="font-bold text-gray-900">{draft.timeline}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600">Recommended Team</span>
                      <span className="font-bold text-gray-900">{project.proposal_data.financial_estimate.team_composition.length} Members</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-indigo-700">
                    <Server size={20} /> Technical Architecture
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600 whitespace-nowrap mr-4">Architecture</span>
                      {isEditing ? (
                        <input style={inputStyle} value={draft.architecture} onChange={e => setDraft({...draft, architecture: e.target.value})} />
                      ) : (
                        <span className="font-medium text-gray-900 text-right">{draft.architecture}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600 whitespace-nowrap mr-4">Backend System</span>
                      {isEditing ? (
                        <input style={inputStyle} value={draft.backend} onChange={e => setDraft({...draft, backend: e.target.value})} />
                      ) : (
                        <span className="font-medium text-gray-900 text-right">{draft.backend}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600 whitespace-nowrap mr-4">Database</span>
                      {isEditing ? (
                        <input style={inputStyle} value={draft.database} onChange={e => setDraft({...draft, database: e.target.value})} />
                      ) : (
                        <span className="font-medium text-gray-900 text-right">{draft.database}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-red-600">
                  <FileText size={20} /> Identified Risks & Assumptions
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {project.proposal_data.risk_assessment.risks.map((risk, idx) => (
                    <li key={idx}><strong>{risk.description}</strong> - <em>Mitigation: {risk.mitigation}</em></li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-6">
                {isEditing ? (
                  <>
                    <button className="btn-outline text-gray-500 border-gray-300 w-full justify-center" onClick={handleCancel}>
                      <X size={16} /> Cancel
                    </button>
                    <button className="btn-primary bg-green-600 hover:bg-green-700 border-green-600 w-full justify-center" onClick={handleSave}>
                      <Save size={16} /> Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-outline w-full justify-center" 
                      onClick={() => setIsEditing(true)}
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)', background: 'transparent' }}
                    >
                      <Edit3 size={16} /> Modify
                    </button>
                    <button 
                      className="btn-primary w-full justify-center"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                    >
                      <CheckCircle size={16} /> Approve Proposal
                    </button>
                  </>
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
