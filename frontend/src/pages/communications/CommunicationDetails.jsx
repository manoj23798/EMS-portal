import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CommunicationAPI } from '../../services/api';
import { ArrowLeft, MessageSquare, Calendar, User, Paperclip, Download, FileText } from 'lucide-react';

export default function CommunicationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [communication, setCommunication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock employee ID - usually from auth context
    const currentEmployeeId = 1;

    useEffect(() => {
        const fetchCommunicationDetails = async () => {
            try {
                const res = await CommunicationAPI.getById(id, currentEmployeeId);
                setCommunication(res.data);
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : "Communication not found or access denied.");
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunicationDetails();
    }, [id]);

    const handleDownload = () => {
        if (!communication?.attachmentUrl) return;

        // Ensure full URL is generated correctly depending on backend domain
        const baseUrl = 'http://localhost:8087';
        const fullUrl = communication.attachmentUrl.startsWith('http')
            ? communication.attachmentUrl
            : `${baseUrl}${communication.attachmentUrl}`;

        // Open file in new tab or trigger download
        window.open(fullUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
                <div className="spin" style={{ width: 40, height: 40, border: '4px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading communication...</p>
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !communication) {
        return (
            <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/communications')} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={16} /> Back to Inbox
                </button>
                <div className="alert error">{error || "Communication not found."}</div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                className="btn"
                onClick={() => navigate('/communications')}
                style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, fontWeight: 600, color: 'var(--text-secondary)' }}
            >
                <ArrowLeft size={18} /> Back to Inbox
            </button>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Header Section */}
                <div style={{ padding: '32px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                        <span className="badge badge-primary">{communication.communicationTypeName}</span>
                        {communication.status === 'Published' && <span className="badge badge-success">Published</span>}
                    </div>

                    <h1 style={{ fontSize: '2rem', margin: '0 0 12px 0', color: 'var(--text-primary)', lineHeight: 1.2 }}>{communication.title}</h1>
                    {communication.subject && (
                        <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>{communication.subject}</h3>
                    )}
                </div>

                {/* Meta Information */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', padding: '24px 32px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        <User size={18} />
                        <span style={{ fontSize: '0.95rem' }}>From: <strong>{communication.createdByName}</strong> (HR)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        <Calendar size={18} />
                        <span style={{ fontSize: '0.95rem' }}>Issued: <strong>{communication.issueDate}</strong></span>
                    </div>
                </div>

                {/* Message Body */}
                <div style={{ padding: '40px 32px' }}>
                    <div style={{
                        fontSize: '1.05rem',
                        lineHeight: 1.8,
                        color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {communication.description}
                    </div>
                </div>

                {/* Attachments Section */}
                {communication.attachmentUrl && (
                    <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Paperclip size={18} /> Attachments
                        </h4>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 24px',
                            background: 'var(--card-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '8px' }}>
                                <FileText size={24} />
                            </div>
                            <div style={{ paddingRight: '24px' }}>
                                <div style={{ fontWeight: 600 }}>Official Document</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available for download</div>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                            >
                                <Download size={18} /> Download
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


