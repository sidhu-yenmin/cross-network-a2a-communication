import React from 'react';
import { Send, Edit3, CheckCircle, Clock, Server, Briefcase, FileText } from 'lucide-react';

const DUMMY_PROPOSAL = {
  projectName: 'Healthcare Platform',
  clientName: 'MediCorp Health',
  costEstimate: '₹18,50,000',
  timeline: '5 Months',
  teamSize: '6 Members',
  architecture: 'Microservices (Dockerized)',
  backend: 'Python / FastAPI',
  database: 'PostgreSQL (Primary) + Redis (Cache)',
  risks: [
    'Third-party video conferencing API latency.',
    'Strict HIPAA compliance auditing timeline.'
  ]
};

export default function ProposalApproval() {
  return (
    <div className="page-view animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1>Proposal Approval</h1>
          <p>Review the final AI-generated proposal before sending to the client.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline text-gray-700 border-gray-300">
            <Edit3 size={16} /> Modify
          </button>
          <button className="btn-outline border-blue-200 text-blue-700 bg-blue-50">
            <CheckCircle size={16} /> Approve internally
          </button>
          <button className="btn-primary">
            <Send size={16} /> Send to Client
          </button>
        </div>
      </div>

      <div className="proposal-document glass-panel p-10 bg-white">
        <div className="text-center mb-10 pb-8 border-b border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{DUMMY_PROPOSAL.projectName}</h2>
          <p className="text-lg text-gray-500">Prepared for: {DUMMY_PROPOSAL.clientName}</p>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-indigo-700">
              <Briefcase size={20} /> Project Estimates
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Total Cost</span>
                <span className="font-bold text-gray-900">{DUMMY_PROPOSAL.costEstimate}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Estimated Timeline</span>
                <span className="font-bold text-gray-900">{DUMMY_PROPOSAL.timeline}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Recommended Team</span>
                <span className="font-bold text-gray-900">{DUMMY_PROPOSAL.teamSize}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-indigo-700">
              <Server size={20} /> Technical Architecture
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Architecture</span>
                <span className="font-medium text-gray-900">{DUMMY_PROPOSAL.architecture}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Backend System</span>
                <span className="font-medium text-gray-900">{DUMMY_PROPOSAL.backend}</span>
              </div>
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-600">Database</span>
                <span className="font-medium text-gray-900">{DUMMY_PROPOSAL.database}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-red-600">
            <FileText size={20} /> Identified Risks & Assumptions
          </h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            {DUMMY_PROPOSAL.risks.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
