import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminCommunicationAPI } from '../../services/api';
import { Plus, Megaphone, Trash2, Search } from 'lucide-react';

export default function AdminCommunicationDashboard() {
    const navigate = useNavigate();
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [targetFilter, setTargetFilter] = useState('');

    useEffect(() => {
        fetchCommunications();
    }, []);

    const fetchCommunications = async () => {
        try {
            setLoading(true);
            const res = await AdminCommunicationAPI.getAll();
            setCommunications(res.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : "Failed to fetch communications.");
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this communication?")) {
            try {
                await AdminCommunicationAPI.delete(id);
                fetchCommunications();
            } catch (err) {
                alert("Failed to delete communication.");
            }
        }
    };

    const getTargetDisplay = (com) => {
        if (com.targetType === 'All') return <span className="badge badge-success">All Employees</span>;
        if (com.targetType === 'Group' && com.targetDepartmentName) return <span className="badge badge-primary">Dept: {com.targetDepartmentName}</span>;
        if (com.targetType === 'Group' && com.targetRole) return <span className="badge badge-primary">Role: {com.targetRole}</span>;
        if (com.targetType === 'Single') return <span className="badge badge-warning">Emp: {com.targetEmployeeName}</span>;
        return <span className="badge badge-secondary">{com.targetType}</span>;
    };

    // Derived unique types/targets for filters
    const uniqueTypes = [...new Set(communications.map(c => c.communicationTypeName))].filter(Boolean);

    const filteredComms = communications.filter(com => {
        const matchesSearch = com.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (com.subject && com.subject.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter ? com.communicationTypeName === typeFilter : true;
        const matchesTarget = targetFilter ? com.targetType === targetFilter : true;
        return matchesSearch && matchesType && matchesTarget;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2><Megaphone size={28} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary)' }} /> HR Communications</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage and broadcast official letters, memos, and announcements.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/admin/communications/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} /> Create Communication
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 250px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="">All Types</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                        <select className="form-control" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
                            <option value="">All Targets</option>
                            <option value="All">All Employees</option>
                            <option value="Group">Groups (Dept/Role)</option>
                            <option value="Single">Individual Employees</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Loading communications...</div>
                ) : filteredComms.length === 0 ? (
                    <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
                        <Megaphone size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No communications found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Target</th>
                                    <th>Issue Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComms.map(com => (
                                    <tr key={com.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{com.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{com.subject}</div>
                                        </td>
                                        <td>{com.communicationTypeName}</td>
                                        <td>{getTargetDisplay(com)}</td>
                                        <td>{com.issueDate}</td>
                                        <td>
                                            <span className={`badge ${com.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                                                {com.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                                                onClick={() => handleDelete(com.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
