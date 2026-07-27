import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Briefcase, Clock, CheckCircle } from 'lucide-react';

export default function Projects() {
  const { token } = useAuth();
  if (!token) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <div className="dashboard-header flex-between">
          <div>
            <h1>Active Projects</h1>
            <p>Track the status of your requirements and ongoing work.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }}>
            + New Request
          </button>
        </div>

        <div className="glass-container dashboard-card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Project Name</th>
                <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Last Updated</th>
                <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.5rem' }}>E-Commerce Platform Redesign</td>
                <td style={{ padding: '1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '999px', fontSize: '0.875rem' }}>
                    <Clock size={14} /> Pending Analysis
                  </span>
                </td>
                <td style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Today, 10:42 AM</td>
                <td style={{ padding: '1.5rem' }}><a href="#">View Details</a></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.5rem' }}>CRM Integration API</td>
                <td style={{ padding: '1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '999px', fontSize: '0.875rem' }}>
                    <Briefcase size={14} /> Negotiating
                  </span>
                </td>
                <td style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Yesterday, 4:15 PM</td>
                <td style={{ padding: '1.5rem' }}><a href="#">View Details</a></td>
              </tr>
              <tr>
                <td style={{ padding: '1.5rem' }}>Mobile App Prototype</td>
                <td style={{ padding: '1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '999px', fontSize: '0.875rem' }}>
                    <CheckCircle size={14} /> Approved
                  </span>
                </td>
                <td style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>Jul 12, 2026</td>
                <td style={{ padding: '1.5rem' }}><a href="#">View Details</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
