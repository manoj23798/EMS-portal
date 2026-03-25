import React, { useState, useEffect } from 'react';
import { LeaveAPI } from '../../services/api';
import { Calendar, FileText, Clock, TrendingUp } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';
import { useNavigate } from 'react-router-dom';

export default function LeaveDashboard() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const navigate = useNavigate();

    const [balances, setBalances] = useState([]);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!EMPLOYEE_ID) {
            setLoading(false);
            setBalances([]);
            setRecentLeaves([]);
            return;
        }
        try {
            setLoading(true);
            const [balanceRes, leavesRes] = await Promise.all([
                LeaveAPI.getBalance(EMPLOYEE_ID),
                LeaveAPI.getMy(EMPLOYEE_ID),
            ]);
            setBalances(balanceRes.data);
            setRecentLeaves(leavesRes.data.slice(0, 5));
        } catch (err) {
            console.error('Failed to fetch leave data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'status-active';
            case 'Rejected': return 'status-inactive';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading leave data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Calendar size={28} />
                        Leave Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Manage your leaves and permissions</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/leave/apply')}>
                        <FileText size={18} /> Apply Leave
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/permission/apply')}
                        style={{ background: 'var(--warning)', color: 'white' }}>
                        <Clock size={18} /> Apply Permission
                    </button>
                </div>
            </div>

            {/* Empty profile state for Admins/HR */}
            {!EMPLOYEE_ID && (
                <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 28 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Management user profile is not linked to a personal employee record.
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Use <strong>Leave History</strong> to view organization-wide records.
                    </p>
                    <button className="btn btn-secondary" onClick={() => navigate('/leave/history')} 
                        style={{ marginTop: 20 }}>
                        Go to History →
                    </button>
                </div>
            )}

            {/* Leave Balance Cards */}
            {EMPLOYEE_ID && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {balances.map((b) => (
                        <div key={b.id} className="card" style={{ padding: 20 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>{b.leaveType}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {b.remainingLeaves}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    / {b.totalLeaves}
                                </span>
                            </div>
                            <div style={{
                                marginTop: 10, height: 6, borderRadius: 3, background: 'var(--border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${b.totalLeaves > 0 ? ((b.usedLeaves / b.totalLeaves) * 100) : 0}%`,
                                    background: b.remainingLeaves <= 2 ? 'var(--danger)' : 'var(--primary)',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>
                                {b.usedLeaves} used
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Leave Requests */}
            {EMPLOYEE_ID && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Recent Leave Requests</span>
                        <button className="btn btn-secondary" onClick={() => navigate('/leave/history')}
                            style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                            View All →
                        </button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Leave Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeaves.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave requests yet.</td></tr>
                                ) : (
                                    recentLeaves.map(lr => (
                                        <tr key={lr.id}>
                                            <td style={{ fontWeight: 500 }}>{lr.leaveType}</td>
                                            <td>{lr.startDate}</td>
                                            <td>{lr.endDate}</td>
                                            <td>{lr.totalDays}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusColor(lr.status)}`}
                                                    style={lr.status === 'Pending' ? { background: 'rgba(248,150,30,0.1)', color: 'var(--warning)' } : {}}>
                                                    {lr.status}
                                                </span>
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
