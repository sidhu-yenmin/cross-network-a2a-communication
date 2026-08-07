import React, { useState, useEffect } from 'react';
import { Search, Filter, FileCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProposalHistory() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/gateway/incoming-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // We display projects that have proposal_data generated
          setProjects(data.filter(p => p.proposal_data));
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchHistory();
  }, [token]);

  const filteredHistory = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.client_project_id).includes(searchQuery)
  );

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
            <input 
              type="text" 
              placeholder="Search proposals..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="py-2 pl-10 pr-4 rounded-lg border border-gray-200" 
            />
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <p style={{ padding: '2rem' }}>Loading proposal history...</p>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No proposal history records found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Client ID</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Date Sent</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHistory.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded text-indigo-600">
                        <FileCheck size={18} />
                      </div>
                      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {prop.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{prop.client_project_id}</td>
                  <td className="py-4 px-6 text-gray-500">{new Date(prop.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6 font-medium text-gray-900">{prop.budget_range || 'N/A'}</td>
                  <td className="py-4 px-6">
                    {prop.agent_status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 size={14} /> Approved
                      </span>
                    )}
                    {prop.agent_status === 'PENDING_MANAGEMENT_APPROVAL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={14} /> Pending PM Approval
                      </span>
                    )}
                    {prop.agent_status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={14} /> Rejected
                      </span>
                    )}
                    {prop.agent_status !== 'APPROVED' && prop.agent_status !== 'PENDING_MANAGEMENT_APPROVAL' && prop.agent_status !== 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock size={14} /> Processing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
