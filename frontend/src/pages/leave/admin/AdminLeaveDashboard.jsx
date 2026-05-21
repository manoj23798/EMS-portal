import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Calendar, Clock, AlertCircle, 
    PieChart as PieIcon, BarChart3, LineChart as LineIcon,
    Filter, ArrowUpRight, ArrowDownRight, Search,
    ChevronLeft, ChevronRight, MoreHorizontal, Download,
    CheckCircle, XCircle, ShieldCheck, Globe, Activity
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
    LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { LeaveStatsAPI, DepartmentAPI, EmployeeAPI, LeaveAPI } from '../../../services/api';

const MiniCalendar = ({ leaves = [] }) => {
    const [currentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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

    const leaveDates = useMemo(() => {
        const map = new Set();

        leaves.forEach((leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const cursor = new Date(start);

            while (cursor <= end) {
                map.add(cursor.toISOString().split('T')[0]);
                cursor.setDate(cursor.getDate() + 1);
            }
        });

        return map;
    }, [leaves]);

    return (
        <div className="mini-cal-premium">
            <div className="cal-head-premium">
                {currentDate.toLocaleString('default', { month: 'long' })} {year}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <ChevronLeft size={14} style={{ color: '#64748b' }} />
                    <ChevronRight size={14} style={{ color: '#64748b' }} />
                </div>
            </div>
            <div className="cal-grid-premium">
                {dayNames.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {cells.map((c, i) => (
                    <div key={i} className={`cal-cell ${c.isCurrentMonth ? '' : 'cal-muted'}`}>
                        {c.day}
                        {c.isCurrentMonth && leaveDates.has(new Date(year, month, c.day).toISOString().split('T')[0]) && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', position: 'absolute', bottom: '3px' }} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminLeaveDashboard = () => {
    const formatLeaveTypeLabel = (leaveType) => {
        const normalized = String(leaveType || '').trim().toLowerCase();
        return normalized === 'urgent leave' ? 'Unplanned Leave' : (leaveType || 'Leave');
    };
    const [stats, setStats] = useState(null);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const getSubmittedTimestamp = (leave) => {
        const submittedValue = leave?.createdAt || leave?.submissionDate || leave?.submittedAt || leave?.appliedDate || leave?.startDate;
        const time = submittedValue ? new Date(submittedValue).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    };

    useEffect(() => {
        fetchData();
    }, [selectedEmployeeId, dateFrom, dateTo]);

    const employeeOptions = useMemo(() => {
        const seen = new Map();
        seen.set('', { value: '', label: 'All Employees' });

        history.forEach((leave) => {
            const value = String(leave.employeeId || '');
            if (!value || seen.has(value)) return;
            seen.set(value, {
                value,
                label: `${leave.employeeName || 'Employee'} (EMP-${value.slice(-4)})`
            });
        });

        return Array.from(seen.values());
    }, [history]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const employeeIdParam = selectedEmployeeId ? Number(selectedEmployeeId) : undefined;
            const startParam = dateFrom ? dateFrom : undefined;
            const endParam = dateTo ? dateTo : undefined;

            const [statsRes, employeeStatsRes, historyRes] = await Promise.all([
                LeaveStatsAPI.getAnalytics({
                    employeeId: employeeIdParam,
                    start: startParam,
                    end: endParam
                }),
                LeaveStatsAPI.getAnalytics({
                    employeeId: employeeIdParam,
                    start: startParam,
                    end: endParam
                }),
                LeaveAPI.getAll()
            ]);
            setStats(statsRes.data);
            setEmployeeStats(employeeStatsRes.data);
            setHistory(historyRes.data || []);
        } catch (err) {
            console.error("Dashboard Sync Error", err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    const velocityData = useMemo(() => {
        return employeeStats?.velocity || [];
    }, [employeeStats]);

    const selectedEmployeeHistory = useMemo(() => {
        if (!selectedEmployeeId) return history;
        return history.filter((leave) => String(leave.employeeId || '') === selectedEmployeeId);
    }, [history, selectedEmployeeId]);

    const visibleHistory = useMemo(() => {
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        return selectedEmployeeHistory.filter((leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const matchesFrom = !from || end >= from;
            const matchesTo = !to || start <= to;
            return matchesFrom && matchesTo;
        }).sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a));
    }, [selectedEmployeeHistory, dateFrom, dateTo]);

    const pieData = useMemo(() => {
        const approvedLeaves = visibleHistory.filter((leave) => leave?.status === 'Approved');
        if (!approvedLeaves.length) return [];

        const map = new Map();
        approvedLeaves.forEach((leave) => {
            const key = formatLeaveTypeLabel(leave.leaveType || 'Leave');
            map.set(key, (map.get(key) || 0) + 1);
        });

        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [visibleHistory]);

    return (
        <div className="premium-dashboard">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .premium-dashboard {
                    padding: 30px;
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                    overflow-x: hidden;
                }

                .filters-shell {
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 24px;
                    padding: 16px 18px;
                    display: grid;
                    grid-template-columns: 1.2fr 1fr 1fr auto;
                    gap: 12px;
                    align-items: end;
                    margin-bottom: 18px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .filter-group label {
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .filter-group select,
                .filter-group input {
                    height: 40px;
                    border-radius: 12px;
                    border: 1.5px solid #dbe4ef;
                    background: #fff;
                    padding: 0 12px;
                    font-size: 12px;
                    font-weight: 800;
                    color: #1e293b;
                    outline: none;
                }

                .filter-group select:focus,
                .filter-group input:focus {
                    border-color: #ea580c;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.08);
                }

                .filters-clear-btn {
                    height: 40px;
                    border-radius: 12px;
                    border: 1.5px solid #dbe4ef;
                    background: white;
                    padding: 0 14px;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    color: #64748b;
                }

                .top-cards-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 25px;
                }

                .metric-card-glass {
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 24px;
                    padding: 24px;
                    position: relative;
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                }

                .metric-card-glass:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.05);
                    border-color: #e2e8f0;
                }

                .card-icon-pill {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }

                .card-label {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #64748b;
                }

                .card-value-row {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin: 8px 0;
                }

                .card-value {
                    font-size: 32px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -1px;
                }

                .card-unit {
                    font-size: 12px;
                    font-weight: 700;
                    color: #64748b;
                }

                .card-percentage-pill {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 900;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 10px;
                }

                .dashboard-grid-layout {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 25px;
                }

                .panel-glass {
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 32px;
                    padding: 30px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.01);
                }

                .panel-title-premium {
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #0f172a;
                    margin-bottom: 25px;
                }

                /* Mini Calendar Styling */
                .mini-cal-premium {
                    color: #1e293b;
                }

                .cal-head-premium {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    font-weight: 900;
                    margin-bottom: 20px;
                }

                .cal-grid-premium {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 5px;
                    text-align: center;
                }

                .cal-day-name {
                    font-size: 9px;
                    font-weight: 900;
                    color: #64748b;
                    padding-bottom: 8px;
                }

                .cal-cell {
                    font-size: 11px;
                    font-weight: 800;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    position: relative;
                }

                .cal-muted { color: #e2e8f0; }

                /* Presence List */
                .presence-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .presence-item {
                    background: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: 0.2s;
                }

                .presence-item:hover {
                    background: #f1f5f9;
                    transform: translateX(5px);
                }

                .presence-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 14px;
                    object-fit: cover;
                }

                .presence-info h5 {
                    margin: 0;
                    font-size: 12px;
                    font-weight: 900;
                    color: #0f172a;
                }

                .presence-info p {
                    margin: 0;
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                }

                .presence-tag {
                    color: #ea580c;
                    font-weight: 900;
                }

                /* Donut Chart */
                .donut-center-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }

                .donut-val {
                    font-size: 24px;
                    font-weight: 900;
                    color: #0f172a;
                    display: block;
                }

                .donut-tag {
                    font-size: 9px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .history-panel-premium {
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 35px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.01);
                }

                .history-header {
                    padding: 24px 35px;
                    border-bottom: 1.5px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .history-table th {
                    text-align: left;
                    padding: 16px 35px;
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    background: #fcfcfc;
                }

                .history-table td {
                    padding: 18px 35px;
                    font-size: 12px;
                    font-weight: 800;
                    color: #1e293b;
                    border-bottom: 1px solid #f8fafc;
                }

                .status-badge-premium {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                }
            `}</style>

            <section className="filters-shell">
                <div className="filter-group">
                    <label>Employee</label>
                    <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                        {employeeOptions.map((employee) => (
                            <option key={employee.value} value={employee.value}>{employee.label}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>From Date</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>To Date</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <button
                    type="button"
                    className="filters-clear-btn"
                    onClick={() => {
                        setSelectedEmployeeId('');
                        setDateFrom('');
                        setDateTo('');
                    }}
                >
                    Clear
                </button>
            </section>

            <div className="top-cards-row">
                <div className="metric-card-glass" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
                    <div className="card-icon-pill" style={{ background: '#dcfce7', color: '#10b981' }}>
                        <Calendar size={18} />
                    </div>
                    <span className="card-label">On Leave (Today)</span>
                    <div className="card-value-row">
                        <h2 className="card-value">{stats?.onLeaveToday || 0}</h2>
                        <span className="card-unit">Employees</span>
                    </div>
                    <div className="card-percentage-pill" style={{ background: '#dcfce7', color: '#10b981' }}>
                        <Activity size={12} /> {((stats?.onLeaveToday / stats?.totalEmployees) * 100 || 0).toFixed(1)}% of workforce
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-icon-pill" style={{ background: '#fff7ed', color: '#f97316' }}>
                        <Clock size={18} />
                    </div>
                    <span className="card-label">Annual Leave</span>
                    <div className="card-value-row">
                        <h2 className="card-value">{stats?.annualCount || 0}</h2>
                        <span className="card-unit">Employees</span>
                    </div>
                    <div className="card-percentage-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {((stats?.annualCount / (stats?.onLeaveToday || 1)) * 100 || 0).toFixed(0)}% total share
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-icon-pill" style={{ background: '#f0f9ff', color: '#00afef' }}>
                        <CheckCircle size={18} />
                    </div>
                    <span className="card-label">Sick Leave</span>
                    <div className="card-value-row">
                        <h2 className="card-value">{stats?.sickCount || 0}</h2>
                        <span className="card-unit">Employees</span>
                    </div>
                    <div className="card-percentage-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {((stats?.sickCount / (stats?.onLeaveToday || 1)) * 100 || 0).toFixed(0)}% total share
                    </div>
                </div>

                <div className="metric-card-glass">
                    <div className="card-icon-pill" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                        <Globe size={18} />
                    </div>
                    <span className="card-label">Specialist</span>
                    <div className="card-value-row">
                        <h2 className="card-value">{stats?.otherCount || 0}</h2>
                        <span className="card-unit">Employees</span>
                    </div>
                    <div className="card-percentage-pill" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {((stats?.otherCount / (stats?.onLeaveToday || 1)) * 100 || 0).toFixed(0)}% total share
                    </div>
                </div>
            </div>

            <div className="dashboard-grid-layout">
                <div className="panel-glass">
                    <div className="panel-title-premium">Leave Activity</div>
                    <div style={{ height: '280px' }}>
                        <div style={{ height: '220px', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontFamily: 'Outfit', fontWeight: 900, fontSize: '13px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fill="url(#velocityGrad)" />
                                <Bar dataKey="count" fill="#f1f5f9" barSize={30} radius={[6, 6, 0, 0]} />
                            </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="panel-glass">
                            <MiniCalendar leaves={selectedEmployeeHistory} />
                    <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div> Leave
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div> Public Holiday
                        </div>
                    </div>
                </div>

                <div className="panel-glass">
                    <div className="panel-title-premium" style={{ marginBottom: '15px' }}>Live Presence</div>
                    <div className="presence-list">
                        {employeeStats?.onLeaveEmployees?.length > 0 ? employeeStats.onLeaveEmployees.map((emp, i) => (
                            <div key={i} className="presence-item">
                                <img src={emp.photo || `https://i.pravatar.cc/150?u=${i}`} className="presence-avatar" alt="" />
                                <div className="presence-info">
                                    <h5>{emp.name}</h5>
                                    <p><span className="presence-tag">{emp.type}</span> • {emp.period}</p>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                <Users size={32} style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '10px', fontWeight: 900 }}>NO EMPLOYEES ON LEAVE</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel-glass" style={{ position: 'relative' }}>
                    <div className="panel-title-premium">By Category</div>
                    <div style={{ height: '220px' }}>
                        {pieData.length > 0 ? (
                            <div style={{ height: '220px', minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.1 }}>
                                <PieIcon size={64} />
                            </div>
                        )}
                        <div className="donut-center-label">
                            <span className="donut-val">{stats?.onLeaveToday || 0}</span>
                            <span className="donut-tag">On Leave</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="history-panel-premium">
                <header className="history-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
                            <History size={20} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Leave History</h4>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>All employee leave records</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                            <input type="text" placeholder="Search Request..." style={{ padding: '10px 15px 10px 35px', borderRadius: '12px', border: '1.5px solid #f1f5f9', outline: 'none', fontSize: '11px', fontWeight: 800 }} />
                        </div>
                        <button style={{ padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer' }}>Generate Report</button>
                    </div>
                </header>
                <div style={{ overflowX: 'auto' }}>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>LOP</th>
                                <th>Dates</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleHistory.length > 0 ? visibleHistory.map((lr) => (
                                <tr key={lr.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900 }}>{lr.employeeName?.[0]}</div>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 900 }}>{lr.employeeName}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>ID: EMP-{String(lr.employeeId).slice(-4)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: lr.leaveTypeColor || '#3b82f6', fontWeight: 900 }}>{formatLeaveTypeLabel(lr.leaveType)}</span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 800, color: lr.lopCount > 0 ? '#ef4444' : '#64748b' }}>{lr.lopCount || 0}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '11px', fontWeight: 800 }}>{lr.startDate} → {lr.endDate}</div>
                                    </td>
                                    <td>{lr.totalDays} Days</td>
                                    <td>
                                        <span className="status-badge-premium" style={{ 
                                            background: lr.status === 'Approved' ? '#ecfdf5' : lr.status === 'Rejected' ? '#fef2f2' : '#fff7ed',
                                            color: lr.status === 'Approved' ? '#059669' : lr.status === 'Rejected' ? '#dc2626' : '#ea580c'
                                        }}>
                                            {lr.status}
                                        </span>
                                        {['Approved', 'Rejected'].includes(String(lr.status || '')) && (lr.updatedAt || lr.approvedAt || lr.rejectedAt) && (
                                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                                                {new Date(lr.updatedAt || lr.approvedAt || lr.rejectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><MoreHorizontal size={18}/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" style={{ padding: '80px 0', textAlign: 'center' }}>
                                        <ShieldCheck size={64} style={{ color: '#f1f5f9', marginBottom: '15px' }} />
                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px' }}>No records found</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminLeaveDashboard;
