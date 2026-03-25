import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { handbookService } from '../../services/handbookService';
import { ArrowLeft, Clock, User, CheckCircle, Maximize, Minimize, ZoomIn, ZoomOut, Edit, Archive } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function PolicyView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [pageZoom, setPageZoom] = useState(1.2);
    
    const userRole = tokenManager.getUserRole() || '';
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userRole);

    const handleArchive = async () => {
        if (!window.confirm('Are you sure you want to archive this policy? Employees will no longer be able to see it.')) return;
        try {
            await handbookService.archivePolicy(id);
            navigate('/handbook');
        } catch (err) {
            alert('Failed to archive policy');
        }
    };

    const handleEdit = () => {
        navigate(`/handbook/editor/${id}`);
    };

    useEffect(() => {
        if (isFullScreen) {
            document.body.classList.add('hide-nav');
        } else {
            document.body.classList.remove('hide-nav');
        }
        return () => document.body.classList.remove('hide-nav');
    }, [isFullScreen]);

    useEffect(() => {
        const fetchPolicy = async () => {
            setLoading(true);
            try {
                const res = await handbookService.getPolicyById(id);
                setPolicy(res.data);
            } catch (err) {
                console.error("Failed to load policy", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [id]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading document...</div>;
    if (!policy) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Policy document not found.</div>;

    const containerStyle = isFullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f1f5f9',
        zIndex: 9999,
        padding: '16px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    } : { maxWidth: '1200px', margin: '0 auto', paddingBottom: 40 };

    return (
        <div style={containerStyle}>
            {/* Immersive Floating Controls for Full View */}
            {isFullScreen && (
                <div style={{ 
                    position: 'fixed', 
                    top: 20, 
                    right: 20, 
                    zIndex: 10000, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    background: 'rgba(255, 255, 255, 0.95)', 
                    padding: '8px 12px',
                    borderRadius: '30px',
                    border: '1px solid var(--border)', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', borderRight: '1px solid var(--border)', paddingRight: 12, marginRight: 4 }}>
                        <button 
                            onClick={() => setPageZoom(z => Math.max(0.5, z - 0.1))} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', padding: 4 }} 
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <span style={{ fontSize: '0.85rem', width: '40px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            {Math.round(pageZoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setPageZoom(z => Math.min(2.5, z + 0.1))} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', padding: 4 }} 
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsFullScreen(false)}
                        style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: 'var(--primary)', 
                            border: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer', 
                            color: 'white',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Exit Full View"
                    >
                        <Minimize size={18} />
                    </button>
                </div>
            )}

            {/* Header / Meta - ONLY SHOWN WHEN NOT IN FULL SCREEN */}
            {!isFullScreen && (
                <div style={{ 
                    width: '100%', 
                    marginBottom: 16, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 4px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button 
                            onClick={() => navigate('/handbook')} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', height: 32, fontSize: '0.8rem' }}
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                            <h1 style={{ 
                                fontSize: '1.35rem', 
                                fontWeight: 800, 
                                color: 'var(--text-main)', 
                                lineHeight: 1,
                                margin: 0
                            }}>
                                {policy.title}
                            </h1>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> {new Date(policy.updatedAt).toLocaleDateString()}
                                </span>
                                <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <User size={12} /> {policy.createdByName}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isHRorAdmin && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={handleEdit} className="btn btn-outline" style={{ padding: '0 10px', height: 32, fontSize: '0.8rem' }}>
                                    <Edit size={14} /> Edit
                                </button>
                                <button onClick={handleArchive} className="btn" style={{ background: '#ef4444', color: 'white', padding: '0 10px', border: 'none', height: 32, fontSize: '0.8rem' }}>
                                    <Archive size={14} /> Delete
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'var(--surface)', padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', height: 32 }}>
                            <button onClick={() => setPageZoom(z => Math.max(0.5, z - 0.1))} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                <ZoomOut size={14} />
                            </button>
                            <span style={{ fontSize: '0.8rem', width: '32px', textAlign: 'center', fontWeight: 'bold' }}>{Math.round(pageZoom * 100)}%</span>
                            <button onClick={() => setPageZoom(z => Math.min(2.5, z + 0.1))} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                <ZoomIn size={14} />
                            </button>
                        </div>
                    
                        <button 
                            onClick={() => setIsFullScreen(true)}
                            className="btn btn-secondary"
                            style={{ padding: '0 12px', height: 32, fontSize: '0.8rem' }}
                        >
                            <Maximize size={14} /> Full View
                        </button>
                    </div>
                </div>
            )}

            {/* Document Content rendered dynamically as a single long page */}
            <div style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                background: 'transparent', 
                padding: '16px 0', 
                borderRadius: '0', 
                height: isFullScreen ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)', 
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', zoom: pageZoom, transition: 'zoom 0.1s ease-out', paddingBottom: '100px', width: '100%' }}>
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '1000px', 
                        backgroundColor: '#ffffff', 
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        display: 'flex', 
                        flexDirection: 'column' 
                    }}>
                        <div 
                            className="document-content ql-editor" 
                            style={{ padding: '40px 60px', paddingBottom: '20px', flex: 1, overflow: 'visible', fontSize: '1.1rem', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: policy.content || '<p style="color:#aaa; text-align:center;">No content available for this policy.</p>' }} 
                        />
                        <div style={{ padding: '10px 60px 30px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', borderTop: '0px solid #f1f5f9', marginTop: 'auto' }}>
                            - End of Document -
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
