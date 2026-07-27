import React from 'react';
import { Search, Filter, FileCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';

const DUMMY_HISTORY = [
  {
    id: 'prop-012',
    projectName: 'E-Commerce Platform',
    clientName: 'Retail Giant Co',
    date: 'Oct 12, 2023',
    value: '₹22,00,000',
    status: 'Approved',
    feedback: 'Excellent breakdown of the cloud infrastructure.'
  },
  {
    id: 'prop-011',
    projectName: 'Logistics Tracker',
    clientName: 'FastShip Inc',
    date: 'Sep 28, 2023',
    value: '₹14,50,000',
    status: 'Pending Client',
    feedback: 'Client requested review of milestone 2 timeline.'
  },
  {
    id: 'prop-010',
    projectName: 'Internal HR Portal',
    clientName: 'TechCorp',
    date: 'Sep 15, 2023',
    value: '₹8,00,000',
    status: 'Rejected',
    feedback: 'Budget exceeded client limits by 20%.'
  },
  {
    id: 'prop-009',
    projectName: 'Data Analytics Dashboard',
    clientName: 'FinSight',
    date: 'Aug 04, 2023',
    value: '₹35,00,000',
    status: 'Approved',
    feedback: 'Approved without changes.'
  }
];

export default function ProposalHistory() {
  return (
    <div className="page-view animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1>Proposal History</h1>
          <p>Historical log of all generated proposals and their client approval statuses.</p>
        </div>
        <div className="flex gap-3">
          <div className="input-wrapper">
            <Search className="input-icon" size={16} />
            <input type="text" placeholder="Search proposals..." className="py-2 pl-10 pr-4 rounded-lg border border-gray-200" />
          </div>
          <button className="btn-outline border-gray-200">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Date Sent</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {DUMMY_HISTORY.map((prop) => (
              <tr key={prop.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded text-indigo-600">
                      <FileCheck size={18} />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {prop.projectName}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-600">{prop.clientName}</td>
                <td className="py-4 px-6 text-gray-500">{prop.date}</td>
                <td className="py-4 px-6 font-medium text-gray-900">{prop.value}</td>
                <td className="py-4 px-6">
                  {prop.status === 'Approved' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 size={14} /> Approved
                    </span>
                  )}
                  {prop.status === 'Pending Client' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock size={14} /> Pending Client
                    </span>
                  )}
                  {prop.status === 'Rejected' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle size={14} /> Rejected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
