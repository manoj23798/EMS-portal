import React, { useState, useEffect } from 'react';
import { LeaveAPI, PermissionAPI } from '../../services/api';
import { History } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function LeaveHistory() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;

    const [leaves, setLeaves] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('leaves');
    const [viewScope, setViewScope] = useState('my'); // 'my' or 'org'
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userData?.role);

    useEffect(() => {
        fetchData();
    }, [viewScope]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (viewScope === 'org') {
                const [lRes, pRes] = await Promise.all([
                    LeaveAPI.getAll(),
                    PermissionAPI.getAll(),
                ]);
                setLeaves(lRes.data);
                setPermissions(pRes.data);
            } else {
                if (!EMPLOYEE_ID) {
                    setLeaves([]);
                    setPermissions([]);
                    return;
                }
                const [lRes, pRes] = await Promise.all([
                    LeaveAPI.getMy(EMPLOYEE_ID),
                    PermissionAPI.getMy(EMPLOYEE_ID),
                ]);
                setLeaves(lRes.data);
                setPermissions(pRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'status-active';
            case 'Rejected': return 'status-inactive';
            default: return '';
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
                    <History size={28} />
                    Leave & Permission History
                </h1>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    <button onClick={() => setTab('leaves')}
                        className={`btn ${tab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                        Leave Requests
                    </button>
                    <button onClick={() => setTab('permissions')}
                        className={`btn ${tab === 'permissions' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                        Permission Requests
                    </button>
                </div>

                {isHRorAdmin && (
                    <div style={{ display: 'flex', background: 'var(--surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <button onClick={() => setViewScope('my')}
                            style={{ 
                                padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', 
                                background: viewScope === 'my' ? 'var(--primary)' : 'transparent', 
                                color: viewScope === 'my' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                            }}>
                            My History
                        </button>
                        <button onClick={() => setViewScope('org')}
                            style={{ 
                                padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', 
                                background: viewScope === 'org' ? 'var(--primary)' : 'transparent', 
                                color: viewScope === 'org' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                            }}>
                            Organization
                        </button>
                    </div>
                )}
            </div>

            {/* Empty profile state for Admins/HR */}
            {viewScope === 'my' && !EMPLOYEE_ID && !loading && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Management user profile is not linked to a personal employee record.
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Switch to <strong>Organization</strong> view to see all employee records.
                    </p>
                </div>
            )}

            {/* Leave Table */}
            {tab === 'leaves' && (viewScope === 'org' || EMPLOYEE_ID) && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">
                            {viewScope === 'org' ? 'Organization Leave History' : 'My Leave Requests'} ({leaves.length})
                        </span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {viewScope === 'org' && <th>Employee</th>}
                                    <th>Leave Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Approved By</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={viewScope === 'org' ? "8" : "7"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : leaves.length === 0 ? (
                                    <tr><td colSpan={viewScope === 'org' ? "8" : "7"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave requests found.</td></tr>
                                ) : (
                                    leaves.map(lr => (
                                        <tr key={lr.id}>
                                            {viewScope === 'org' && <td style={{ fontWeight: 600 }}>{lr.employeeName}</td>}
                                            <td style={{ fontWeight: 500 }}>{lr.leaveType}</td>
                                            <td>{lr.startDate}</td>
                                            <td>{lr.endDate}</td>
                                            <td>{lr.totalDays}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusStyle(lr.status)}`}
                                                    style={lr.status === 'Pending' ? { background: 'rgba(248,150,30,0.1)', color: 'var(--warning)' } : {}}>
                                                    {lr.status}
                                                </span>
                                            </td>
                                            <td>{lr.approvedByName || '-'}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lr.remarks || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Permission Table */}
            {tab === 'permissions' && (viewScope === 'org' || EMPLOYEE_ID) && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">
                            {viewScope === 'org' ? 'Organization Permission History' : 'My Permission Requests'} ({permissions.length})
                        </span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {viewScope === 'org' && <th>Employee</th>}
                                    <th>Date</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Hours</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Approved By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={viewScope === 'org' ? "8" : "7"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : permissions.length === 0 ? (
                                    <tr><td colSpan={viewScope === 'org' ? "8" : "7"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No permission requests found.</td></tr>
                                ) : (
                                    permissions.map(p => (
                                        <tr key={p.id}>
                                            {viewScope === 'org' && <td style={{ fontWeight: 600 }}>{p.employeeName}</td>}
                                            <td style={{ fontWeight: 500 }}>{p.date}</td>
                                            <td>{formatTime(p.startTime)}</td>
                                            <td>{formatTime(p.endTime)}</td>
                                            <td>{p.totalHours != null ? `${Math.floor(p.totalHours / 60)}h ${p.totalHours % 60}m` : '-'}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.reason || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusStyle(p.status)}`}
                                                    style={p.status === 'Pending' ? { background: 'rgba(248,150,30,0.1)', color: 'var(--warning)' } : {}}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td>{p.approvedByName || '-'}</td>
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
