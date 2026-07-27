import React, { useState } from 'react';
import { Brain, Cpu, DollarSign, CalendarDays, AlertTriangle, Users, CheckCircle, Loader2 } from 'lucide-react';

const DUMMY_AGENTS = [
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
    reasoning: 'Extracted 5 functional and 4 non-functional requirements. Identified 3 missing constraints.',
    confidence: 95
  },
  {
    id: 'tech',
    name: 'Technical Agent',
    icon: Cpu,
    status: 'completed',
    color: 'indigo',
    reasoning: 'Recommended Microservices architecture with FastAPI backend and PostgreSQL database based on scalability needs.',
    confidence: 92
  },
  {
    id: 'cost',
    name: 'Cost Agent',
    icon: DollarSign,
    status: 'processing',
    color: 'green',
    reasoning: 'Calculating infrastructure costs for high-availability setup and estimating developer hours.',
    confidence: 85
  },
  {
    id: 'timeline',
    name: 'Timeline Agent',
    icon: CalendarDays,
    status: 'pending',
    color: 'orange',
    reasoning: 'Waiting for Cost Agent to finalize resource allocation before generating sprint plan.',
    confidence: null
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    icon: AlertTriangle,
    status: 'pending',
    color: 'red',
    reasoning: 'Awaiting technical architecture to assess security and dependency risks.',
    confidence: null
  }
];

export default function AIAnalysisConsole() {
  const [selectedAgent, setSelectedAgent] = useState(DUMMY_AGENTS[0]);

  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>AI Analysis Console</h1>
        <p>Live view of multi-agent collaboration and reasoning processes.</p>
      </div>

      <div className="analysis-console-layout">
        <div className="agent-list-panel glass-panel">
          <h3 className="panel-title mb-4">Active Agents</h3>
          <div className="agent-list">
            {DUMMY_AGENTS.map((agent) => {
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

        <div className="agent-detail-panel glass-panel">
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
                    {selectedAgent.id === 'tech' && <div className="artifact-pill">architecture_diagram.mmd</div>}
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
  );
}
