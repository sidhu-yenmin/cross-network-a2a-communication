import React, { useState, useEffect } from 'react';
import { Brain, Cpu, DollarSign, CalendarDays, AlertTriangle, Users, CheckCircle, Loader2, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const getAgentData = (projectStatus) => {
  // If proposal generated, all are completed. If analyzing, simulate an active queue.
  const isCompleted = projectStatus === 'PROPOSAL_GENERATED';
  
  return [
    {
      id: 'pm',
      name: 'Project Manager Agent',
      icon: Users,
      status: 'completed',
      color: 'blue',
      reasoning: 'Analyzed requirements. Orchestrating sub-agents for specialized analysis.',
      confidence: 98
    },
    {
      id: 'ba',
      name: 'Business Analyst Agent',
      icon: Brain,
      status: 'completed',
      color: 'purple',
      reasoning: 'Extracted functional and non-functional requirements. Identified missing constraints.',
      confidence: 95
    },
    {
      id: 'tech',
      name: 'Technical Agent',
      icon: Cpu,
      status: isCompleted ? 'completed' : 'processing',
      color: 'indigo',
      reasoning: isCompleted ? 'Recommended Microservices architecture with FastAPI backend and PostgreSQL database based on scalability needs.' : 'Evaluating optimal backend architecture for scale...',
      confidence: isCompleted ? 92 : 88
    },
    {
      id: 'cost',
      name: 'Cost Agent',
      icon: DollarSign,
      status: isCompleted ? 'completed' : 'pending',
      color: 'green',
      reasoning: isCompleted ? 'Calculated infrastructure costs for high-availability setup and estimated developer hours.' : 'Waiting for technical architecture to finalize.',
      confidence: isCompleted ? 85 : null
    },
    {
      id: 'timeline',
      name: 'Timeline Agent',
      icon: CalendarDays,
      status: isCompleted ? 'completed' : 'pending',
      color: 'orange',
      reasoning: isCompleted ? 'Generated sprint plan and milestone schedule mapping to resource allocations.' : 'Waiting for Cost Agent to finalize resource allocation.',
      confidence: isCompleted ? 90 : null
    },
    {
      id: 'risk',
      name: 'Risk Agent',
      icon: AlertTriangle,
      status: isCompleted ? 'completed' : 'pending',
      color: 'red',
      reasoning: isCompleted ? 'Assessed security and dependency risks related to architecture and timeline constraints.' : 'Awaiting technical architecture.',
      confidence: isCompleted ? 88 : null
    }
  ];
};

const ProjectConsoleAccordion = ({ project, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const agentData = getAgentData(project.agent_status);
  const [selectedAgent, setSelectedAgent] = useState(agentData[0]);
  
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
          {project.agent_status === 'ANALYZING' ? (
             <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Loader2 size={14} className="animate-spin" /> Analyzing
             </span>
          ) : (
             <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '500' }}>
               ✓ Pipeline Completed
             </span>
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
          {/* Internal Console UI mapped directly to this specific project */}
          <div className="analysis-console-layout" style={{ margin: 0 }}>
            <div className="agent-list-panel glass-panel" style={{ background: 'white' }}>
              <h3 className="panel-title mb-4">Active Agents</h3>
              <div className="agent-list">
                {agentData.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = selectedAgent.id === agent.id;
                  
                  return (
                    <div 
                      key={agent.id} 
                      className={`agent-list-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className={`agent-icon-bg ${agent.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="agent-info">
                        <h4>{agent.name}</h4>
                        <span className={`agent-status ${agent.status}`}>
                          {agent.status === 'processing' && <Loader2 size={12} className="animate-spin inline mr-1" />}
                          {agent.status === 'completed' && <CheckCircle size={12} className="inline mr-1" />}
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="agent-detail-panel glass-panel" style={{ background: 'white' }}>
              {selectedAgent && (
                <div className="detail-content animate-fade-in">
                  <div className="detail-header mb-6 pb-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`agent-icon-bg large ${selectedAgent.color}`}>
                        <selectedAgent.icon size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                        <p className="text-muted">Agent ID: {selectedAgent.id}-agent</p>
                      </div>
                    </div>
                    {selectedAgent.confidence && (
                      <div className="confidence-gauge">
                        <span className="text-2xl font-bold text-gray-800">{selectedAgent.confidence}%</span>
                        <span className="text-xs text-muted uppercase tracking-wider">Confidence</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-section mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Current Reasoning</h3>
                    <div className="reasoning-box bg-gray-50 p-5 rounded-xl border border-gray-100 font-mono text-sm leading-relaxed text-gray-700">
                      {selectedAgent.reasoning}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Generated Artifacts</h3>
                    {selectedAgent.status === 'completed' ? (
                      <div className="artifacts-list flex gap-3">
                        <div className="artifact-pill">analysis_report.json</div>
                        {(selectedAgent.id === 'tech' || selectedAgent.id === 'pm') && <div className="artifact-pill">architecture_diagram.mmd</div>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No artifacts generated yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AIAnalysisConsole() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:8002/api/gateway/incoming-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        
        // Filter out any projects that are merely pending analysis
        const activeOrCompletedProjects = data.filter(p => p.agent_status === 'ANALYZING' || p.agent_status === 'PROPOSAL_GENERATED');
        setProjects(activeOrCompletedProjects);
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
        <h1>AI Analysis Console</h1>
        <p>Live view of multi-agent collaboration and reasoning processes across all active projects.</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {loading ? (
          <p>Loading active agent pipelines...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted">No active agent pipelines found. Start an analysis from the Project Requests dashboard.</div>
        ) : (
          projects.map((project, index) => (
            <ProjectConsoleAccordion 
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
