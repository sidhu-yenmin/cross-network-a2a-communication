import React from 'react';
import { User, Calendar, Briefcase, ChevronRight, Play } from 'lucide-react';

const DUMMY_REQUESTS = [
  {
    id: 'req-001',
    clientName: 'MediCorp Health',
    projectName: 'Healthcare Platform',
    summary: 'A comprehensive patient management system with secure authentication, appointment scheduling, and telemedicine integration.',
    timeline: '6 Months',
    status: 'New'
  },
  {
    id: 'req-002',
    clientName: 'Fintech Solutions',
    projectName: 'Mobile Banking App',
    summary: 'A secure mobile application for personal finance management, integrating with existing core banking systems.',
    timeline: '9 Months',
    status: 'Reviewing'
  },
  {
    id: 'req-003',
    clientName: 'EduTech Innovators',
    projectName: 'Learning Management System',
    summary: 'A scalable LMS for K-12 students featuring video streaming, interactive quizzes, and progress tracking.',
    timeline: '4 Months',
    status: 'New'
  }
];

export default function IncomingRequests() {
  return (
    <div className="page-view animate-fade-in">
      <div className="page-header">
        <h1>Incoming Requests</h1>
        <p>Review new project requests from clients and assign them to the AI analysis pipeline.</p>
      </div>

      <div className="request-list">
        {DUMMY_REQUESTS.map((request) => (
          <div key={request.id} className="request-card glass-panel">
            <div className="request-card-header">
              <div className="request-title-group">
                <h3>{request.projectName}</h3>
                <span className={`status-badge ${request.status === 'New' ? 'badge-blue' : 'badge-orange'}`}>
                  {request.status}
                </span>
              </div>
              <div className="request-meta">
                <span className="meta-item"><User size={16} /> {request.clientName}</span>
                <span className="meta-item"><Calendar size={16} /> {request.timeline}</span>
              </div>
            </div>
            
            <div className="request-card-body">
              <div className="summary-section">
                <Briefcase size={18} className="text-muted" />
                <p>{request.summary}</p>
              </div>
            </div>

            <div className="request-card-footer">
              <button className="btn-outline">
                Review Details <ChevronRight size={16} />
              </button>
              <button className="btn-primary">
                <Play size={16} /> Assign to AI
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
