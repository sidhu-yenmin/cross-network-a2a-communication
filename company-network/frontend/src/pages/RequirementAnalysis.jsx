import React, { useState, useEffect } from 'react';
import { FileText, CheckSquare, List, AlertTriangle, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProjectAccordion = ({ project, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
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
          {project.proposal_data ? (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>✓ Analyzed</span>
          ) : (
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>Pending</span>
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
          {!project.proposal_data ? (
            <div className="text-center py-8">
              <div style={{ display: 'inline-block', padding: '1.5rem', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                <AlertTriangle size={32} style={{ color: '#ea580c' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Analysis Pending</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                The AI agents have not yet analyzed this project. Please navigate to the Incoming Requests dashboard and assign it to the AI pipeline.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Left Column: Summary & Risks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f5f3ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ede9fe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6d28d9', fontWeight: '600', marginBottom: '1rem' }}>
                    <FileText size={18} />
                    <span>AI Summary</span>
                  </div>
                  <p style={{ color: '#4c1d95', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {project.description}
                  </p>
                </div>
                
                <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontWeight: '600', marginBottom: '1rem' }}>
                    <AlertTriangle size={18} />
                    <span>Missing Information & Risks</span>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: 0, padding: 0, listStyle: 'none' }}>
                    {project.proposal_data.risk_assessment.risks.map((risk, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: '0.5rem', color: '#991b1b', fontSize: '0.9rem' }}>
                        <span style={{ color: '#ef4444' }}>•</span>
                        <span><strong>{risk.description}</strong><br/><span style={{ opacity: 0.8 }}>{risk.mitigation}</span></span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn-outline" style={{ width: '100%', marginTop: '1.5rem', borderColor: '#fca5a5', color: '#b91c1c', background: 'transparent' }}>
                    Generate Clarification Questions
                  </button>
                </div>
              </div>
              
              {/* Right Column: Requirements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', fontSize: '1.1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <CheckSquare size={22} className="text-primary" />
                    <h2>Functional Requirements</h2>
                  </div>
                  <ul className="req-list" style={{ marginTop: 0 }}>
                    {project.proposal_data.business_analysis.functional_requirements.map((req, idx) => (
                      <li key={idx} className="req-item" style={{ padding: '0.75rem 0' }}>
                        <div className="req-number">{idx + 1}</div>
                        <div className="req-text" style={{ fontSize: '0.95rem' }}>{req}</div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', fontSize: '1.1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <List size={22} style={{ color: '#f97316' }} />
                    <h2>Non-Functional Requirements</h2>
                  </div>
                  <ul className="req-list" style={{ marginTop: 0 }}>
                    {project.proposal_data.business_analysis.non_functional_requirements.map((req, idx) => (
                      <li key={idx} className="req-item" style={{ padding: '0.75rem 0' }}>
                        <div className="req-number orange">{idx + 1}</div>
                        <div className="req-text" style={{ fontSize: '0.95rem' }}>{req}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RequirementAnalysis() {
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
        // Filter out any projects that do not have proposal_data (pending projects)
        const analyzedProjects = data.filter(p => p.proposal_data);
        setProjects(analyzedProjects);
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
        <h1>Requirement Analysis</h1>
        <p>Review the structured software requirements parsed by the Business Analyst Agent for all incoming projects.</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {loading ? (
          <p>Loading projects...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted">No analyzed projects found. Assign AI to incoming requests first!</div>
        ) : (
          projects.map((project, index) => (
            <ProjectAccordion 
              key={project.id} 
              project={project} 
              defaultOpen={index === 0 && project.proposal_data != null} 
            />
          ))
        )}
      </div>
    </div>
  );
}
