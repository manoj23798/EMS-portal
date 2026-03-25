import React, { useState, useEffect } from 'react';
import { AdminOnboardingAPI, EmployeeAPI } from '../../services/api';
import { UserPlus, FileText, CheckCircle, Clock, Square, CheckSquare, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const OnboardingDetailsPanel = ({ employeeId, hrId, onDocumentVerified }) => {
    const [documents, setDocuments] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [employeeId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const [docsRes, tasksRes] = await Promise.all([
                AdminOnboardingAPI.getEmployeeDocuments(employeeId),
                AdminOnboardingAPI.getEmployeeChecklist(employeeId)
            ]);
            setDocuments(docsRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            console.error('Failed to fetch details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDocument = async (docId, status) => {
        try {
            await AdminOnboardingAPI.verifyDocument(docId, hrId, status);
            fetchDetails(); // Refresh details
            if (onDocumentVerified) onDocumentVerified();
        } catch (err) {
            alert('Failed to verify document');
        }
    };

    const handleUpdateTask = async (task) => {
        const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
        try {
            await AdminOnboardingAPI.updateEmployeeChecklistTask(task.id, employeeId, newStatus);
            fetchDetails(); // Refresh
        } catch (err) {
            alert('Failed to update task');
        }
    };

    if (loading) return <div style={{ padding: '24px', textAlign: 'center' }}>Loading details...</div>;

    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

    return (
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Documents Section */}
                <div className="card" style={{ margin: 0 }}>
                    <h4 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} /> Uploaded Documents ({documents.length})
                    </h4>
                    {documents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No documents uploaded yet.</p> : (
                        <div className="list-group">
                            {documents.map(doc => (
                                <div key={doc.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{doc.documentType}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {doc.verificationStatus === 'Pending' && <span style={{ color: '#f59e0b' }}><Clock size={12} /> Pending Review</span>}
                                            {doc.verificationStatus === 'Approved' && <span style={{ color: '#10b981' }}><CheckCircle size={12} /> Approved</span>}
                                            {doc.verificationStatus === 'Rejected' && <span style={{ color: '#ef4444' }}><XCircle size={12} /> Rejected</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <a href={`http://localhost:8087${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                            View
                                        </a>
                                        {doc.verificationStatus === 'Pending' && (
                                            <>
                                                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => handleVerifyDocument(doc.id, 'Approved')}>Approve</button>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleVerifyDocument(doc.id, 'Rejected')}>Reject</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checklist Section */}
                <div className="card" style={{ margin: 0 }}>
                    <h4 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckSquare size={18} /> Checklist Progress</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{progress}% ({completedTasks}/{tasks.length})</span>
                    </h4>
                    {tasks.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No checklist tasks.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => handleUpdateTask(task)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                                        background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                                        borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)'
                                    }}
                                >
                                    {task.status === 'Completed' ? <CheckSquare size={18} className="text-green" /> : <Square size={18} style={{ color: 'var(--text-secondary)' }} />}
                                    <span style={{ flex: 1, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                                        {task.taskName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default function AdminOnboardingDashboard() {
    const [onboardings, setOnboardings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [starting, setStarting] = useState(false);

    // State for expandable rows
    const [expandedRow, setExpandedRow] = useState(null);

    const adminId = 1; // HARDCODED hrId for demo

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [onboardingRes, empRes] = await Promise.all([
                AdminOnboardingAPI.getAllOnboardings(),
                EmployeeAPI.getAll()
            ]);
            setOnboardings(onboardingRes.data);
            setEmployees(empRes.data.content || empRes.data); // Handle paginated or list response
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStartOnboarding = async (e) => {
        e.preventDefault();
        if (!selectedEmployeeId) return;

        setStarting(true);
        try {
            await AdminOnboardingAPI.startOnboarding(selectedEmployeeId);
            setSelectedEmployeeId('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to start onboarding');
        } finally {
            setStarting(false);
        }
    };

    const toggleRow = (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    const eligibleEmployees = employees.filter(emp => !onboardings.some(ob => ob.employeeId === emp.id));

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>HR Onboarding Dashboard</h2>
                <button className="btn btn-primary" onClick={() => document.getElementById('start-form').scrollIntoView()}>
                    <UserPlus size={16} /> Initiate New
                </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card text-center" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{onboardings.length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total in Process</div>
                </div>
                <div className="card text-center" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                        {onboardings.filter(o => o.status === 'In Progress').length}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>In Progress</div>
                </div>
                <div className="card text-center" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                        {onboardings.filter(o => o.status === 'Completed').length}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Completed</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Active Onboardings Table */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Active Employees</h3>
                    {loading ? <p>Loading...</p> : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Started On</th>
                                    <th>Status</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {onboardings.map(ob => (
                                    <React.Fragment key={ob.id}>
                                        <tr onClick={() => toggleRow(ob.id)} style={{ cursor: 'pointer', background: expandedRow === ob.id ? 'var(--bg-secondary)' : 'transparent' }}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{ob.employeeName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ob.designationTitle}</div>
                                            </td>
                                            <td>{ob.departmentName}</td>
                                            <td>{new Date(ob.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${ob.status.replace(' ', '').toLowerCase()}`}>
                                                    {ob.status === 'Completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    {ob.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {expandedRow === ob.id ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                                            </td>
                                        </tr>
                                        {expandedRow === ob.id && (
                                            <tr key={`details-${ob.id}`} style={{ background: 'var(--bg-secondary)' }}>
                                                <td colSpan="5" style={{ padding: 0 }}>
                                                    <OnboardingDetailsPanel
                                                        employeeId={ob.employeeId}
                                                        hrId={adminId}
                                                        onDocumentVerified={() => fetchData()}
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {onboardings.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No active onboardings found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Start Onboarding Form */}
                <div className="card" id="start-form" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Initiate Onboarding</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                        Select a newly created employee to start their document and checklist workflow.
                    </p>
                    {eligibleEmployees.length === 0 ? (
                        <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                            <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
                            <h4 style={{ margin: '0 0 8px 0' }}>All Caught Up!</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                                There are no new employees waiting to be onboarded. Every current employee has already been initiated.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleStartOnboarding}>
                            <div className="form-group">
                                <label>Select Employee *</label>
                                <select
                                    className="form-control"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Employee --</option>
                                    {eligibleEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={starting}>
                                {starting ? 'Initiating...' : 'Start Process'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div >
    );
}
