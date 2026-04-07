import React, { useState, useEffect } from 'react';
import { 
    Calendar, Search, Filter, MoreHorizontal, Check, X, ChevronDown, CheckCircle2,
    ChevronLeft, ChevronRight, Globe, TrendingUp, AlertCircle, Clock, ShieldCheck
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import { LeaveStatsAPI, ManagerAPI } from '../../services/api';

const MiniCalendar = ({ stats }) => {
    const [currentDate, setCurrentDate] = useState(new Date()); // Default to today
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    const dayNames = ['S','M','T','W','T','F','S'];

    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ day: i, isCurrentMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
        cells.push({ day: i, isCurrentMonth: false });
    }

    // Dynamic markers from stats if available
    const leaveDays = []; 
    const holidayDays = []; 

    return (
        <div className="ma-custom-calendar">
            <div className="ma-cc-header">
                <div className="ma-cc-title">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year} <ChevronDown size={16} color="#94a3b8" />
                </div>
                <div className="ma-cc-nav">
                    <button onClick={prevMonth}><ChevronLeft size={16}/></button>
                    <button onClick={nextMonth}><ChevronRight size={16}/></button>
                </div>
            </div>
            <div className="ma-cc-grid">
                {dayNames.map((d, i) => <div key={`dn-${i}`} className="ma-cc-day-name">{d}</div>)}
                {cells.map((c, i) => {
                    let typeClass = '';
                    if (c.isCurrentMonth) {
                        // In a real app, we'd check if any leave exists on this date
                        if (leaveDays.includes(c.day)) typeClass = 'ma-cc-leave';
                        if (holidayDays.includes(c.day)) typeClass = 'ma-cc-holiday';
                    }
                    return (
                        <div key={i} className={`ma-cc-cell ${c.isCurrentMonth ? '' : 'ma-cc-muted'}`}>
                            <div className={`ma-cc-circle ${typeClass}`}>
                                {c.day}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="ma-cc-legend">
                <div className="ma-cc-legend-item">
                    <div className="ma-cc-legend-dot" style={{background:'#2dd4bf'}}></div> Leave
                </div>
                <div className="ma-cc-legend-item">
                    <div className="ma-cc-legend-dot" style={{background:'#ef4444'}}></div> Public Holiday
                </div>
            </div>
        </div>
    );
};

const ManagerApprovalPage = () => {
    const [stats, setStats] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => { fetchAllData(); }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [statsRes, pendingRes] = await Promise.all([
                LeaveStatsAPI.getAnalytics({}),
                ManagerAPI.getPendingLeaves()
            ]);
            setStats(statsRes.data);
            setPendingRequests(pendingRes.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch manager data", err);
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            setActionLoading(id);
            if (action === 'approve') await ManagerAPI.approveLeave(id, 1, 'Approved');
            else await ManagerAPI.rejectLeave(id, 1, 'Rejected');
            fetchAllData();
        } catch (err) { console.error(err); } finally { setActionLoading(null); }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingRequests.length && pendingRequests.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingRequests.map(r => r.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const COLORS = ['#10b981', '#3b82f6', '#14b8a6', '#64748b'];
    const overviewData = [
        {name:'Mon', employees:4}, 
        {name:'Tue', employees:6}, 
        {name:'Wed', employees:5}, 
        {name:'Thu', employees:7}, 
        {name:'Fri', employees:5}
    ];

    const CustomCheckbox = ({ checked, onClick }) => (
        <div className={`ma-checkbox-ui ${checked ? 'checked' : ''}`} onClick={onClick}>
            {checked && <Check size={12} strokeWidth={4} />}
        </div>
    );

    return (
        <div className="approval-portal-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .approval-portal-page {
                    padding: 32px;
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                    box-sizing: border-box;
                }

                .ma-grid-top {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    margin-bottom: 24px;
                }

                .ma-stat-card-ui {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    border: 1.5px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }

                .ma-stat-header-ui {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                }

                .ma-icon-circle {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    border-radius: 50%;
                    color: #ea580c;
                }

                .ma-stat-val-ui {
                    font-size: 42px;
                    font-weight: 950;
                    line-height: 1;
                    color: #0f172a;
                    letter-spacing: -1.5px;
                }

                .ma-stat-sub-ui {
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: 800;
                    margin-top: 4px;
                }

                .ma-pct-tag {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 950;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: fit-content;
                }

                .ma-grid-mid {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr 1fr 0.8fr;
                    gap: 24px;
                    margin-bottom: 24px;
                }

                .ma-card-ui {
                    background: white;
                    border-radius: 28px;
                    border: 1.5px solid #e2e8f0;
                    padding: 28px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }

                .ma-card-title-ui {
                    font-size: 14px;
                    font-weight: 950;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 24px;
                }

                .ma-table-container {
                    background: white;
                    border-radius: 28px;
                    border: 1.5px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }

                .ma-table-head-ui {
                    padding: 24px 32px;
                    border-bottom: 1.5px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ma-table-ui {
                    width: 100%;
                    border-collapse: collapse;
                }

                .ma-table-ui th {
                    padding: 16px 24px;
                    background: #fcfcfc;
                    border-bottom: 2px solid #f1f5f9;
                    font-size: 10px;
                    font-weight: 950;
                    text-transform: uppercase;
                    color: #94a3b8;
                    letter-spacing: 1.5px;
                    text-align: left;
                }

                .ma-table-ui td {
                    padding: 20px 24px;
                    border-bottom: 1.5px solid #f8fafc;
                    font-size: 13px;
                    font-weight: 800;
                    color: #1e293b;
                    vertical-align: middle;
                }

                .ma-checkbox-ui {
                    width: 18px;
                    height: 18px;
                    border: 2px solid #cbd5e1;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                    color: white;
                }

                .ma-checkbox-ui.checked {
                    background: #ea580c;
                    border-color: #ea580c;
                }

                .ma-status-label {
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                }

                .ma-btn-approve {
                    background: #ecfdf5;
                    color: #059669;
                    border: 1.5px solid #d1fae5;
                    border-radius: 12px;
                    padding: 8px 16px;
                    font-size: 11px;
                    font-weight: 950;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: 0.2s;
                }
                .ma-btn-approve:hover { background: #059669; color: white; }

                .ma-btn-reject {
                    background: #f8fafc;
                    color: #94a3b8;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .ma-btn-reject:hover { background: #fef2f2; color: #dc2626; border-color: #fee2e2; }

                /* Custom Calendar Overrides */
                .ma-cc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
                .ma-cc-day-name { font-size: 10px; font-weight: 950; color: #cbd5e1; text-align: center; margin-bottom: 8px; }
                .ma-cc-cell { display: flex; align-items: center; justify-content: center; height: 30px; }
                .ma-cc-circle { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; cursor: pointer; }
                .ma-cc-leave { background: #2dd4bf; color: white; }
                .ma-cc-holiday { background: #f43f5e; color: white; }
                .ma-cc-muted { opacity: 0.3; }
                .ma-cc-title { font-size: 15px; font-weight: 950; display: flex; align-items: center; gap: 8px; }
                .ma-cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="ma-grid-top">
                <div className="ma-stat-card-ui" style={{ background: '#ecfdf5', borderColor: '#d1fae5' }}>
                    <div className="ma-stat-header-ui" style={{ color: '#059669' }}>
                        <div className="ma-icon-circle" style={{ background: 'white' }}> <Calendar size={14} /> </div> 
                        On Leave (Today)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span className="ma-stat-val-ui" style={{ color: '#047857' }}>{stats?.onLeaveToday || 6}</span>
                        <span className="ma-stat-sub-ui">Employees</span>
                    </div>
                    <div className="ma-pct-tag" style={{ background: '#d1fae5', color: '#059669' }}>
                        <TrendingUp size={12}/> 4.7% <span style={{fontWeight: 700, marginLeft: '4px'}}>of workforce</span>
                    </div>
                </div>

                <div className="ma-stat-card-ui">
                    <div className="ma-stat-header-ui">
                        <div className="ma-icon-circle"> <Clock size={14} /> </div> 
                        Annual Leave
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span className="ma-stat-val-ui">{stats?.annualCount || 3}</span>
                        <span className="ma-stat-sub-ui">Employees</span>
                    </div>
                    <div className="ma-pct-tag" style={{ background: '#f1f5f9', color: '#64748b' }}> 50% <span style={{fontWeight: 700, marginLeft: '4px'}}>total share</span> </div>
                </div>

                <div className="ma-stat-card-ui">
                    <div className="ma-stat-header-ui">
                        <div className="ma-icon-circle" style={{ color: '#10b981' }}> <CheckCircle2 size={14} /> </div> 
                        Sick Leave
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span className="ma-stat-val-ui">{stats?.sickCount || 2}</span>
                        <span className="ma-stat-sub-ui">Employees</span>
                    </div>
                    <div className="ma-pct-tag" style={{ background: '#f1f5f9', color: '#64748b' }}> 33.3% <span style={{fontWeight: 700, marginLeft: '4px'}}>total share</span> </div>
                </div>

                <div className="ma-stat-card-ui">
                    <div className="ma-stat-header-ui">
                        <div className="ma-icon-circle" style={{ color: '#0ea5e9' }}> <Globe size={14} /> </div> 
                        Other Leaves
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span className="ma-stat-val-ui">{stats?.otherCount || 1}</span>
                        <span className="ma-stat-sub-ui">Employees</span>
                    </div>
                    <div className="ma-pct-tag" style={{ background: '#f1f5f9', color: '#64748b' }}> 16.7% <span style={{fontWeight: 700, marginLeft: '4px'}}>total share</span> </div>
                </div>
            </div>

            <div className="ma-grid-mid">
                <div className="ma-card-ui">
                    <div className="ma-card-title-ui">Leave Activity</div>
                    <div style={{ height: '220px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={overviewData}>
                                <defs>
                                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                <Bar dataKey="employees" fill="#e2e8f0" barSize={20} radius={[4, 4, 0, 0]} />
                                <Area type="monotone" dataKey="employees" fill="url(#velocityGrad)" stroke="#10b981" strokeWidth={3} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ma-card-ui">
                    <MiniCalendar stats={stats} />
                </div>

                <div className="ma-card-ui" style={{ overflowY: 'auto' }}>
                    <div className="ma-card-title-ui">Live Presence</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[{n: 'Lina Armand', t: 'Sick Leave', d: '20-22 Jun'}, {n: 'Jacob Yuen', t: 'Annual', d: '17-21 Jun'}, {n: 'Anya Rodri', t: 'Other', d: '19 Jun'}].map((emp, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: '#f8fafc' }}>
                                <img src={`https://i.pravatar.cc/150?u=${emp.n}`} style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#e2e8f0' }} alt=""/>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{emp.n}</div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}> <span style={{color: '#10b981'}}>{emp.t}</span> • {emp.d} </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ma-card-ui">
                    <div className="ma-card-title-ui">By Category</div>
                    <div style={{ height: '140px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{v:3}, {v:2}, {v:1}]} innerRadius={50} outerRadius={65} dataKey="v" stroke="none">
                                    <Cell fill="#10b981" /> <Cell fill="#3b82f6" /> <Cell fill="#e2e8f0" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a' }}>{stats?.onLeaveToday || 6}</span>
                            <span style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase' }}>On Leave</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="ma-table-container">
                <header className="ma-table-head-ui">
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>PENDING LEAVE REQUESTS</h2>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input style={{ padding: '10px 15px 10px 40px', borderRadius: '12px', border: '1.5px solid #f1f5f9', background: '#f8fafc', fontSize: '12px', fontWeight: 800, width: '250px' }} placeholder="Search employee or ID..." />
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: '1.5px solid #f1f5f9', borderRadius: '12px', background: '#f8fafc', fontSize: '11px', fontWeight: 950, color: '#64748b', cursor: 'pointer' }}>
                            <Filter size={14}/> Filter <ChevronDown size={14}/>
                        </button>
                    </div>
                </header>

                <table className="ma-table-ui">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}><CustomCheckbox checked={selectedIds.length === pendingRequests.length && pendingRequests.length > 0} onClick={toggleSelectAll} /></th>
                            <th>Employee</th>
                            <th>Role / Designation</th>
                            <th>Leave Type</th>
                            <th>LOP Count</th>
                            <th>Balance</th>
                            <th>Submitted On</th>
                            <th>Dates</th>
                            <th style={{ textAlign: 'center' }}>Total Days</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map((lr) => (
                            <tr key={lr.id}>
                                <td><CustomCheckbox checked={selectedIds.includes(lr.id)} onClick={() => toggleSelect(lr.id)} /></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img src={`https://i.pravatar.cc/150?u=${lr.employeeId}`} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9' }} alt=""/>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{lr.employeeName}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>ID: EMP-{String(lr.employeeId).slice(-4)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 800 }}>{lr.designation || 'Software Engineer'}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>{lr.department || 'Engineering'}</div>
                                </td>
                                <td> <span style={{ color: '#ea580c', fontWeight: 900 }}>{lr.leaveType}</span> </td>
                                <td> <span style={{ fontWeight: 800, color: lr.lopCount > 0 ? '#ef4444' : '#64748b' }}>{typeof lr.lopCount === 'number' ? lr.lopCount.toFixed(1).replace(/\.0$/, '') : 0} Days</span> </td>
                                <td> <span style={{ fontWeight: 800, color: '#1e293b' }}>{typeof lr.leaveBalance === 'number' ? lr.leaveBalance.toFixed(1).replace(/\.0$/, '') : 0} Days</span> </td>
                                <td style={{ color: '#64748b' }}>{new Date(lr.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>{new Date(lr.startDate).getDate()} - {new Date(lr.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td style={{ textAlign: 'center' }}>{typeof lr.totalDays === 'number' ? lr.totalDays.toFixed(1).replace(/\.0$/, '') : lr.totalDays} Days</td>
                                <td>
                                    {lr.status === 'Approved' ? (
                                        <span className="ma-status-label" style={{ background: '#ecfdf5', color: '#059669' }}>Approved</span>
                                    ) : lr.status === 'Rejected' ? (
                                        <span className="ma-status-label" style={{ background: '#fef2f2', color: '#dc2626' }}>Rejected</span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button className="ma-btn-approve" onClick={() => handleAction(lr.id, 'approve')}>
                                                <Check size={14} strokeWidth={4} /> Approve
                                            </button>
                                            <button className="ma-btn-reject" onClick={() => handleAction(lr.id, 'reject')}>
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                            <tr>
                                <td colSpan="10" style={{ padding: '100px 0', textAlign: 'center' }}>
                                    <ShieldCheck size={64} style={{ color: '#f1f5f9', marginBottom: '20px' }} />
                                    <div style={{ fontSize: '12px', fontWeight: 950, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '4px' }}>No pending requests</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ManagerApprovalPage;
