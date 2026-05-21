import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import { PerformanceAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

export default function MonthlyReviewList() {
    const navigate = useNavigate();
    const role = tokenManager.getUserRole();
    const canCreate = role === 'ADMIN' || role === 'HR' || role === 'PROJECT_MANAGER';
    
    const [reviews, setReviews] = useState([]);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        status: '',
        score: '', // '5', '4', '3', '2', '1'
        role: ''
    });

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const response = await PerformanceAPI.getAllMPRs();
            
            const data = response.data || [];
            // Sort by ID descending (newest first)
            const sortedData = [...data].sort((a, b) => b.id - a.id);
            setReviews(sortedData);
        } catch (error) {
            console.error("Failed to load reviews", error);
            // Mock data removed to avoid confusion when API fails
            setReviews([]);
        }
    };

    const getMonthName = (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = (r.employeeName || '').toLowerCase().includes(search.toLowerCase()) || 
                             (r.employeeId || '').toString().includes(search);
        
        const reviewDate = new Date(r.year, r.month - 1, 1);
        const matchesFromDate = !filters.fromDate || reviewDate >= new Date(filters.fromDate);
        const matchesToDate = !filters.toDate || reviewDate <= new Date(filters.toDate);
        
        const matchesStatus = !filters.status || r.status === filters.status;
        const matchesScore = !filters.score || Math.floor(r.totalScore) === parseInt(filters.score);
        const matchesRole = !filters.role || (r.employeeRole || '').toLowerCase().includes(filters.role.toLowerCase());
        
        return matchesSearch && matchesFromDate && matchesToDate && matchesStatus && matchesScore && matchesRole;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>Monthly Performance Reviews</h1>
                </div>
                {canCreate && (
                    <button 
                        onClick={() => navigate('new')}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Plus size={18} /> New Review
                    </button>
                )}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
                        <input 
                            value={search} onChange={e => setSearch(e.target.value)} 
                            placeholder="Search by Employee..." 
                            style={{ width: '100%', height: 38, padding: '0 12px 0 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} 
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '0 16px', height: 38, background: showFilters ? '#eff6ff' : '#f8fafc', border: `1px solid ${showFilters ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: showFilters ? '#3b82f6' : '#475569', cursor: 'pointer' }}
                    >
                        <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Filters'}
                    </button>
                    {(filters.fromDate || filters.toDate || filters.status || filters.score || filters.role) && (
                        <button 
                            onClick={() => setFilters({ fromDate: '', toDate: '', status: '', score: '', role: '' })}
                            style={{ padding: '0 12px', height: 38, background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >Clear</button>
                    )}
                </div>

                {showFilters && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, padding: '12px 0', borderTop: '1px solid #f1f5f9', marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>FROM DATE</label>
                            <input 
                                type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>TO DATE</label>
                            <input 
                                type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>EMPLOYEE ROLE</label>
                            <input 
                                value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}
                                placeholder="Filter by role..."
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>STATUS</label>
                            <select 
                                value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            >
                                <option value="">All Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SUBMITTED">Submitted</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>RATING SCORE</label>
                            <select 
                                value={filters.score} onChange={e => setFilters({...filters, score: e.target.value})}
                                style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 8px', fontSize: 13 }}
                            >
                                <option value="">Any Rating</option>
                                <option value="5">5 Star (Excellent)</option>
                                <option value="4">4 Star (Good)</option>
                                <option value="3">3 Star (Average)</option>
                                <option value="2">2 Star (Below Avg)</option>
                                <option value="1">1 Star (Poor)</option>
                            </select>
                        </div>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 800 }}>Employee</th>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 800 }}>Role</th>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 800 }}>Period</th>
                            <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 800 }}>Score</th>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 800 }}>Created At</th>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 800 }}>Status</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 800 }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No reviews found matching your filters.</td></tr>
                        ) : filteredReviews.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 16px' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName || `EMP ID: ${r.employeeId}`}</div>
                                </td>
                                <td style={{ padding: '8px 16px', color: '#64748b', fontSize: 12 }}>
                                    {r.employeeRole || 'Not Assigned'}
                                </td>
                                <td style={{ padding: '8px 16px', fontWeight: 600, color: '#334155' }}>
                                    {getMonthName(r.month)} {r.year}
                                </td>
                                <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 800, color: r.totalScore >= 4 ? '#16a34a' : '#ea580c' }}>
                                    {r.totalScore}
                                </td>
                                <td style={{ padding: '8px 16px', fontSize: 12, color: '#64748b' }}>
                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td style={{ padding: '8px 16px' }}>
                                    <span style={{ 
                                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                                        background: r.status === 'SUBMITTED' ? '#dcfce7' : '#f1f5f9',
                                        color: r.status === 'SUBMITTED' ? '#166534' : '#475569'
                                    }}>{r.status}</span>
                                </td>
                                <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => navigate(`${r.id}`)}
                                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
