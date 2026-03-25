import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // ES6
import { handbookService } from '../../services/handbookService';
import { Save, ArrowLeft, FileText, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';

export default function PolicyEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [pageZoom, setPageZoom] = useState(1.1);
    const [numPages, setNumPages] = useState(1);
    
    useEffect(() => {
        if (isFullScreen) {
            document.body.classList.add('hide-nav');
        } else {
            document.body.classList.remove('hide-nav');
        }
        return () => document.body.classList.remove('hide-nav');
    }, [isFullScreen]);

    // Dynamically calculate number of pages for the label - purely visual
    useEffect(() => {
        const checkHeight = () => {
            const editorEl = document.querySelector('.a4-live-editor .ql-editor');
            if (editorEl) {
                const totalHeight = editorEl.scrollHeight;
                const newPages = Math.max(1, Math.ceil(totalHeight / 1123));
                if (newPages !== numPages) setNumPages(newPages);
            }
        };
        checkHeight();
        window.addEventListener('resize', checkHeight);
        return () => window.removeEventListener('resize', checkHeight);
    }, [content, numPages]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const modules = React.useMemo(() => ({
        toolbar: {
            container: "#policy-toolbar"
        }
    }), []);

    useEffect(() => {
        const initData = async () => {
            try {
                if (id) {
                    const polRes = await handbookService.getPolicyById(id);
                    const p = polRes.data;
                    setTitle(p.title);

                    if (p.content) {
                        const cleanContent = p.content.replace(/<!-- PAGE_BREAK -->/g, '');
                        setContent(cleanContent);
                    }
                }
            } catch (err) {
                console.error("Failed to init editor", err);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [id]);

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!title || !content) {
            alert('Please fill out the Title and Content before saving.');
            return;
        }

        const payload = {
            title,
            content: content,
            description: "" // Add this to match backend DTO
        };

        setSaving(true);
        try {
            if (id) {
                await handbookService.updatePolicy(id, payload);
                alert('Policy updated successfully!');
            } else {
                await handbookService.uploadPolicy(payload);
                alert('Policy created successfully!');
            }
            navigate('/handbook');
        } catch (err) {
            console.error(err);
            alert("Error saving policy: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'list', 'indent',
        'link', 'image', 'align'
    ];

    if (loading) return <div>Loading editor...</div>;

    const containerStyle = isFullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--surface)',
        zIndex: 9999,
        padding: '16px 48px',
        overflowY: 'auto'
    } : { maxWidth: '1200px', margin: '0 auto', background: 'var(--surface)', padding: 32, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' };

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

            {!isFullScreen && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 12, 
                    paddingBottom: 8, 
                    borderBottom: '1px solid var(--border)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => navigate('/handbook')} className="btn btn-secondary" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, height: 32, fontSize: '0.85rem' }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'inherit', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                            <FileText size={18} color="var(--primary)" />
                            {id ? 'Edit Policy' : 'Create Policy'}
                        </h2>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--surface)', color: 'inherit', padding: '0 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', height: 32 }}>
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
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', height: 32, fontSize: '0.85rem' }}
                        >
                            <Maximize size={14} /> Full
                        </button>
                        <button 
                            onClick={handleSave} 
                            className="btn btn-primary" 
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 32, fontSize: '0.85rem' }}
                        >
                            <Save size={14} /> {saving ? '...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {!isFullScreen && (
            <div className="form-grid" style={{ marginBottom: 24 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Policy Title *</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="form-input" 
                        placeholder="e.g. Remote Work Policy v2.0"
                    />
                </div>
            </div>
            )}

            <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'inherit' }}>Document Content *</label>
                
                {/* TOOLBAR OUTSIDE THE PAPER AREA */}
                <div id="policy-toolbar" className="ql-toolbar ql-snow" style={{ 
                    position: 'sticky', 
                    top: isFullScreen ? '72px' : '0', 
                    zIndex: 1000, 
                    background: '#fff', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    padding: '8px',
                    width: '100%',
                    borderBottom: '1px solid var(--border)' 
                }}>
                    <span className="ql-formats">
                        <select className="ql-header">
                            <option value="1"></option>
                            <option value="2"></option>
                            <option value="3"></option>
                            <option value="4"></option>
                            <option value="5"></option>
                            <option value="6"></option>
                            <option value=""></option>
                        </select>
                        <select className="ql-font"></select>
                        <select className="ql-size">
                            <option value="small"></option>
                            <option value=""></option>
                            <option value="large"></option>
                            <option value="huge"></option>
                        </select>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-bold"></button>
                        <button className="ql-italic"></button>
                        <button className="ql-underline"></button>
                        <button className="ql-strike"></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-list" value="ordered"></button>
                        <button className="ql-list" value="bullet"></button>
                        <button className="ql-indent" value="-1"></button>
                        <button className="ql-indent" value="+1"></button>
                    </span>
                    <span className="ql-formats">
                        <select className="ql-align"></select>
                        <button className="ql-link"></button>
                        <button className="ql-image"></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-clean"></button>
                    </span>
                </div>

                <div className="a4-live-editor-wrapper" style={{ borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                    <div className="a4-live-editor" style={{ zoom: pageZoom }}>
                        {mounted && (
                            <ReactQuill 
                                theme="snow" 
                                modules={modules}
                                formats={formats}
                                value={content}
                                onChange={setContent}
                                placeholder="Start typing your policy here..."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

