import React from 'react';
import { FileText, CheckSquare, List, AlertTriangle } from 'lucide-react';

const DUMMY_ANALYSIS = {
  projectName: 'Healthcare Platform',
  clientName: 'MediCorp Health',
  aiSummary: 'The client requires a secure patient management system. It must handle PHI (Protected Health Information) compliantly, support appointment scheduling, and include a telemedicine video portal. High availability is critical.',
  functionalReqs: [
    'User authentication and role-based access control (RBAC)',
    'Patient profile creation and management',
    'Interactive calendar for appointment booking',
    'Secure video conferencing integration',
    'Electronic health records (EHR) viewing'
  ],
  nonFunctionalReqs: [
    'HIPAA compliance for data storage and transmission',
    '99.9% uptime SLA',
    'End-to-end encryption for video streams',
    'Response time under 200ms for API calls'
  ],
  missingInfo: [
    'Expected concurrent user load is not specified.',
    'Preferred third-party video conferencing provider (if any) is unclear.',
    'Existing EHR system details for integration are missing.'
  ]
};

export default function RequirementAnalysis() {
  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>Requirement Analysis</h1>
        <p>Review the structured software requirements parsed by the Business Analyst Agent.</p>
      </div>

      <div className="analysis-container">
        <div className="analysis-sidebar">
          <div className="glass-panel p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">{DUMMY_ANALYSIS.projectName}</h3>
            <p className="text-muted text-sm mb-4">Client: {DUMMY_ANALYSIS.clientName}</p>
            
            <div className="ai-summary-box bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
                <FileText size={18} />
                <span>AI Summary</span>
              </div>
              <p className="text-sm text-purple-900 leading-relaxed">
                {DUMMY_ANALYSIS.aiSummary}
              </p>
            </div>
          </div>
          
          <div className="glass-panel p-6 border-red-100 bg-red-50">
             <div className="flex items-center gap-2 text-red-700 font-medium mb-4">
                <AlertTriangle size={18} />
                <span>Missing Information</span>
              </div>
              <ul className="space-y-3">
                {DUMMY_ANALYSIS.missingInfo.map((info, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="mt-1 text-red-500">•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
              <button className="btn-outline w-full mt-4 border-red-200 text-red-700 hover:bg-red-100">
                Generate Clarification Questions
              </button>
          </div>
        </div>

        <div className="analysis-main">
          <div className="glass-panel p-8 mb-6">
            <div className="flex items-center gap-2 font-semibold text-lg mb-6 pb-4 border-b border-gray-100">
              <CheckSquare size={20} className="text-blue-500" />
              <h2>Functional Requirements</h2>
            </div>
            <ul className="req-list">
              {DUMMY_ANALYSIS.functionalReqs.map((req, idx) => (
                <li key={idx} className="req-item">
                  <div className="req-number">{idx + 1}</div>
                  <div className="req-text">{req}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel p-8">
            <div className="flex items-center gap-2 font-semibold text-lg mb-6 pb-4 border-b border-gray-100">
              <List size={20} className="text-orange-500" />
              <h2>Non-Functional Requirements</h2>
            </div>
            <ul className="req-list">
              {DUMMY_ANALYSIS.nonFunctionalReqs.map((req, idx) => (
                <li key={idx} className="req-item">
                  <div className="req-number orange">{idx + 1}</div>
                  <div className="req-text">{req}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
