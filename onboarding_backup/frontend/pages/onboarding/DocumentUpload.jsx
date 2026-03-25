import { useState, useEffect } from 'react';
import { OnboardingAPI } from '../../services/api';
import { FileUp, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentUpload() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('Aadhaar');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const employeeId = 1; // HARDCODED for now

    const documentTypes = [
        'Aadhaar', 'PAN', 'NDA', 'NCA', 'Emergency Contact Form',
        'Educational Certificates', 'Experience Certificates'
    ];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await OnboardingAPI.getMyDocuments(employeeId);
            setDocuments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                setFile(null);
            } else {
                setError('');
                setFile(selected);
            }
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please select a file');

        setUploading(true);
        setError('');

        try {
            await OnboardingAPI.uploadDocument(employeeId, selectedType, file);
            setFile(null);
            fetchDocuments(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Approved') return <span className="status-badge active"><CheckCircle size={14} /> Approved</span>;
        if (status === 'Rejected') return <span className="status-badge inactive"><XCircle size={14} /> Rejected</span>;
        return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', background: 'linear-gradient(45deg, var(--primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Joining Documents
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '1.1rem' }}>Securely upload your mandatory onboarding files.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/onboarding')} style={{ transition: 'all 0.3s ease' }}>
                    ← Back to Dashboard
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginTop: '32px' }}>
                {/* Premium Upload Form */}
                <div className="card hover-lift" style={{
                    height: 'fit-content',
                    padding: '32px',
                    background: 'linear-gradient(145deg, var(--bg-primary), var(--bg-secondary))',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 20px 40px -20px rgba(99, 102, 241, 0.15)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileUp className="text-primary" /> Upload New
                    </h3>

                    {error && <div className="alert error" style={{ animation: 'slideIn 0.3s ease' }}>{error}</div>}

                    <form onSubmit={handleUpload}>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Document Type</label>
                            <select
                                className="form-control"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{ padding: '12px', fontSize: '1rem', cursor: 'pointer', background: 'var(--card-bg)' }}
                            >
                                {documentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginTop: '24px' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>File Selection (Max 5MB)</label>

                            <div style={{
                                position: 'relative',
                                border: '2px dashed var(--primary)',
                                borderRadius: '12px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                background: file ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                cursor: 'pointer'
                            }}
                                className="upload-dropzone"
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                                    onChange={handleFileChange}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        opacity: 0, cursor: 'pointer'
                                    }}
                                    required
                                />
                                <FileUp size={48} style={{ color: file ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '16px', transition: 'color 0.3s ease' }} />
                                {file ? (
                                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{file.name}</h4>
                                ) : (
                                    <>
                                        <h4 style={{ margin: '0 0 8px 0' }}>Click or drag file to upload</h4>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Supports PDF, JPG, PNG, DOCX</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }} disabled={uploading}>
                            {uploading ? (
                                <><Clock className="spin" size={20} /> Uploading...</>
                            ) : (
                                <><FileUp size={20} /> Secure Upload</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Uploaded Documents List */}
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.4rem' }}>My Vault</h3>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Clock className="spin text-primary" size={40} />
                        </div>
                    ) : documents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                            <FileText size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3>No documents found</h3>
                            <p>Upload your first document using the panel on the left.</p>
                        </div>
                    ) : (
                        <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {documents.map(doc => (
                                <div key={doc.id} className="hover-lift" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '20px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{
                                            padding: '16px',
                                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                                            borderRadius: '12px',
                                            color: 'var(--primary)',
                                            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)'
                                        }}>
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>{doc.documentType}</h4>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={12} /> {new Date(doc.uploadedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        {getStatusBadge(doc.verificationStatus)}
                                        <a href={`http://localhost:8087${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px' }}>
                                            View File
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .upload-dropzone:hover {
                    border-color: var(--primary) !important;
                    background: rgba(99, 102, 241, 0.05) !important;
                    transform: translateY(-2px);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
