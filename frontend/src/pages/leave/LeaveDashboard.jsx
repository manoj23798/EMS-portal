import React, { useState, useEffect } from 'react';
import { LeaveAPI } from '../../services/api';
import { 
    Calendar, FileText, Clock, TrendingUp, Plus, 
    ArrowRight, CheckCircle, AlertCircle, XCircle, History
} from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';
import { useNavigate } from 'react-router-dom';

export default function LeaveDashboard() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const navigate = useNavigate();

    const [balances, setBalances] = useState([]);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const [timeRange, setTimeRange] = useState('month'); // week, month, year

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!EMPLOYEE_ID) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [balanceRes, leavesRes] = await Promise.all([
                LeaveAPI.getBalance(EMPLOYEE_ID),
                LeaveAPI.getMy(EMPLOYEE_ID),
            ]);
            setBalances(Array.isArray(balanceRes.data) ? balanceRes.data : []);
            setRecentLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
        } catch (err) {
            console.error('LeaveDashboard Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === 'approved') return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce3' };
        if (s === 'rejected') return { bg: '#fef2f2', color: '#ef4444', border: '#fee2e2' };
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' }; // Pending
    };

    const getMetrics = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let filtered = recentLeaves;
        if (timeRange === 'month') {
            filtered = recentLeaves.filter(l => new Date(l.startDate).getMonth() === currentMonth && new Date(l.startDate).getFullYear() === currentYear);
        } else if (timeRange === 'year') {
            filtered = recentLeaves.filter(l => new Date(l.startDate).getFullYear() === currentYear);
        } else if (timeRange === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0,0,0,0);
            filtered = recentLeaves.filter(l => new Date(l.startDate) >= startOfWeek);
        }

        return {
            totalLeave: filtered.filter(l => l.status === 'Approved').reduce((acc, l) => acc + l.totalDays, 0),
            lopCount: filtered.reduce((acc, l) => acc + (l.lopCount || 0), 0),
            pending: filtered.filter(l => l.status === 'Pending').length,
            approved: filtered.filter(l => l.status === 'Approved').length,
            rejected: filtered.filter(l => l.status === 'Rejected').length,
            balance: balances.reduce((acc, b) => acc + (b.remainingLeaves || 0), 0)
        };
    };

    const metrics = getMetrics();

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
                <div style={{ width: '50px', height: '50px', border: '5px solid #e2e8f0', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '20px', fontSize: '12px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px' }}>Polling Absence Registry...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="employee-dashboard-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .employee-dashboard-page {
                    padding: 40px;
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                    box-sizing: border-box;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .title-unit h1 {
                    font-size: 32px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -1px;
                    color: #0f172a;
                }

                .subtitle-unit {
                    font-size: 11px;
                    font-weight: 800;
                    color: #ea580c;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    margin-top: 4px;
                }

                .action-cluster {
                    display: flex;
                    gap: 15px;
                }

                .btn-primary-premium {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    padding: 14px 28px;
                    border-radius: 18px;
                    font-weight: 900;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 25px rgba(234, 88, 12, 0.25);
                }

                .btn-secondary-premium {
                    background: white;
                    color: #0f172a;
                    border: 1.5px solid #e2e8f0;
                    padding: 14px 28px;
                    border-radius: 18px;
                    font-weight: 900;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .btn-secondary-premium:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    background: #fff7ed;
                }

                .balances-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 25px;
                    margin-bottom: 40px;
                }

                .balance-card-ui {
                    background: white;
                    border-radius: 30px;
                    border: 1.5px solid #e2e8f0;
                    padding: 30px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .balance-card-ui:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 45px rgba(0,0,0,0.04);
                }

                .balance-type-label {
                    font-size: 10px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 10px;
                    display: block;
                }

                .balance-val-group {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .balance-val-big {
                    font-size: 38px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -1.5px;
                }

                .balance-val-total {
                    font-size: 14px;
                    font-weight: 800;
                    color: #cbd5e1;
                }

                .progress-track-ui {
                    height: 8px;
                    width: 100%;
                    background: #f1f5f9;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }

                .progress-fill-ui {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .archive-panel-ui {
                    background: white;
                    border-radius: 35px;
                    border: 1.5px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }

                .panel-header-ui {
                    padding: 25px 35px;
                    border-bottom: 1.5px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .table-ui-premium {
                    width: 100%;
                    border-collapse: collapse;
                }

                .table-ui-premium th {
                    padding: 18px 30px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    background: #fcfcfc;
                    border-bottom: 2px solid #f1f5f9;
                }

                .table-ui-premium td {
                    padding: 22px 30px;
                    border-bottom: 1.5px solid #f8fafc;
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                }

                .status-pill-ui {
                    padding: 8px 16px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: 1.5px solid;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .empty-state-card {
                    padding: 80px;
                    text-align: center;
                    background: white;
                    border-radius: 40px;
                    border: 2px dashed #e2e8f0;
                }

                .stats-container-premium {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr 2fr;
                    gap: 20px;
                    margin-bottom: 35px;
                }

                .metric-box-premium {
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 28px;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                }

                .range-switch-ui {
                    display: flex;
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 4px;
                    gap: 4px;
                    width: fit-content;
                    margin-bottom: 15px;
                }

                .switch-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 9px;
                    font-weight: 950;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #94a3b8;
                    background: transparent;
                }

                .switch-btn.active {
                    background: white;
                    color: #0f172a;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }

                .status-box-consolidated {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 28px;
                    overflow: hidden;
                }

                .status-section {
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .status-section:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 25%;
                    bottom: 25%;
                    width: 1.5px;
                    background: #f1f5f9;
                }

                .stat-label-ui {
                    font-size: 10px;
                    font-weight: 950;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                }

                .stat-value-ui {
                    font-size: 26px;
                    font-weight: 950;
                    color: #0f172a;
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }

                .stat-unit-ui {
                    font-size: 10px;
                    color: #cbd5e1;
                    font-weight: 800;
                }
            `}</style>

            <header className="dashboard-header">
                <div className="title-unit">
                    <h1>LEAVE DASHBOARD</h1>
                    <div className="subtitle-unit">Manage your leave requests</div>
                </div>
                <div className="action-cluster">
                    <button onClick={() => navigate('/leave/apply')} className="btn-primary-premium"> <Plus size={20}/> REQUEST LEAVE </button>
                    <button onClick={() => navigate('/permission/apply')} className="btn-secondary-premium"> <Clock size={20}/> REQUEST PERMISSION </button>
                </div>
            </header>

            {!EMPLOYEE_ID ? (
                <article className="empty-state-card">
                    <div style={{ width: '80px', height: '80px', borderRadius: '25px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                        <AlertCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px' }}>SYSTEM IDENTITY REQUIRED</h2>
                    <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '500px', margin: '0 auto 30px', fontWeight: 800 }}>Account linkage to employee registry not detected. Administrative access only through the archival interface.</p>
                    <button onClick={() => navigate('/leave/history')} className="btn-primary-premium" style={{ margin: '0 auto' }}> ACCESS ARCHIVAL LOGS <ArrowRight size={18} /> </button>
                </article>
            ) : (
                <>
                    <section className="balances-row">
                        {balances.map((b) => (
                            <div key={b.id || b.leaveType} className="balance-card-ui">
                                <span className="balance-type-label">{b.leaveType}</span>
                                <div className="balance-val-group">
                                    <span className="balance-val-big">{typeof b.remainingLeaves === 'number' ? b.remainingLeaves.toFixed(1).replace(/\.0$/, '') : 0}</span>
                                    <span className="balance-val-total">/ {typeof b.totalLeaves === 'number' ? b.totalLeaves.toFixed(1).replace(/\.0$/, '') : 0} REMAINING</span>
                                </div>
                                <div className="progress-track-ui">
                                    <div className="progress-fill-ui" style={{ 
                                        width: `${b.totalLeaves > 0 ? (b.remainingLeaves / b.totalLeaves) * 100 : 0}%`, 
                                        background: b.remainingLeaves <= 2 ? '#f43f5e' : '#ea580c'
                                    }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>
                                    <span>USED: {typeof b.usedLeaves === 'number' ? b.usedLeaves.toFixed(1).replace(/\.0$/, '') : 0} DAYS</span>
                                    <TrendingUp size={14} style={{ opacity: 0.5 }} />
                                </div>
                            </div>
                        ))}
                    </section>
                    
                    <div className="stats-container-premium">
                        <article className="metric-box-premium">
                            <div className="range-switch-ui">
                                <button className={`switch-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Week</button>
                                <button className={`switch-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Month</button>
                                <button className={`switch-btn ${timeRange === 'year' ? 'active' : ''}`} onClick={() => setTimeRange('year')}>Year</button>
                            </div>
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <div>
                                    <span className="stat-label-ui">Total Leave</span>
                                    <div className="stat-value-ui">{typeof metrics.totalLeave === 'number' ? metrics.totalLeave.toFixed(1).replace(/\.0$/, '') : 0} <span className="stat-unit-ui">DAYS</span></div>
                                </div>
                                <div>
                                    <span className="stat-label-ui">LOP</span>
                                    <div className="stat-value-ui" style={{ color: metrics.lopCount > 0 ? '#ef4444' : '#0f172a' }}>{typeof metrics.lopCount === 'number' ? metrics.lopCount.toFixed(1).replace(/\.0$/, '') : 0} <span className="stat-unit-ui">DAYS</span></div>
                                </div>
                            </div>
                        </article>

                        <article className="metric-box-premium" style={{ background: '#fff7ed', border: '1.5px solid #ffedd5' }}>
                            <span className="stat-label-ui" style={{ color: '#ea580c' }}>Balance Leave</span>
                            <div className="stat-value-ui" style={{ color: '#ea580c' }}>{typeof metrics.balance === 'number' ? metrics.balance.toFixed(1).replace(/\.0$/, '') : 0} <span className="stat-unit-ui" style={{ color: '#f97316', opacity: 0.6 }}>DAYS</span></div>
                        </article>

                        <div className="status-box-consolidated">
                            <div className="status-section">
                                <span className="stat-label-ui">Pending</span>
                                <div className="stat-value-ui" style={{ color: '#f59e0b' }}>{metrics.pending} <span className="stat-unit-ui">REQS</span></div>
                            </div>
                            <div className="status-section">
                                <span className="stat-label-ui">Approval</span>
                                <div className="stat-value-ui" style={{ color: '#16a34a' }}>{metrics.approved} <span className="stat-unit-ui">REQS</span></div>
                            </div>
                            <div className="status-section">
                                <span className="stat-label-ui">Rejected</span>
                                <div className="stat-value-ui" style={{ color: '#ef4444' }}>{metrics.rejected} <span className="stat-unit-ui">REQS</span></div>
                            </div>
                        </div>
                    </div>

                    <section className="archive-panel-ui">
                        <header className="panel-header-ui">
                            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} style={{ color: '#ea580c' }} /> RECENT LEAVE REQUESTS
                            </h3>
                            <button onClick={() => navigate('/leave/history')} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '11px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                VIEW ALL HISTORY <ArrowRight size={16} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                            </button>
                        </header>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-ui-premium">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>LOP</th>
                                        <th>Balance</th>
                                        <th>Dates</th>
                                        <th style={{ textAlign: 'center' }}>Days</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLeaves.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '100px 0', textAlign: 'center' }}>
                                                <FileText size={60} style={{ color: '#f1f5f9', marginBottom: '20px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '4px' }}>No leave history found</div>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentLeaves.slice(0, 8).map(lr => {
                                            const statusStyle = getStatusStyle(lr.status);
                                            return (
                                                <tr key={lr.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 900, color: '#0f172a' }}>{lr.leaveType}</div>
                                                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>UID: #{String(lr.id).padStart(6, '0')}</div>
                                                    </td>
                                                    <td><span style={{ fontWeight: 800, color: lr.isLop ? '#ef4444' : '#64748b' }}>{typeof lr.lopCount === 'number' ? lr.lopCount.toFixed(1).replace(/\.0$/, '') : 0}</span></td>
                                                    <td><span style={{ fontWeight: 800, color: '#1e293b' }}>{typeof lr.leaveBalance === 'number' ? lr.leaveBalance.toFixed(1).replace(/\.0$/, '') : 0}</span></td>
                                                    <td>
                                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                                                            {new Date(lr.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} → {new Date(lr.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '16px', fontWeight: 900 }}>{typeof lr.totalDays === 'number' ? lr.totalDays.toFixed(1).replace(/\.0$/, '') : lr.totalDays}</span>
                                                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px', fontWeight: 800 }}>DAYS</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="status-pill-ui" style={{ 
                                                            background: statusStyle.bg, 
                                                            color: statusStyle.color, 
                                                            borderColor: statusStyle.border 
                                                        }}>
                                                            {lr.status === 'Approved' ? <CheckCircle size={12}/> : lr.status === 'Rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                                                            {lr.status?.toUpperCase() || 'SYNCHRONIZING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
