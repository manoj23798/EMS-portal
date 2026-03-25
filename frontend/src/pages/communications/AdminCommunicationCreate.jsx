import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminCommunicationAPI, EmployeeAPI, DepartmentAPI } from '../../services/api';
import { Send, UserPlus, AlertCircle, RefreshCw, Users, User, Globe, Paperclip, X, FileText } from 'lucide-react';

export default function AdminCommunicationCreate() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [types, setTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [communicationTypeId, setCommunicationTypeId] = useState('');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [targetType, setTargetType] = useState('All');

    // Target Specifics
    const [targetEmployeeId, setTargetEmployeeId] = useState('');
    const [targetDepartmentId, setTargetDepartmentId] = useState('');
    const [targetRole, setTargetRole] = useState('');

    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Mock HR ID for this example
    const currentHrId = 1;

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const [typesRes, empRes, deptRes] = await Promise.all([
                    AdminCommunicationAPI.getTypes(),
                    EmployeeAPI.getAll(),
                    DepartmentAPI.getAll()
                ]);
                setTypes(typesRes.data);
                setEmployees(empRes.data.filter(e => e.isActive));
                setDepartments(deptRes.data);

                if (typesRes.data.length > 0) {
                    setCommunicationTypeId(typesRes.data[0].id);
                }
            } catch (err) {
                setError("Failed to load form dependencies.");
            }
        };
        loadDependencies();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size cannot exceed 5MB.");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
            if (!validTypes.includes(selectedFile.type)) {
                setError("Invalid file format. Only PDF, DOCX, PNG, and JPG are allowed.");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setFile(selectedFile);
            setError('');
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!communicationTypeId) return setError("Please select a communication type.");
        if (targetType === 'Single' && !targetEmployeeId) return setError("Please select a target employee.");
        if (targetType === 'Group' && !targetDepartmentId && !targetRole) return setError("Please select a target department or role.");

        setSubmitting(true);

        const formData = new FormData();
        formData.append('communicationTypeId', communicationTypeId);
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('description', description);
        formData.append('issueDate', issueDate);
        formData.append('targetType', targetType);
        formData.append('createdById', currentHrId);

        if (targetType === 'Single') formData.append('targetEmployeeId', targetEmployeeId);
        if (targetType === 'Group' && targetDepartmentId) formData.append('targetDepartmentId', targetDepartmentId);
        if (targetType === 'Group' && targetRole) formData.append('targetRole', targetRole);
        if (file) formData.append('file', file);

        try {
            await AdminCommunicationAPI.create(formData);
            navigate('/admin/communications');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : "Failed to create communication."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                        <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'var(--surface)', display: 'flex' }}>
                            <Send size={24} />
                        </div>
                        Draft Communication
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>Create and broadcast official enterprise updates</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/communications')}>Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '1.05rem' }} disabled={submitting}>
                        {submitting ? <><RefreshCw size={18} className="spin" /> Sending...</> : <><Send size={18} /> Broadcast Now</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert error" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                    <AlertCircle size={24} />
                    <div style={{ fontWeight: 500 }}>{error}</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '32px', alignItems: 'start' }}>
                {/* Left Column: Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '32px', borderRadius: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.5)' }}>
                        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)', fontSize: '1.3rem' }}>Message Content</h3>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Communication Title *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Q3 Performance Bonus Announcement"
                                style={{ color: 'var(--text-main)', fontSize: '1.2rem', padding: '14px 16px', borderRadius: '12px', border: '2px solid var(--border)', transition: 'all 0.2s', background: 'var(--background)' }}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Subject Line (Optional)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief subject for inbox preview..."
                                style={{ color: 'var(--text-main)', padding: '12px 16px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Full Message *</label>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border)', transition: 'all 0.2s' }} className="focus-within-ring">
                                <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                                    <span style={{ fontWeight: 600, cursor: 'pointer' }}>B</span>
                                    <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                                    <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                                </div>
                                <textarea
                                    className="form-control"
                                    rows="12"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Compose your official message here. Provide clear instructions and context..."
                                    style={{ color: 'var(--text-main)', border: 'none', borderRadius: 0, padding: '16px', fontSize: '1.05rem', resize: 'vertical', background: 'transparent' }}
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Attachment Section */}
                    <div className="card" style={{ padding: '32px', borderRadius: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)', fontSize: '1.3rem' }}>Supporting Document</h3>

                        {!file ? (
                            <div
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: '16px',
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    background: 'var(--bg-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                className="hover-lift"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div style={{ background: 'var(--primary-light)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
                                    <Paperclip size={32} />
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Click to upload attachment</h4>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>Securely attach policies, letters, or forms (Max 5MB)</p>
                                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '0.8rem' }}>PDF, DOCX, PNG, JPG allowed</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '8px' }}>
                                    <FileText size={28} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.05rem', marginBottom: '4px' }}>{file.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                                <button type="button" onClick={removeFile} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%', color: 'var(--danger)', background: '#fee2e2', border: 'none' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Settings & Audience */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>

                    <div className="card" style={{ padding: '24px', borderRadius: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Publish Settings</h3>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Communication Type *</label>
                            <select
                                className="form-control"
                                value={communicationTypeId}
                                onChange={(e) => setCommunicationTypeId(e.target.value)}
                                style={{ color: 'var(--text-main)', background: 'var(--background)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border)' }}
                                required
                            >
                                <option value="" style={{ color: 'var(--text-main)' }}>-- Select Type --</option>
                                {types.map(t => <option key={t.id} value={t.id} style={{ color: 'var(--text-main)' }}>{t.typeName}</option>)}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Issue / Post Date *</label>
                            <input
                                type="date"
                                className="form-control"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                style={{ color: 'var(--text-main)', background: 'var(--background)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border)' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="card" style={{ padding: '24px', borderRadius: '20px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>Target Audience *</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { id: 'All', icon: <Globe size={20} />, title: 'All Employees', desc: 'Broadcast to entire company' },
                                { id: 'Group', icon: <Users size={20} />, title: 'Specific Group', desc: 'Target by Department or Role' },
                                { id: 'Single', icon: <User size={20} />, title: 'Individual', desc: 'Send to a single employee' }
                            ].map(type => (
                                <div
                                    key={type.id}
                                    onClick={() => {
                                        setTargetType(type.id);
                                        setTargetEmployeeId('');
                                        setTargetDepartmentId('');
                                        setTargetRole('');
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: `2px solid ${targetType === type.id ? 'var(--primary)' : 'var(--border)'}`,
                                        background: targetType === type.id ? 'var(--primary)' : 'var(--background)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: targetType === type.id ? 1 : 0.7
                                    }}
                                >
                                    <div style={{ color: targetType === type.id ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                        {type.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: targetType === type.id ? 'var(--primary)' : 'var(--text-primary)' }}>{type.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{type.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Conditional Target Inputs with smooth rendering logic */}
                        <div style={{
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            maxHeight: targetType === 'All' ? '0' : '500px',
                            opacity: targetType === 'All' ? 0 : 1
                        }}>
                            {targetType === 'Single' && (
                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Select Employee *</label>
                                    <select
                                        className="form-control"
                                        value={targetEmployeeId}
                                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                                        style={{ color: 'var(--text-main)', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)' }}
                                    >
                                        <option value="" style={{ color: 'var(--text-main)' }}>-- Search Directory --</option>
                                        {employees.map(e => <option key={e.id} value={e.id} style={{ color: 'var(--text-main)' }}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                                    </select>
                                </div>
                            )}

                            {targetType === 'Group' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                                    <div>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Department Filter</label>
                                        <select
                                            className="form-control"
                                            value={targetDepartmentId}
                                            onChange={(e) => setTargetDepartmentId(e.target.value)}
                                            style={{ color: 'var(--text-main)', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)' }}
                                        >
                                            <option value="" style={{ color: 'var(--text-main)' }}>-- Any Department --</option>
                                            {departments.map(d => <option key={d.id} value={d.id} style={{ color: 'var(--text-main)' }}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Job Role Filter</label>
                                        <select
                                            className="form-control"
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            style={{ color: 'var(--text-main)', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)' }}
                                        >
                                            <option value="" style={{ color: 'var(--text-main)' }}>-- Any Role --</option>
                                            <option value="EMPLOYEE" style={{ color: 'var(--text-main)' }}>Employee</option>
                                            <option value="MANAGER" style={{ color: 'var(--text-main)' }}>Manager</option>
                                            <option value="HR" style={{ color: 'var(--text-main)' }}>HR</option>
                                        </select>
                                    </div>
                                    <div style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                        <strong>Note:</strong> Messages are sent based on intersection (AND logic). Example: Marketing + Manager targets only Managers in Marketing.
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } 
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .focus-within-ring:focus-within { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
            `}</style>
        </div>
    );
}
