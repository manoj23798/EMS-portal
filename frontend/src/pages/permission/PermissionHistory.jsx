import React, { useEffect, useState } from 'react';
import { PermissionAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Filter,
    RotateCcw,
    Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const getStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce3' };
    if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444', border: '#fee2e2' };
    return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
};

const formatDuration = (minutes) => {
    const safe = Number(minutes) || 0;
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

const getSubmittedTimestamp = (permission) => {
    const submittedValue = permission?.createdAt || permission?.submissionDate || permission?.submittedAt || permission?.appliedDate || permission?.date;
    const time = submittedValue ? new Date(submittedValue).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
};

export default function PermissionHistory() {
    const navigate = useNavigate();
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const employeeId = tokenManager.getUserData()?.employeeId;
            const res = await PermissionAPI.getMy(employeeId);
            setPermissions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setFilters({ status: 'ALL', dateFrom: '', dateTo: '' });
        setCurrentPage(1);
    };

    const filteredPermissions = permissions
        .filter((p) => {
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch = !q || [p.reason, p.status, p.id, p.date].some((v) => String(v || '').toLowerCase().includes(q));
            const matchesStatus = filters.status === 'ALL' || p.status === filters.status;
            const permissionDate = p.date ? new Date(p.date) : null;
            const matchesFrom = !filters.dateFrom || (permissionDate && permissionDate >= new Date(filters.dateFrom));
            const matchesTo = !filters.dateTo || (permissionDate && permissionDate <= new Date(filters.dateTo));
            return matchesSearch && matchesStatus && matchesFrom && matchesTo;
        })
        .sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a));

    const exportData = () => {
        const data = filteredPermissions.map((p) => ({
            'Req ID': `#${p.id}`,
            Date: p.date,
            From: String(p.startTime || '').slice(0, 5),
            To: String(p.endTime || '').slice(0, 5),
            Duration: formatDuration(p.totalHours),
            Reason: p.reason || '',
            Status: p.status || '',
            'Submitted On': p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PermissionHistory');
        XLSX.writeFile(wb, 'Permission_History.xlsx');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: 'transparent' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '16px', fontSize: '11px', fontWeight: 950, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading Permission Logs...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 24px 24px 24px', background: 'transparent', minHeight: 'auto', width: '100%' }}>
            <style>{`
                .glass-card { background: white; border-radius: 20px; border: 1.5px solid #cbd5e1; box-shadow: 0 10px 40px rgba(0,0,0,0.03); overflow: hidden; }
                .action-btn { background: white; border: 1.5px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 10.5px; font-weight: 950; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; text-transform: uppercase; }
                .action-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
                .filter-input { padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; font-size: 11px; font-weight: 800; outline: none; }
                .btn-pagination { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #cbd5e1; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #1e293b; transition: 0.2s; }
                .btn-pagination:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; }
                .btn-pagination.active { background: #3b82f6; color: white; border-color: #3b82f6; }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/leave')} style={{ background: 'none', color: '#3b82f6', cursor: 'pointer', padding: '8px', border: '1.5px solid #bfdbfe', borderRadius: '12px' }}>
                        <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 950, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '-0.8px' }}>My Permission History</h1>
                    </div>
                </div>

                <div style={{ position: 'relative', width: '260px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} />
                    <input
                        placeholder="Search by ID, status or reason..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1.5px solid #3b82f6', fontSize: '12px', fontWeight: 800, background: 'white', outline: 'none', color: '#1e293b', boxShadow: '0 8px 20px rgba(59,130,246,0.06)' }}
                    />
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '12px 24px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Filters</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setShowFilters(!showFilters)} className="action-btn" style={{ background: showFilters ? '#eff6ff' : 'white', borderColor: showFilters ? '#3b82f6' : '#cbd5e1' }}>
                            <Filter size={14} color="#3b82f6" /> Show Filters
                        </button>
                        <button onClick={handleReset} className="action-btn"><RotateCcw size={14} /> Clear</button>
                        <button onClick={exportData} className="action-btn" style={{ color: '#16a34a', borderColor: '#dcfce3' }}><Download size={14} /> Export XLS</button>
                    </div>
                </div>

                {showFilters && (
                    <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                            <select className="filter-input" value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}>
                                <option value="ALL">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>From Date</label>
                            <input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setCurrentPage(1); }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Until Date</label>
                            <input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setCurrentPage(1); }} />
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Request ID</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Time Window</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 800 }}>No records found.</td></tr>
                            ) : (
                                filteredPermissions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((p) => {
                                    const style = getStatusStyle(p.status);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 950 }}>#{p.id}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>{p.date ? new Date(p.date).toLocaleDateString('en-GB') : '-'}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>{String(p.startTime || '').slice(0, 5)} - {String(p.endTime || '').slice(0, 5)}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 950 }}>{formatDuration(p.totalHours)}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', maxWidth: '300px' }}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.reason || '-'}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', border: '1.5px solid', background: style.bg, color: style.color, borderColor: style.border }}>
                                                    {String(p.status || 'Pending').toUpperCase()}
                                                </span>
                                                {p.updatedAt && p.status !== 'Pending' && (
                                                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                                                        {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredPermissions.length > rowsPerPage && (
                    <div style={{ padding: '12px 24px', borderTop: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Page {currentPage}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="btn-pagination" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.ceil(filteredPermissions.length / rowsPerPage) }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`btn-pagination ${currentPage === p ? 'active' : ''}`}>{p}</button>
                            ))}
                            <button disabled={currentPage >= Math.ceil(filteredPermissions.length / rowsPerPage)} onClick={() => setCurrentPage(currentPage + 1)} className="btn-pagination" style={{ opacity: currentPage >= Math.ceil(filteredPermissions.length / rowsPerPage) ? 0.3 : 1 }}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
