import React, { useState, useEffect } from 'react';
import { ManagerAPI } from '../../services/api';
import { ShieldCheck, Check, X } from 'lucide-react';

export default function ManagerApprovalPage() {
    const MANAGER_ID = 1; // In production, from auth context

    const [leaves, setLeaves] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [tab, setTab] = useState('leaves');
    const [remarks, setRemarks] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [lRes, pRes] = await Promise.all([
                ManagerAPI.getPendingLeaves(),
                ManagerAPI.getPendingPermissions(),
            ]);
            setLeaves(lRes.data);
            setPermissions(pRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveAction = async (id, action) => {
        try {
            setActionLoading(id);
            const remark = remarks[`leave-${id}`] || '';
            if (action === 'approve') {
                await ManagerAPI.approveLeave(id, MANAGER_ID, remark);
            } else {
                await ManagerAPI.rejectLeave(id, MANAGER_ID, remark);
            }
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermAction = async (id, action) => {
        try {
            setActionLoading(id);
            if (action === 'approve') {
                await ManagerAPI.approvePermission(id, MANAGER_ID);
            } else {
                await ManagerAPI.rejectPermission(id, MANAGER_ID);
            }
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parts[1];
        return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <div className="page-content">
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={28} />
                    Manager Approval Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Review and approve/reject pending leave and permission requests</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
                <button onClick={() => setTab('leaves')}
                    className={`btn ${tab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', position: 'relative' }}>
                    Leave Requests
                    {leaves.length > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white',
                            borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>{leaves.length}</span>
                    )}
                </button>
                <button onClick={() => setTab('permissions')}
                    className={`btn ${tab === 'permissions' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', position: 'relative' }}>
                    Permission Requests
                    {permissions.length > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white',
                            borderRadius: '50%', width: 20, height: 20, fontSize: '0.7rem', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>{permissions.length}</span>
                    )}
                </button>
            </div>

            {/* Leave Requests */}
            {tab === 'leaves' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Pending Leave Requests ({leaves.length})</span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>Dates</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Remarks</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : leaves.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pending leave requests.</td></tr>
                                ) : (
                                    leaves.map(lr => (
                                        <tr key={lr.id}>
                                            <td style={{ fontWeight: 500 }}>{lr.employeeName}</td>
                                            <td>{lr.leaveType}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{lr.startDate} → {lr.endDate}</td>
                                            <td>{lr.totalDays}</td>
                                            <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lr.reason || '-'}</td>
                                            <td>
                                                <input type="text" className="form-input" placeholder="Add remarks..."
                                                    style={{ fontSize: '0.85rem', padding: '6px 10px', minWidth: 120 }}
                                                    value={remarks[`leave-${lr.id}`] || ''}
                                                    onChange={(e) => setRemarks({ ...remarks, [`leave-${lr.id}`]: e.target.value })} />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        disabled={actionLoading === lr.id}
                                                        onClick={() => handleLeaveAction(lr.id, 'approve')}>
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }}
                                                        disabled={actionLoading === lr.id}
                                                        onClick={() => handleLeaveAction(lr.id, 'reject')}>
                                                        <X size={16} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Permission Requests */}
            {tab === 'permissions' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Pending Permission Requests ({permissions.length})</span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Hours</th>
                                    <th>Reason</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : permissions.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pending permission requests.</td></tr>
                                ) : (
                                    permissions.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 500 }}>{p.employeeName}</td>
                                            <td>{p.date}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{formatTime(p.startTime)} → {formatTime(p.endTime)}</td>
                                            <td>{p.totalHours != null ? `${Math.floor(p.totalHours / 60)}h ${p.totalHours % 60}m` : '-'}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.reason || '-'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        disabled={actionLoading === p.id}
                                                        onClick={() => handlePermAction(p.id, 'approve')}>
                                                        <Check size={16} /> Approve
                                                    </button>
                                                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }}
                                                        disabled={actionLoading === p.id}
                                                        onClick={() => handlePermAction(p.id, 'reject')}>
                                                        <X size={16} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
