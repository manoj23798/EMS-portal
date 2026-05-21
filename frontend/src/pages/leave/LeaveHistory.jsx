import React, { useState, useEffect } from 'react';
import { LeaveAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import { 
    History, Search, Filter, Download, Plus, 
    Calendar, CheckCircle, XCircle, Clock, 
    ArrowRight, ChevronLeft, ChevronRight, 
    RotateCcw, FileText, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function LeaveHistory({ embedded = false } = {}) {
    const navigate = useNavigate();
    const formatLeaveTypeLabel = (leaveType) => {
        const normalized = String(leaveType || '').trim().toLowerCase();
        return normalized === 'urgent leave' ? 'Unplanned Leave' : (leaveType || 'Leave');
    };
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        type: 'ALL',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const getSubmittedTimestamp = (leave) => {
        const submittedValue = leave?.submissionDate || leave?.submittedAt || leave?.createdAt || leave?.appliedDate || leave?.startDate;
        const time = submittedValue ? new Date(submittedValue).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await LeaveAPI.getMy(tokenManager.getUserData()?.employeeId);
            setLeaves(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setFilters({ type: 'ALL', status: 'ALL', dateFrom: '', dateTo: '' });
        setCurrentPage(1);
    };

    const exportData = () => {
        const data = filteredLeaves.map(l => ({
            "Req ID": `#${l.id}`,
            "Leave Type": formatLeaveTypeLabel(l.leaveType),
            "Start": l.startDate,
            "End": l.endDate,
            "Days": l.totalDays,
            "Status": l.status,
            "Submitted On": l.submissionDate || 'N/A'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LeaveHistory");
        XLSX.writeFile(wb, "Leave_History.xlsx");
    };

    const filteredLeaves = leaves.filter(l => {
        const s = searchTerm.toLowerCase();
        const displayType = formatLeaveTypeLabel(l.leaveType).toLowerCase();
        const rawType = String(l.leaveType || '').toLowerCase();
        const matchesSearch = !searchTerm || displayType.includes(s) || rawType.includes(s) || String(l.id).includes(s);
        const matchesType = filters.type === 'ALL' || l.leaveType === filters.type;
        const matchesStatus = filters.status === 'ALL' || l.status === filters.status;
        const matchesDate = (!filters.dateFrom || new Date(l.startDate) >= new Date(filters.dateFrom)) &&
                           (!filters.dateTo || new Date(l.endDate) <= new Date(filters.dateTo));
        return matchesSearch && matchesType && matchesStatus && matchesDate;
    }).sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a));

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce3' };
        if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444', border: '#fee2e2' };
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' }; // Pending
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: 'transparent' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', fontSize: '11px', fontWeight: 950, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px' }}>Reclaiming History Archive...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: embedded ? '0' : '0 24px 24px 24px', background: 'transparent', minHeight: embedded ? 'auto' : 'auto', width: '100%' }}>
            <style>{`
                .glass-card { background: white; border-radius: 20px; border: 1.5px solid #cbd5e1; box-shadow: 0 10px 40px rgba(0,0,0,0.03); overflow: hidden; }
                .action-btn { background: white; border: 1.5px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 10.5px; fontWeight: 950; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; text-transform: uppercase; }
                .action-btn:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
                .filter-input { padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; font-size: 11px; fontWeight: 800; outline: none; }
                .btn-pagination { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #cbd5e1; background: white; display: flex; alignItems: center; justifyContent: center; cursor: pointer; color: #1e293b; transition: 0.2s; }
                .btn-pagination:hover:not(:disabled) { border-color: #f97316; color: #f97316; }
                .btn-pagination.active { background: #f97316; color: white; border-color: #f97316; }
            `}</style>

            {/* ActionBar */}
            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '12px 24px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Filters</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '260px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316' }} />
                            <input
                                placeholder="Search by ID or type..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1.5px solid #f97316', fontSize: '12px', fontWeight: 800, background: 'white', outline: 'none', color: '#1e293b', boxShadow: '0 8px 20px rgba(249,115,22,0.06)' }}
                            />
                        </div>
                         <button onClick={() => setShowFilters(!showFilters)} className="action-btn" style={{ background: showFilters ? '#fff7ed' : 'white', borderColor: showFilters ? '#f97316' : '#cbd5e1' }}>
                            <Filter size={14} color="#f97316" /> Show Filters
                        </button>
                        <button onClick={handleReset} className="action-btn"><RotateCcw size={14} /> Clear</button>
                        <button onClick={exportData} className="action-btn" style={{ color: '#16a34a', borderColor: '#dcfce3' }}><Download size={14} /> Export XLS</button>
                    </div>
                </div>

                {showFilters && (
                    <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f8fafc', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                            <select className="filter-input" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                                <option value="ALL">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Leave Category</label>
                            <select className="filter-input" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                <option value="ALL">All Categories</option>
                                <option value="Planned Leave">Planned Leave</option>
                                <option value="Urgent Leave">Unplanned Leave</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>From Date</label>
                            <input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Until Date</label>
                            <input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Leave Type</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>LOP Count</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Submitted On</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Dates</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Total Days</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 800 }}>No records found.</td></tr>
                            ) : (
                                filteredLeaves.slice((currentPage - 1)*rowsPerPage, currentPage*rowsPerPage).map(l => {
                                    const style = getStatusColor(l.status);
                                    return (
                                        <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: 950, color: '#431407', textTransform: 'uppercase' }}>{formatLeaveTypeLabel(l.leaveType)}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: 950, color: '#1e293b' }}>{l.reason || 'N/A'}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 950, color: l.lopCount > 0 ? '#ef4444' : '#64748b' }}>{typeof l.lopCount === 'number' ? l.lopCount.toFixed(1).replace(/\.0$/, '') : 0}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                                                {new Date(l.submissionDate || l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                                                {l.startDate} <ArrowRight size={10} style={{ verticalAlign: 'middle', margin: '0 4px' }} /> {l.endDate}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 950, color: '#1e293b' }}>
                                                {typeof l.totalDays === 'number' ? l.totalDays.toFixed(1).replace(/\.0$/, '') : l.totalDays} <span style={{ fontSize: '10px', color: '#64748b' }}>DAYS</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', 
                                                    border: '1.5px solid', background: style.bg, color: style.color, borderColor: style.border
                                                }}>{l.status?.toUpperCase()}</span>
                                                {['Approved', 'Rejected'].includes(String(l.status || '')) && (l.updatedAt || l.approvedAt || l.rejectedAt) && (
                                                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                                                        {new Date(l.updatedAt || l.approvedAt || l.rejectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
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

                {/* Pagination */}
                {filteredLeaves.length > rowsPerPage && (
                    <div style={{ padding: '12px 24px', borderTop: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Page {currentPage}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="btn-pagination" style={{ opacity: currentPage === 1 ? 0.3 : 1 }}><ChevronLeft size={16}/></button>
                            {Array.from({ length: Math.ceil(filteredLeaves.length / rowsPerPage) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`btn-pagination ${currentPage === p ? 'active' : ''}`}>{p}</button>
                            ))}
                            <button disabled={currentPage >= Math.ceil(filteredLeaves.length / rowsPerPage)} onClick={() => setCurrentPage(currentPage + 1)} className="btn-pagination" style={{ opacity: currentPage >= Math.ceil(filteredLeaves.length / rowsPerPage) ? 0.3 : 1 }}><ChevronRight size={16}/></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
