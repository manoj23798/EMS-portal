import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export default function DocumentViewer({ url, title, onClose }) {
    if (!url) return null;

    const isPDF = url.toLowerCase().endsWith('.pdf');
    const fullUrl = url.startsWith('http') ? url : 
                   (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.startsWith('/') 
                    ? `${import.meta.env.VITE_API_URL}${url}` 
                    : url);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.9)', 
            backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', 
            flexDirection: 'column', padding: '20px'
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 24px', background: '#1e293b', borderRadius: '12px 12px 0 0',
                color: '#fff', borderBottom: '1px solid #334155'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: '#334155', borderRadius: 8 }}>
                        <ZoomIn size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <a href={fullUrl} download target="_blank" rel="noreferrer" style={{ 
                        color: '#cbd5e1', textDecoration: 'none', display: 'flex', 
                        alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 
                    }}>
                        <Download size={18} /> Download
                    </a>
                    <button onClick={onClose} style={{ 
                        background: '#ef4444', border: 'none', color: '#fff', 
                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700
                    }}>
                        <X size={18} /> Close
                    </button>
                </div>
            </div>

            {/* Viewer Area */}
            <div style={{ 
                flex: 1, background: '#0f172a', display: 'flex', 
                justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
                borderRadius: '0 0 12px 12px'
            }}>
                {isPDF ? (
                    <iframe 
                        src={`${fullUrl}#toolbar=0`} 
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="PDF Viewer"
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                        <img 
                            src={fullUrl} 
                            alt={title} 
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
