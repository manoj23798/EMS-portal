import React, { useState, useEffect } from 'react';
import { LeaveAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';
import {
    History, Search, Filter, Download, Plus, 
    Calendar, CheckCircle, XCircle, Clock, 
    ArrowRight, ChevronLeft, ChevronRight, 
    RotateCcw, FileText, Briefcase, Info
} from 'lucide-react';
 
import * as XLSX from 'xlsx';

export default function LeaveHistory({ embedded = false } = {}) {
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
    
    const [cancelModal, setCancelModal] = useState({ show: false, leaveId: null, reason: '' });
    const [modifyModal, setModifyModal] = useState({ show: false, leave: null, startDate: '', endDate: '', reason: '', totalDays: '' });

    const handleCancelSubmit = async (e) => {
        e.preventDefault();
        try {
            await LeaveAPI.cancel(cancelModal.leaveId, tokenManager.getUserData()?.employeeId, cancelModal.reason);
            setCancelModal({ show: false, leaveId: null, reason: '' });
            fetchLeaves();
        } catch (err) {
            console.error(err);
            alert("Failed to submit cancellation request");
        }
    };

    const handleModifySubmit = async (e) => {
        e.preventDefault();
        try {
            await LeaveAPI.modify(modifyModal.leave.id, tokenManager.getUserData()?.employeeId, {
                proposedStartDate: modifyModal.startDate,
                proposedEndDate: modifyModal.endDate,
                proposedTotalDays: Number(modifyModal.totalDays),
                proposedReason: modifyModal.reason
            });
            setModifyModal({ show: false, leave: null, startDate: '', endDate: '', reason: '', totalDays: '' });
            fetchLeaves();
        } catch (err) {
            console.error(err);
            alert("Failed to submit modification request");
        }
    };

    const formatDateToDDMMYYYY = (dateInput) => {
        if (!dateInput) return '';
        if (typeof dateInput === 'string') {
            const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return `${match[3]}-${match[2]}-${match[1]}`;
            }
        }
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return String(dateInput);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (e) {
            return String(dateInput);
        }
    };

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
            "Start": formatDateToDDMMYYYY(l.startDate),
            "End": formatDateToDDMMYYYY(l.endDate),
            "Days": l.totalDays,
            "Status": l.status,
            "Submitted On": formatDateToDDMMYYYY(l.submissionDate || l.createdAt) || 'N/A'
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
        const s = String(status).toLowerCase();
        if (s === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
        if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' };
        if (s === 'outdated') return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' }; // Pending / Default
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
                .btn-pagination:hover:not(:disabled) { border-color: #334155; color: #334155; }
                .btn-pagination.active { background: #334155; color: white; border-color: #334155; }
                .lh-tooltip-container { position: relative; display: inline-flex; align-items: center; cursor: pointer; margin-left: 4px; }
                .lh-tooltip-content { visibility: hidden; width: 220px; background-color: #0f172a; color: #fff; text-align: center; border-radius: 8px; padding: 10px; position: absolute; z-index: 100; bottom: 125%; right: -5px; opacity: 0; transition: opacity 0.2s, visibility 0.2s; font-size: 11px; font-weight: 500; line-height: 1.4; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #334155; text-transform: none; }
                .lh-tooltip-content::after { content: ""; position: absolute; top: 100%; right: 10px; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #334155 transparent transparent transparent; }
                .lh-tooltip-container:hover .lh-tooltip-content { visibility: visible; opacity: 1; }
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
                                <th style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.length === 0 ? (
                                <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 800 }}>No records found.</td></tr>
                            ) : (
                                filteredLeaves.slice((currentPage - 1)*rowsPerPage, currentPage*rowsPerPage).map(l => {
                                    const style = getStatusColor(l.status);
                                    return (
                                        <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: 950, color: '#431407', textTransform: 'uppercase' }}>{formatLeaveTypeLabel(l.leaveType)}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: 950, color: '#1e293b' }}>{l.reason || 'N/A'}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 950, color: l.lopCount > 0 ? '#ef4444' : '#64748b' }}>{typeof l.lopCount === 'number' ? l.lopCount.toFixed(1).replace(/\.0$/, '') : 0}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                                                {formatDateToDDMMYYYY(l.submissionDate || l.createdAt)}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                {formatDateToDDMMYYYY(l.startDate)} <ArrowRight size={10} style={{ verticalAlign: 'middle', margin: '0 4px' }} /> {formatDateToDDMMYYYY(l.endDate)}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 950, color: '#1e293b' }}>
                                                {typeof l.totalDays === 'number' ? l.totalDays.toFixed(1).replace(/\.0$/, '') : l.totalDays} <span style={{ fontSize: '10px', color: '#64748b' }}>DAYS</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    <span style={{ 
                                                        padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 950, textTransform: 'uppercase', 
                                                        border: '1.5px solid', background: style.bg, color: style.color, borderColor: style.border
                                                    }}>{l.status?.toUpperCase()}</span>
                                                    {l.status?.toLowerCase() === 'rejected' && l.remarks && (
                                                        <span className="lh-tooltip-container">
                                                            <Info size={14} color="#ef4444" />
                                                            <span className="lh-tooltip-content">
                                                                <div style={{ fontWeight: 800, borderBottom: '1px solid #475569', paddingBottom: '4px', marginBottom: '4px', textTransform: 'uppercase', color: '#f8fafc' }}>Rejection Reason</div>
                                                                <div style={{ color: '#e2e8f0', textAlign: 'left' }}>{l.remarks}</div>
                                                            </span>
                                                        </span>
                                                    )}
                                                    {l.status?.toLowerCase() === 'canceled' && l.cancelReason && (
                                                        <span className="lh-tooltip-container">
                                                            <Info size={14} color="#64748b" />
                                                            <span className="lh-tooltip-content">
                                                                <div style={{ fontWeight: 800, borderBottom: '1px solid #475569', paddingBottom: '4px', marginBottom: '4px', textTransform: 'uppercase', color: '#f8fafc' }}>Cancel Reason</div>
                                                                <div style={{ color: '#e2e8f0', textAlign: 'left' }}>{l.cancelReason}</div>
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                {['Approved', 'Rejected', 'Canceled'].includes(String(l.status || '')) && (l.updatedAt || l.approvedAt || l.rejectedAt) && (
                                                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                                                        {formatDateToDDMMYYYY(l.updatedAt || l.approvedAt || l.rejectedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                {l.actionStatus === 'CANCEL_REQUESTED' ? (
                                                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 900 }}>Cancel Requested</span>
                                                ) : l.actionStatus === 'MODIFY_REQUESTED' ? (
                                                    <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 900 }}>Modify Requested</span>
                                                ) : l.actionStatus === 'CANCEL_REJECTED' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 900 }}>Cancel Rejected</span>
                                                        {l.remarks && (
                                                            <span className="lh-tooltip-container">
                                                                <Info size={12} color="#dc2626" />
                                                                <span className="lh-tooltip-content">
                                                                    <div style={{ fontWeight: 800, borderBottom: '1px solid #475569', paddingBottom: '4px', marginBottom: '4px', textTransform: 'uppercase', color: '#f8fafc' }}>Rejection Reason</div>
                                                                    <div style={{ color: '#e2e8f0', textAlign: 'left' }}>{l.remarks}</div>
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : l.actionStatus === 'MODIFY_REJECTED' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 900 }}>Modify Rejected</span>
                                                        {l.remarks && (
                                                            <span className="lh-tooltip-container">
                                                                <Info size={12} color="#dc2626" />
                                                                <span className="lh-tooltip-content">
                                                                    <div style={{ fontWeight: 800, borderBottom: '1px solid #475569', paddingBottom: '4px', marginBottom: '4px', textTransform: 'uppercase', color: '#f8fafc' }}>Rejection Reason</div>
                                                                    <div style={{ color: '#e2e8f0', textAlign: 'left' }}>{l.remarks}</div>
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (['Pending', 'Approved'].includes(l.status) && (!l.actionStatus || ['NONE', 'CANCEL_REJECTED', 'MODIFY_REJECTED'].includes(l.actionStatus)) && new Date(l.startDate) >= new Date(new Date().setHours(0,0,0,0)) ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        {l.status !== 'Pending' && <button onClick={() => setModifyModal({ show: true, leave: l, startDate: l.startDate, endDate: l.endDate, reason: l.reason, totalDays: l.totalDays })} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', fontWeight: 900, color: '#0f172a' }}>MODIFY</button>}
                                                        <button onClick={() => setCancelModal({ show: true, leaveId: l.id, reason: '' })} style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', fontWeight: 900 }}>CANCEL</button>
                                                    </div>
                                                ) : <span style={{ color: '#cbd5e1' }}>-</span>)}
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

            {/* Cancel Modal */}
            {cancelModal.show && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Request Cancellation</h3>
                        <form onSubmit={handleCancelSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Reason</label>
                                <textarea 
                                    required
                                    rows="3"
                                    value={cancelModal.reason}
                                    onChange={(e) => setCancelModal({...cancelModal, reason: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                    placeholder="Why do you want to cancel?"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setCancelModal({ show: false, leaveId: null, reason: '' })} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f8fafc', border: 'none', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>BACK</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>SUBMIT</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modify Modal */}
            {modifyModal.show && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
                    <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Request Modification</h3>
                        <form onSubmit={handleModifySubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date</label>
                                    <input 
                                        type="date" required value={modifyModal.startDate}
                                        onChange={(e) => setModifyModal({...modifyModal, startDate: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>End Date</label>
                                    <input 
                                        type="date" required value={modifyModal.endDate}
                                        onChange={(e) => setModifyModal({...modifyModal, endDate: e.target.value})}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Days</label>
                                <input 
                                    type="number" step="0.5" required value={modifyModal.totalDays}
                                    onChange={(e) => setModifyModal({...modifyModal, totalDays: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Reason</label>
                                <textarea 
                                    required rows="3" value={modifyModal.reason}
                                    onChange={(e) => setModifyModal({...modifyModal, reason: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                    placeholder="Why do you want to modify?"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setModifyModal({ show: false, leave: null, startDate: '', endDate: '', reason: '', totalDays: '' })} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f8fafc', border: 'none', color: '#64748b', fontWeight: 900, cursor: 'pointer' }}>BACK</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>SUBMIT</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
