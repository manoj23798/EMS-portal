import React, { useState, useEffect } from 'react';
import { handbookService } from '../../services/handbookService';
import { ChevronLeft, Download, FileText, Clock, FileBadge } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function HandbookDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res = await handbookService.getPolicyById(id);
                setPolicy(res.data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [id]);

    const handleDownload = (url) => {
        window.open(`http://localhost:8087${url}`, '_blank');
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Details...</div>;
    
    if (error || !policy) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="alert alert-danger" style={{ maxWidth: 400, margin: '0 auto' }}>
                Policy not found or has been archived.
            </div>
            <button onClick={() => navigate('/handbook')} className="btn btn-outline" style={{ marginTop: 16 }}>Back to Handbook</button>
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
            <button onClick={() => navigate('/handbook')} className="btn btn-outline" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronLeft size={16} /> Back to Handbook
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'flex-start' }}>
                {/* Main Policy Detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card">
                        <div className="card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <span style={{ 
                                padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                background: 'var(--primary-light)', color: 'var(--primary)', textTransform: 'uppercase'
                            }}>
                                {policy.categoryName}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={16} /> Last Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
                            {policy.title}
                        </h1>
                        
                        <div style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
                            {policy.description || 'No detailed description provided.'}
                        </div>

                        <div style={{ 
                            background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: 48, height: 48, background: 'var(--surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                    <FileBadge size={28} className="text-primary" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Official Policy Document</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Version {policy.version}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDownload(policy.documentUrl)}
                                className="btn btn-primary shadow-hover"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                            >
                                <Download size={18} /> Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Version History */}
                <div className="card">
                    <div className="card-body">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} /> Version History
                        </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {policy.versionHistory && policy.versionHistory.map((v, index) => (
                            <div key={v.id} style={{ 
                                paddingLeft: '16px', 
                                borderLeft: index === 0 ? '2px solid var(--primary)' : '2px solid var(--border)',
                                position: 'relative'
                            }}>
                                <div style={{ 
                                    position: 'absolute', left: '-5px', top: '4px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: index === 0 ? 'var(--primary)' : 'var(--text-muted)'
                                }} />
                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: index === 0 ? 'var(--primary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Version {v.version}</span>
                                    {index !== 0 && (
                                        <button 
                                            onClick={() => handleDownload(v.documentUrl)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            title="Download old version"
                                        >
                                            <Download size={14} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {new Date(v.updatedAt).toLocaleDateString()}
                                </div>
                                {index === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Current Active</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
