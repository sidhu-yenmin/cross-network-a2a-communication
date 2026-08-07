import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Briefcase, Clock, CheckCircle, Plus, X } from 'lucide-react';

export default function Projects() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ 
    id: null,
    name: '', 
    description: '',
    target_platforms: '',
    target_audience: '',
    expected_timeline: '',
    budget_range: '',
    key_features: '',
    existing_systems: ''
  });
  const [modalMode, setModalMode] = useState('create'); // 'create', 'view', or 'edit'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenCreateModal();
      // Remove 'new=true' from URL without refreshing so modal stays open but refresh doesn't trigger it again
      setSearchParams(params => {
        params.delete('new');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleOpenCreateModal = () => {
    setNewProject({ 
      id: null, name: '', description: '', target_platforms: '', target_audience: '',
      expected_timeline: '', budget_range: '', key_features: '', existing_systems: ''
    });
    setFieldErrors({});
    setError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleViewDetails = (project) => {
    setNewProject(project);
    setFieldErrors({});
    setError('');
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditDetails = (project) => {
    setNewProject(project);
    setFieldErrors({});
    setError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!newProject.name.trim()) errors.name = "Project name is required";
    if (!newProject.description.trim()) errors.description = "Description is required";
    if (!newProject.target_platforms.trim()) errors.target_platforms = "Target platforms are required";
    if (!newProject.target_audience.trim()) errors.target_audience = "Target audience is required";
    if (!newProject.expected_timeline.trim()) errors.expected_timeline = "Expected timeline is required";
    if (!newProject.budget_range.trim()) errors.budget_range = "Budget range is required";
    if (!newProject.key_features.trim()) errors.key_features = "Key features are required";
    if (!newProject.existing_systems.trim()) errors.existing_systems = "Existing systems are required";
    return errors;
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const isEdit = modalMode === 'edit';
      const url = isEdit 
        ? `http://localhost:8001/api/projects/${newProject.id}` 
        : 'http://localhost:8001/api/projects/';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = { ...newProject };
      delete payload.id; // API doesn't expect ID in the body

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(isEdit ? 'Failed to update project' : 'Failed to create project');
      }

      const savedProject = await response.json();
      await fetchProjects();
      setIsModalOpen(false);
      
      if (!isEdit) {
        // Construct auto message
        let userName = 'there';
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) userName = payload.sub.split('@')[0];
        } catch (e) {}

        const autoMsg = {
          id: Date.now().toString(),
          projectId: savedProject.id,
          sender: 'agent',
          text: `Hi ${userName}, I have received your project requirements for '${newProject.name}'. Shall I proceed and share this with the Manager Agent?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const existingMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
        localStorage.setItem('chat_messages', JSON.stringify([...existingMessages, autoMsg]));
        
        // Reset and navigate
        setNewProject({ 
          id: null, name: '', description: '', target_platforms: '', target_audience: '',
          expected_timeline: '', budget_range: '', key_features: '', existing_systems: ''
        });
        navigate(`/messages?projectId=${savedProject.id}`);
      } else {
        setNewProject({ 
          id: null, name: '', description: '', target_platforms: '', target_audience: '',
          expected_timeline: '', budget_range: '', key_features: '', existing_systems: ''
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null; // will redirect via useEffect

  const getStatusIcon = (status) => {
    switch (status) {
      case 'AWAITING_APPROVAL':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', borderRadius: '999px', fontSize: '0.875rem' }}><Clock size={14} /> AWAITING APPROVAL</span>;
      case 'PENDING_MANAGEMENT_APPROVAL':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#ea580c', borderRadius: '999px', fontSize: '0.875rem' }}><Clock size={14} /> PENDING PM APPROVAL</span>;
      case 'SUBMITTED':
      case 'PENDING ANALYSIS':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '999px', fontSize: '0.875rem' }}><Clock size={14} /> {status}</span>;
      case 'NEGOTIATING':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '999px', fontSize: '0.875rem' }}><Briefcase size={14} /> {status}</span>;
      case 'APPROVED':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '999px', fontSize: '0.875rem' }}><CheckCircle size={14} /> {status}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content" style={{ position: 'relative' }}>
        <div className="dashboard-header flex-between">
          <div>
            <h1>Active Projects</h1>
            <p>Track the status of your requirements and ongoing work.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/messages')}>
            <Plus size={18} /> New Request
          </button>
        </div>

        <div className="glass-container dashboard-card" style={{ padding: '0' }}>
          {projects.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>You don't have any active projects yet.</p>
              <button className="btn-primary" style={{ width: 'auto', margin: '1rem auto' }} onClick={handleOpenCreateModal}>
                Create your first project
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Project Name</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Created At</th>
                  <th style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1.5rem' }}>{project.name}</td>
                    <td style={{ padding: '1.5rem' }}>{getStatusIcon(project.status)}</td>
                    <td style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={() => handleViewDetails(project)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditDetails(project)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => navigate(`/messages?projectId=${project.id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Project Modal */}
        {isModalOpen && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}>
            <div className="glass-container dashboard-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              
              <h2 style={{ marginBottom: '1.5rem' }}>
                {modalMode === 'create' ? 'New Project Request' : modalMode === 'edit' ? 'Edit Project Request' : 'Project Details'}
              </h2>
              {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
              
              <form onSubmit={modalMode === 'view' ? (e) => e.preventDefault() : handleSubmitProject} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Project Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Healthcare Platform" 
                    value={newProject.name}
                    onChange={(e) => {
                      if (modalMode === 'view') return;
                      setNewProject({...newProject, name: e.target.value});
                      if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
                    }}
                    readOnly={modalMode === 'view'}
                    style={{ paddingLeft: '1rem', borderColor: fieldErrors.name ? 'var(--danger-color)' : '' }}
                  />
                  {fieldErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.name}</span>}
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description / Requirements</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Describe your business needs, goals, and initial requirements..."
                    value={newProject.description}
                    onChange={(e) => {
                      if (modalMode === 'view') return;
                      setNewProject({...newProject, description: e.target.value});
                      if (fieldErrors.description) setFieldErrors({...fieldErrors, description: null});
                    }}
                    rows={5}
                    readOnly={modalMode === 'view'}
                    style={{ paddingLeft: '1rem', resize: 'vertical', borderColor: fieldErrors.description ? 'var(--danger-color)' : '' }}
                  />
                  {fieldErrors.description && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.description}</span>}
                </div>

                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Platforms</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Web, iOS, Android" 
                      value={newProject.target_platforms || ''}
                      onChange={(e) => {
                        if (modalMode === 'view') return;
                        setNewProject({...newProject, target_platforms: e.target.value});
                        if (fieldErrors.target_platforms) setFieldErrors({...fieldErrors, target_platforms: null});
                      }}
                      readOnly={modalMode === 'view'}
                      style={{ paddingLeft: '1rem', borderColor: fieldErrors.target_platforms ? 'var(--danger-color)' : '' }}
                    />
                    {fieldErrors.target_platforms && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.target_platforms}</span>}
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Audience / Industry</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Healthcare professionals" 
                      value={newProject.target_audience || ''}
                      onChange={(e) => {
                        if (modalMode === 'view') return;
                        setNewProject({...newProject, target_audience: e.target.value});
                        if (fieldErrors.target_audience) setFieldErrors({...fieldErrors, target_audience: null});
                      }}
                      readOnly={modalMode === 'view'}
                      style={{ paddingLeft: '1rem', borderColor: fieldErrors.target_audience ? 'var(--danger-color)' : '' }}
                    />
                    {fieldErrors.target_audience && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.target_audience}</span>}
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expected Timeline</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 3 months" 
                      value={newProject.expected_timeline || ''}
                      onChange={(e) => {
                        if (modalMode === 'view') return;
                        setNewProject({...newProject, expected_timeline: e.target.value});
                        if (fieldErrors.expected_timeline) setFieldErrors({...fieldErrors, expected_timeline: null});
                      }}
                      readOnly={modalMode === 'view'}
                      style={{ paddingLeft: '1rem', borderColor: fieldErrors.expected_timeline ? 'var(--danger-color)' : '' }}
                    />
                    {fieldErrors.expected_timeline && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.expected_timeline}</span>}
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Budget Range</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. $10k-$50k" 
                      value={newProject.budget_range || ''}
                      onChange={(e) => {
                        if (modalMode === 'view') return;
                        setNewProject({...newProject, budget_range: e.target.value});
                        if (fieldErrors.budget_range) setFieldErrors({...fieldErrors, budget_range: null});
                      }}
                      readOnly={modalMode === 'view'}
                      style={{ paddingLeft: '1rem', borderColor: fieldErrors.budget_range ? 'var(--danger-color)' : '' }}
                    />
                    {fieldErrors.budget_range && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.budget_range}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Key Features</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Must-have features (e.g. Auth, Payment)"
                    value={newProject.key_features || ''}
                    onChange={(e) => {
                      if (modalMode === 'view') return;
                      setNewProject({...newProject, key_features: e.target.value});
                      if (fieldErrors.key_features) setFieldErrors({...fieldErrors, key_features: null});
                    }}
                    rows={3}
                    readOnly={modalMode === 'view'}
                    style={{ paddingLeft: '1rem', resize: 'vertical', borderColor: fieldErrors.key_features ? 'var(--danger-color)' : '' }}
                  />
                  {fieldErrors.key_features && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.key_features}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Existing Systems / Integrations</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Stripe, Salesforce, None" 
                    value={newProject.existing_systems || ''}
                    onChange={(e) => {
                      if (modalMode === 'view') return;
                      setNewProject({...newProject, existing_systems: e.target.value});
                      if (fieldErrors.existing_systems) setFieldErrors({...fieldErrors, existing_systems: null});
                    }}
                    readOnly={modalMode === 'view'}
                    style={{ paddingLeft: '1rem', borderColor: fieldErrors.existing_systems ? 'var(--danger-color)' : '' }}
                  />
                  {fieldErrors.existing_systems && <span style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.existing_systems}</span>}
                </div>

                {modalMode !== 'view' && (
                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Submitting...' : modalMode === 'edit' ? 'Save Changes' : 'Submit Request'}
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
