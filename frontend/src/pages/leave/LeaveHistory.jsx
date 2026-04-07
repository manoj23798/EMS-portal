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

export default function LeaveHistory() {
    const navigate = useNavigate();
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
            "Leave Type": l.leaveType,
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
        const matchesSearch = !searchTerm || l.leaveType.toLowerCase().includes(s) || String(l.id).includes(s);
        const matchesType = filters.type === 'ALL' || l.leaveType === filters.type;
        const matchesStatus = filters.status === 'ALL' || l.status === filters.status;
        const matchesDate = (!filters.dateFrom || new Date(l.startDate) >= new Date(filters.dateFrom)) &&
                           (!filters.dateTo || new Date(l.endDate) <= new Date(filters.dateTo));
        return matchesSearch && matchesType && matchesStatus && matchesDate;
    }).sort((a,b) => b.id - a.id);

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce3' };
        if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444', border: '#fee2e2' };
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' }; // Pending
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'white' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', fontSize: '11px', fontWeight: 950, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px' }}>Reclaiming History Archive...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: '0 24px 24px 24px', background: '#ffffff', minHeight: '100vh', width: '100%' }}>
            <style>{`
                .glass-card { background: white; border-radius: 20px; border: 1.5px solid #cbd5e1; box-shadow: 0 10px 40px rgba(0,0,0,0.03); overflow: hidden; }
                .action-btn { background: white; border: 1.5px solid #cbd5e1; padding: 8px 14px; border-radius: 10px; font-size: 10.5px; fontWeight: 950; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; text-transform: uppercase; }
                .action-btn:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
                .filter-input { padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; font-size: 11px; fontWeight: 800; outline: none; }
                .btn-pagination { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #cbd5e1; background: white; display: flex; alignItems: center; justifyContent: center; cursor: pointer; color: #1e293b; transition: 0.2s; }
                .btn-pagination:hover:not(:disabled) { border-color: #f97316; color: #f97316; }
                .btn-pagination.active { background: #f97316; color: white; border-color: #f97316; }
            `}</style>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/leave')} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', padding: '8px', border: '1.5px solid #fed7aa', borderRadius: '12px' }}>
                        <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 950, color: '#431407', textTransform: 'uppercase', letterSpacing: '-0.8px' }}>My Leave History</h1>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>View all your past leave requests</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                     <div style={{ position: 'relative', width: '260px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316' }} />
                        <input 
                            placeholder="Search by ID or type..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1.5px solid #f97316', fontSize: '12px', fontWeight: 800, background: 'white', outline: 'none', color: '#1e293b', boxShadow: '0 8px 20px rgba(249,115,22,0.06)' }} 
                        />
                    </div>
                    <button onClick={() => navigate('/leave/apply')} style={{ background: '#f97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 950, fontSize: '10.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
                        <Plus size={16}/> Apply for Leave
                    </button>
                </div>
            </div>

            {/* ActionBar */}
            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '12px 24px', borderBottom: '1.5px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Filters</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Status</label>
                            <select className="filter-input" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                                <option value="ALL">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Leave Category</label>
                            <select className="filter-input" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                <option value="ALL">All Categories</option>
                                <option value="Casual Leave">Casual</option>
                                <option value="Sick Leave">Sick</option>
                                <option value="Paid Leave">Paid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>From Date</label>
                            <input type="date" className="filter-input" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Until Date</label>
                            <input type="date" className="filter-input" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Request ID</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>LOP</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Balance</th>
                                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Dates</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Days</th>
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.length === 0 ? (
                                <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 800 }}>No records found.</td></tr>
                            ) : (
                                filteredLeaves.slice((currentPage - 1)*rowsPerPage, currentPage*rowsPerPage).map(l => {
                                    const style = getStatusColor(l.status);
                                    return (
                                        <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', background: '#fff7ed', color: '#f97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14}/></div>
                                                    <span style={{ fontSize: '13px', fontWeight: 950, color: '#1e293b' }}>#{l.id}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: 950, color: '#431407', textTransform: 'uppercase' }}>{l.leaveType}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 950, color: l.lopCount > 0 ? '#ef4444' : '#64748b' }}>{typeof l.lopCount === 'number' ? l.lopCount.toFixed(1).replace(/\.0$/, '') : 0}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 950, color: '#1e293b' }}>{typeof l.leaveBalance === 'number' ? l.leaveBalance.toFixed(1).replace(/\.0$/, '') : 0}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                                                {l.startDate} <ArrowRight size={10} style={{ verticalAlign: 'middle', margin: '0 4px' }} /> {l.endDate}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 950, color: '#1e293b' }}>
                                                {typeof l.totalDays === 'number' ? l.totalDays.toFixed(1).replace(/\.0$/, '') : l.totalDays} <span style={{ fontSize: '10px', color: '#94a3b8' }}>DAYS</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', 
                                                    border: '1.5px solid', background: style.bg, color: style.color, borderColor: style.border
                                                }}>{l.status?.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                 <button style={{ background: 'white', color: '#f97316', border: '1.5px solid #f97316', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 950, cursor: 'pointer', textTransform: 'uppercase' }}>Details</button>
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
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>Page {currentPage}</div>
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
