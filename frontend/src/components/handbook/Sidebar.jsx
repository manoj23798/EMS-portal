import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handbookService } from '../../services/handbookService';
import { BookOpen, FileText, Plus, Search } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function HandbookSidebar() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const userRole = (tokenManager.getUserRole() || '').toUpperCase();
    const isHRorAdmin = userRole.includes('HR') || userRole.includes('ADMIN');

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
                            onClick={() => navigate('/handbook/create')}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Create New Policy"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 12px 0 12px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search handbook..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '8px 12px 8px 32px', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border)',
                            fontSize: '0.85rem',
                            background: 'var(--bg-main)'
                        }} 
                    />
                </div>
            </div>

            {/* Policy List */}
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                {policies.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No policies created yet.
                    </div>
                ) : (() => {
                    const sortedPolicies = [...policies].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    const filteredPolicies = sortedPolicies.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                    if (filteredPolicies.length === 0) {
                        return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching policies found.</div>;
                    }

                    return filteredPolicies.map((p, index) => (
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
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '16px' }}>{index + 1}.</span>
                            <FileText size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.title}
                            </span>
                        </NavLink>
                    ));
                })()}
            </div>
        </div>
    );
}
