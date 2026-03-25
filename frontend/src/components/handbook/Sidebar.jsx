import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handbookService } from '../../services/handbookService';
import { BookOpen, FileText, Plus } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function HandbookSidebar() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const userRole = tokenManager.getUserRole() || '';
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userRole);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const res = await handbookService.getAllPolicies();
                setPolicies(res.data);
            } catch (err) {
                console.error("Failed to load policies", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicies();
    }, []);

    if (loading) return <div style={{ padding: 20 }}>Loading policies...</div>;

    return (
        <div style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', height: '100%' }}>
            {/* Sidebar Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)', margin: 0 }}>
                        <BookOpen size={20} color="var(--primary)" />
                        Hand Book
                    </h2>
                    {isHRorAdmin && (
                        <button 
                            onClick={() => navigate('/handbook/editor')}
                            style={{ 
                                background: 'var(--primary)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                padding: '6px 12px', 
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'center'
                            }}
                            title="Create Policy"
                        >
                            <Plus size={14} /> Create Policy
                        </button>
                    )}
                </div>
            </div>

            {/* Policy List */}
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                {policies.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No policies created yet.
                    </div>
                ) : (
                    policies.map(p => (
                        <NavLink
                            key={p.id}
                            to={`/handbook/policy/${p.id}`}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 10, 
                                padding: '10px 12px', 
                                borderRadius: 'var(--radius-md)', 
                                textDecoration: 'none', 
                                color: 'var(--text-main)', 
                                marginBottom: 4,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FileText size={16} style={{ opacity: 0.7 }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.title}
                            </span>
                        </NavLink>
                    ))
                )}
            </div>
        </div>
    );
}
