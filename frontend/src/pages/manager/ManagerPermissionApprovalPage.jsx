import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Filter,
    RotateCcw,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    X,
    MoreHorizontal,
    Eye,
    EyeOff,
    LayoutDashboard
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip
} from 'recharts';
import { ManagerAPI, PermissionAPI } from '../../services/api';
import { tokenManager } from '../../utils/tokenManager';

const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const toDateOnly = (input) => {
    const d = new Date(input);
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseClock = (value) => {
    if (!value) return '';
    const [h = '00', m = '00'] = String(value).split(':');
    return `${h}:${m}`;
};

const getDurationMinutes = (item) => {
    const total = Number(item.totalHours);
    if (!Number.isNaN(total) && total > 0) return total;

    if (!item.startTime || !item.endTime) return 0;
    const [sh, sm] = String(item.startTime).split(':').map(Number);
    const [eh, em] = String(item.endTime).split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
};

const formatMinutes = (minutes) => {
    const safe = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

const getTimeSlot = (timeValue) => {
    const [hour = '0'] = String(timeValue || '0').split(':');
    const h = Number(hour);
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
};

const getSubmittedTimestamp = (request) => {
    const submittedValue = request?.createdAt || request?.submissionDate || request?.submittedAt || request?.appliedDate || request?.date;
    const time = submittedValue ? new Date(submittedValue).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
};

const MiniPermissionCalendar = ({ requests }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
        cells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    const requestsByDate = useMemo(() => {
        const map = new Map();
        (requests || []).forEach((request) => {
            if (!request.date) return;
            const key = formatDateKey(toDateOnly(request.date));
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(request);
        });
        return map;
    }, [requests]);

    return (
        <div className="mp-custom-calendar">
            <div className="mp-cc-header">
                <div className="mp-cc-title">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year} <ChevronDown size={16} color="#64748b" />
                </div>
                <div className="mp-cc-nav">
                    <button onClick={prevMonth} type="button"><ChevronLeft size={16} /></button>
                    <button onClick={nextMonth} type="button"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="mp-cc-grid">
                {dayNames.map((d) => <div key={d} className="mp-cc-day-name">{d}</div>)}
                {cells.map((c, i) => {
                    const dateKey = formatDateKey(c.date);
                    const dayRequests = requestsByDate.get(dateKey) || [];
                    return (
                        <div key={i} className={`mp-cc-cell ${c.isCurrentMonth ? '' : 'mp-cc-muted'} ${dayRequests.length ? 'mp-cc-cell-has-request' : ''}`}>
                            <div className="mp-cc-circle">
                                {c.day}
                                {dayRequests.length > 0 && <span className="mp-cc-dot" />}
                            </div>
                            {dayRequests.length > 0 && (
                                <div className="mp-cc-tooltip">
                                    {dayRequests.slice(0, 5).map((item) => (
                                        <div key={`perm-${item.id}`} className="mp-cc-tooltip-item">
                                            <strong>{item.employeeName || 'Employee'}</strong>
                                            <span>{parseClock(item.startTime)} - {parseClock(item.endTime)}</span>
                                            <span>{item.reason || 'No reason provided'}</span>
                                        </div>
                                    ))}
                                    {dayRequests.length > 5 && (
                                        <div className="mp-cc-tooltip-more">+{dayRequests.length - 5} more</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mp-cc-legend">
                <div className="mp-cc-legend-item">
                    <div className="mp-cc-legend-dot" /> Permission request
                </div>
            </div>
        </div>
    );
};

const ManagerPermissionApprovalPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [summaryRange, setSummaryRange] = useState('month');
    const [activityRange, setActivityRange] = useState('week');
    const [activityNavDate, setActivityNavDate] = useState(new Date());
    const [presenceRange, setPresenceRange] = useState('today');
    const [showAnalysis, setShowAnalysis] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        employeeId: '',
        status: 'ALL',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            try {
                const allRes = await PermissionAPI.getAll();
                setAllRequests(allRes.data || []);
            } catch (allError) {
                const pendingRes = await ManagerAPI.getPendingPermissions();
                setAllRequests(pendingRes.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch permission data', err);
            setAllRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const employeeOptions = useMemo(() => {
        const uniqueEmployees = new Map();

        allRequests.forEach((request) => {
            if (!request.employeeId) return;
            const value = String(request.employeeId);
            if (!uniqueEmployees.has(value)) {
                uniqueEmployees.set(value, {
                    value,
                    label: `${request.employeeName || 'Employee'} (EMP-${value.slice(-4)})`
                });
            }
        });

        return Array.from(uniqueEmployees.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [allRequests]);

    const filteredRequests = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        const fromDate = filters.dateFrom ? toDateOnly(filters.dateFrom) : null;
        const toDate = filters.dateTo ? toDateOnly(filters.dateTo) : null;

        return allRequests.filter((request) => {
            const requestDate = request.date ? toDateOnly(request.date) : null;
            const matchesSearch = !search || [
                request.employeeName,
                request.employeeId,
                request.reason,
                request.status,
                request.approvedByName
            ].some((value) => String(value || '').toLowerCase().includes(search));

            const matchesEmployee = !filters.employeeId || String(request.employeeId || '') === String(filters.employeeId);
            const matchesStatus = filters.status === 'ALL' || request.status === filters.status;
            const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
            const matchesTo = !toDate || (requestDate && requestDate <= toDate);

            return matchesSearch && matchesEmployee && matchesStatus && matchesFrom && matchesTo;
        }).sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a));
    }, [allRequests, searchTerm, filters]);

    const employeeDateFilteredRequests = useMemo(() => {
        const fromDate = filters.dateFrom ? toDateOnly(filters.dateFrom) : null;
        const toDate = filters.dateTo ? toDateOnly(filters.dateTo) : null;

        return allRequests.filter((request) => {
            const requestDate = request.date ? toDateOnly(request.date) : null;
            const matchesEmployee = !filters.employeeId || String(request.employeeId || '') === String(filters.employeeId);
            const matchesFrom = !fromDate || (requestDate && requestDate >= fromDate);
            const matchesTo = !toDate || (requestDate && requestDate <= toDate);
            return matchesEmployee && matchesFrom && matchesTo;
        });
    }, [allRequests, filters.employeeId, filters.dateFrom, filters.dateTo]);

    const handleReset = () => {
        setSearchTerm('');
        setFilters({ employeeId: '', status: 'ALL', dateFrom: '', dateTo: '' });
        setShowFilters(false);
    };

    const handleExportXls = () => {
        if (!filteredRequests.length) return;

        const headers = ['Request ID', 'Employee', 'Date', 'From', 'To', 'Duration', 'Status', 'Reason', 'Approved By'];
        const rows = filteredRequests.map((request) => [
            request.id,
            request.employeeName,
            request.date,
            parseClock(request.startTime),
            parseClock(request.endTime),
            formatMinutes(getDurationMinutes(request)),
            request.status,
            request.reason || '',
            request.approvedByName || ''
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'Permission_Requests.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleAction = async (id, action) => {
        try {
            const managerId = tokenManager.getUserData()?.employeeId || 1;
            setActionLoading(id);
            if (action === 'approve') await ManagerAPI.approvePermission(id, managerId);
            else await ManagerAPI.rejectPermission(id, managerId);
            await fetchAllData();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const onPermissionToday = useMemo(() => {
        const todayKey = formatDateKey(toDateOnly(new Date()));
        const uniqueEmployees = new Set(
            employeeDateFilteredRequests
                .filter((r) => r.status === 'Approved')
                .filter((r) => r.date && formatDateKey(toDateOnly(r.date)) === todayKey)
                .map((r) => String(r.employeeId || r.id || ''))
        );
        return uniqueEmployees.size;
    }, [employeeDateFilteredRequests]);

    const getActivityLabel = useMemo(() => {
        if (activityRange === 'week') {
            const start = new Date(activityNavDate);
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
        }

        if (activityRange === 'month') {
            return `${activityNavDate.toLocaleString('default', { month: 'long' })} ${activityNavDate.getFullYear()}`;
        }

        return String(activityNavDate.getFullYear());
    }, [activityNavDate, activityRange]);

    const moveActivityPeriod = (direction) => {
        const next = new Date(activityNavDate);
        if (activityRange === 'week') {
            next.setDate(next.getDate() + direction * 7);
        } else if (activityRange === 'month') {
            next.setMonth(next.getMonth() + direction);
        } else {
            next.setFullYear(next.getFullYear() + direction);
        }
        setActivityNavDate(next);
    };

    const activityData = useMemo(() => {
        const source = employeeDateFilteredRequests;
        const focus = new Date(activityNavDate);
        focus.setHours(0, 0, 0, 0);

        const countForDate = (date) => {
            const key = formatDateKey(date);
            return source.filter((request) => request.date && formatDateKey(toDateOnly(request.date)) === key).length;
        };

        if (activityRange === 'week') {
            const weekStart = new Date(focus);
            weekStart.setDate(focus.getDate() - focus.getDay());

            return Array.from({ length: 7 }).map((_, index) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + index);
                return {
                    name: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    requests: countForDate(date)
                };
            });
        }

        if (activityRange === 'month') {
            const year = focus.getFullYear();
            const month = focus.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            return Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(year, month, day);
                return {
                    name: String(day),
                    requests: countForDate(date)
                };
            });
        }

        const year = focus.getFullYear();
        return Array.from({ length: 12 }, (_, monthIndex) => {
            const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const monthlyCount = source.filter((request) => {
                if (!request.date) return false;
                const d = new Date(request.date);
                return d.getFullYear() === year && d.getMonth() === monthIndex;
            }).length;
            return { name: monthLabel, requests: monthlyCount };
        });
    }, [employeeDateFilteredRequests, activityNavDate, activityRange]);

    const presenceData = useMemo(() => {
        const today = toDateOnly(new Date());
        const currentYear = today.getFullYear();

        let filtered = employeeDateFilteredRequests.filter((request) => request.status === 'Approved');
        if (presenceRange === 'today') {
            filtered = filtered.filter((request) => request.date && formatDateKey(toDateOnly(request.date)) === formatDateKey(today));
        } else if (presenceRange === 'year') {
            filtered = filtered.filter((request) => request.date && new Date(request.date).getFullYear() === currentYear);
        }

        return filtered
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((request) => ({
                id: request.id,
                employeeName: request.employeeName || 'Unknown Employee',
                reason: request.reason || 'No reason',
                date: request.date,
                from: parseClock(request.startTime),
                to: parseClock(request.endTime),
                total: formatMinutes(getDurationMinutes(request))
            }));
    }, [employeeDateFilteredRequests, presenceRange]);

    const categoryStats = useMemo(() => {
        const map = new Map();
        employeeDateFilteredRequests
            .filter((request) => request?.status === 'Approved')
            .forEach((request) => {
            const slot = getTimeSlot(request.startTime);
            map.set(slot, (map.get(slot) || 0) + 1);
        });

        const entries = Array.from(map.entries())
            .map(([name, value]) => ({ name, v: value }))
            .sort((a, b) => b.v - a.v);

        return {
            total: entries.reduce((sum, item) => sum + item.v, 0),
            entries: entries.length ? entries : [{ name: 'No Data', v: 1 }]
        };
    }, [employeeDateFilteredRequests]);

    const summaryMetrics = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let filtered = employeeDateFilteredRequests;
        if (summaryRange === 'month') {
            filtered = employeeDateFilteredRequests.filter((request) => {
                const d = request.date ? new Date(request.date) : null;
                return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
        } else if (summaryRange === 'year') {
            filtered = employeeDateFilteredRequests.filter((request) => request.date && new Date(request.date).getFullYear() === currentYear);
        } else if (summaryRange === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = employeeDateFilteredRequests.filter((request) => request.date && new Date(request.date) >= startOfWeek);
        }

        const totalMinutes = filtered.reduce((sum, request) => sum + getDurationMinutes(request), 0);
        const approved = filtered.filter((request) => request.status === 'Approved').length;
        const pending = filtered.filter((request) => request.status === 'Pending').length;
        const rejected = filtered.filter((request) => request.status === 'Rejected').length;
        const approvalRate = filtered.length ? Math.round((approved / filtered.length) * 100) : 0;
        return {
            totalMinutes,
            approvalRate,
            pending,
            approved,
            rejected
        };
    }, [employeeDateFilteredRequests, summaryRange]);

    const monthMetrics = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const filtered = allRequests.filter((request) => {
            const d = request.date ? new Date(request.date) : null;
            return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const approvedOnly = filtered.filter((r) => r.status === 'Approved');
        return {
            totalMinutes: approvedOnly.reduce((sum, r) => sum + getDurationMinutes(r), 0),
            totalCount: approvedOnly.length,
            pending: filtered.filter((r) => r.status === 'Pending').length,
            approved: approvedOnly.length,
            rejected: filtered.filter((r) => r.status === 'Rejected').length
        };
    }, [allRequests]);

    const pieData = categoryStats.entries;
    const pieCenterValue = categoryStats.total;
    const COLORS = ['#10b981', '#3b82f6', '#f97316'];

    if (loading) {
        return (
            <div style={{ padding: '32px', fontSize: '14px', fontWeight: 800, color: '#64748b' }}>
                Loading permission approvals...
            </div>
        );
    }

    return (
        <div className="approval-portal-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .approval-portal-page {
                    padding: 12px 12px 16px 12px;
                    background: #ffffff;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                    box-sizing: border-box;
                }

                .ma-portal-switch {
                    display: inline-flex;
                    gap: 6px;
                    padding: 6px;
                    border-radius: 14px;
                    background: #eef2f7;
                    margin-bottom: 12px;
                }

                .ma-portal-switch-btn {
                    border: none;
                    background: transparent;
                    color: #64748b;
                    border-radius: 10px;
                    padding: 8px 14px;
                    font-size: 10px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .ma-portal-switch-btn.active {
                    background: #f97316;
                    color: #fff;
                    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
                }

                .mp-summary-row { display: grid; grid-template-columns: 1.08fr 0.75fr 1.17fr; gap: 12px; margin-bottom: 14px; align-items: stretch; }
                .mp-summary-card { background: white; border-radius: 20px; border: 1.5px solid #e2e8f0; padding: 16px 18px 15px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); min-height: 136px; }
                .mp-summary-pill-row { display: inline-flex; gap: 6px; padding: 6px; border-radius: 20px; background: #eef2f7; margin-bottom: 12px; }
                .mp-summary-pill { border: none; background: transparent; padding: 7px 16px; border-radius: 14px; font-size: 10px; font-weight: 900; color: #64748b; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
                .mp-summary-pill.active { background: white; color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); }
                .mp-summary-label { font-size: 10px; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 6px; }
                .mp-summary-value { font-size: 38px; font-weight: 950; line-height: 0.95; letter-spacing: -2px; color: #0f172a; }
                .mp-summary-unit { font-size: 10px; font-weight: 900; color: #64748b; margin-left: 5px; text-transform: uppercase; letter-spacing: 0.7px; }
                .mp-summary-split { display: flex; align-items: stretch; justify-content: space-between; gap: 10px; }
                .mp-summary-divider { width: 1px; background: #e2e8f0; }
                .mp-summary-status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; height: 100%; align-items: center; }

                .mp-grid-mid { display: grid; grid-template-columns: 1.18fr 0.92fr 0.92fr 0.78fr; gap: 12px; margin-bottom: 14px; align-items: stretch; }
                .mp-card { background: white; border-radius: 20px; border: 1.5px solid #f1f5f9; padding: 16px; display: flex; flex-direction: column; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); min-height: 294px; }

                .mp-card.calendar-card { padding: 14px 14px 15px; }
                .mp-card.presence-card { padding: 14px 14px 12px; }
                .mp-card.stats-card { padding: 16px 16px 14px; }
                .mp-card.slot-card { padding: 16px 16px 14px; }
                .mp-card-title { font-size: 15px; font-weight: 950; color: #0f172a; text-transform: uppercase; letter-spacing: 1.4px; margin-bottom: 12px; }

                .mp-trend-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
                .mp-trend-date-box { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px 10px; border-radius: 10px; border: 1px solid #f1f5f9; }
                .mp-trend-date-text { font-size: 10px; font-weight: 950; color: #431407; min-width: 110px; text-align: center; }
                .mp-trend-range-btn { background: #fff7ed; color: #f97316; border: 1px solid #f97316; padding: 4px 12px; border-radius: 8px; font-size: 10px; font-weight: 950; cursor: pointer; }

                .mp-switch-row { display: inline-flex; align-items: center; gap: 6px; background: #eef2f7; border-radius: 12px; padding: 4px; margin-bottom: 12px; }
                .mp-switch-btn { border: none; background: transparent; border-radius: 9px; padding: 6px 10px; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #64748b; cursor: pointer; }
                .mp-switch-btn.active { background: white; color: #0f172a; }

                .mp-filter-shell { background: white; border: 1.5px solid #f1f5f9; border-radius: 22px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); overflow: hidden; margin-bottom: 16px; }
                .mp-filter-topbar { padding: 12px 18px; border-bottom: 3.5px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
                .mp-filter-title { font-size: 11px; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
                
                .mp-header-metrics { display: flex; align-items: center; gap: 18px; }
                .mp-header-metric-item { display: flex; flex-direction: column; }
                .mp-header-metric-label { font-size: 8px; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
                .mp-header-metric-value { font-size: 18px; font-weight: 950; line-height: 1; display: flex; align-items: baseline; gap: 3px; }
                .mp-header-metric-unit { font-size: 8px; font-weight: 950; color: #334155; }
                .mp-header-metric-badge { background: #f8fafc; padding: 4px 12px; border-radius: 12px; display: inline-flex; align-items: baseline; gap: 4px; border: 1px solid #f1f5f9; }
                .mp-header-divider { width: 1.5px; height: 28px; background: #e2e8f0; margin: 0 2px; }
                
                .mp-filter-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; flex: 1; }
                .mp-search-chip { position: relative; flex: 0 1 340px; }
                .mp-search-chip input { width: 100%; height: 38px; border-radius: 14px; border: 1.5px solid #fdba74; background: #fff; padding: 0 16px 0 40px; font-size: 12px; font-weight: 800; outline: none; color: #1e293b; transition: 0.2s; }
                .mp-search-chip input:focus { border-color: #f97316; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
                .mp-search-chip svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #f97316; }
                .mp-toolbar-btn { height: 38px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff; padding: 0 14px; display: inline-flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 950; cursor: pointer; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; transition: 0.2s; }
                .mp-toolbar-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .mp-toolbar-btn.active { background: #f0f9ff; border-color: #bae6fd; color: #0ea5e9; }
                .mp-toolbar-btn.clear { color: #64748b; }
                .mp-toolbar-btn.export { color: #16a34a; border-color: #86efac; background: #f0fdf4; }

                .mp-filter-panel { padding: 16px 18px 18px 18px; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
                .mp-filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
                .mp-filter-field { display: flex; flex-direction: column; gap: 6px; }
                .mp-filter-field label { font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
                .mp-filter-field select, .mp-filter-field input { height: 38px; border-radius: 10px; border: 1.5px solid #dbe4ef; background: #fff; padding: 0 12px; font-size: 12px; font-weight: 800; outline: none; color: #1e293b; }

                .mp-table-container { background: white; border-radius: 22px; border: 1.5px solid #f1f5f9; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); margin-top: 10px; }
                .mp-table { width: 100%; border-collapse: collapse; }
                .mp-table th { padding: 12px 16px; background: #edf2f7; border-bottom: 2px solid #f1f5f9; font-size: 9px; font-weight: 950; text-transform: uppercase; color: #1e293b; letter-spacing: 1.5px; text-align: left; }
                .mp-table td { padding: 14px 16px; border-bottom: 1.5px solid #f8fafc; font-size: 13px; font-weight: 800; color: #1e293b; vertical-align: middle; }
                .mp-status-label { padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 950; text-transform: uppercase; }
                .mp-btn-approve { background: #ecfdf5; color: #059669; border: 1.5px solid #d1fae5; border-radius: 12px; padding: 8px 12px; font-size: 11px; font-weight: 950; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: 0.2s; }
                .mp-btn-reject { background: #f8fafc; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 8px 12px; font-size: 11px; font-weight: 950; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; margin-left: 8px; }

                .mp-cc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; overflow: visible; }
                .mp-cc-day-name { font-size: 10px; font-weight: 950; color: #64748b; text-align: center; margin-bottom: 8px; }
                .mp-cc-cell { display: flex; align-items: center; justify-content: center; height: 30px; position: relative; }
                .mp-cc-circle { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; cursor: pointer; position: relative; }
                .mp-cc-muted { opacity: 0.3; }
                .mp-cc-title { font-size: 15px; font-weight: 950; display: flex; align-items: center; gap: 8px; }
                .mp-cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                .mp-cc-nav button { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; width: 30px; height: 30px; }
                .mp-cc-dot { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; bottom: 2px; right: 2px; }
                .mp-cc-tooltip { display: none; position: absolute; top: 32px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 8px; width: 220px; z-index: 20; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.35); }
                .mp-cc-cell-has-request:hover .mp-cc-tooltip { display: block; }
                .mp-cc-tooltip-item { display: grid; gap: 2px; padding: 4px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
                .mp-cc-tooltip-item:last-child { border-bottom: none; }
                .mp-cc-tooltip-item strong { font-size: 10px; color: #f8fafc; }
                .mp-cc-tooltip-item span { font-size: 9px; line-height: 1.2; color: #64748b; }
                .mp-cc-tooltip-more { margin-top: 4px; font-size: 9px; color: #64748b; text-align: right; }
                .mp-cc-legend { margin-top: 8px; }
                .mp-cc-legend-item { display: inline-flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 800; color: #64748b; }
                .mp-cc-legend-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }

                .mp-presence-list { display: flex; flex-direction: column; gap: 8px; max-height: 185px; overflow-y: auto; padding-right: 4px; }
                .mp-presence-item { background: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px; padding: 8px; display: grid; gap: 2px; }
                .mp-presence-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
                .mp-presence-name { font-size: 11px; font-weight: 900; color: #0f172a; }
                .mp-presence-duration { font-size: 10px; font-weight: 900; color: #0ea5e9; }
                .mp-presence-meta { font-size: 10px; font-weight: 800; color: #64748b; }
                .mp-presence-reason { font-size: 9px; font-weight: 700; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .mp-category-legend { margin-top: 8px; display: grid; gap: 6px; }
                .mp-category-row { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; color: #64748b; }
                .mp-category-left { display: flex; align-items: center; gap: 6px; }
                .mp-category-color { width: 9px; height: 9px; border-radius: 50%; }

                @media (max-width: 1400px) {
                    .mp-grid-mid {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (max-width: 900px) {
                    .mp-summary-row,
                    .mp-grid-mid {
                        grid-template-columns: 1fr;
                    }

                    .mp-search-chip {
                        width: 100%;
                    }

                    .mp-filter-grid {
                        grid-template-columns: 1fr;
                    }

                    .mp-filter-actions {
                        width: 100%;
                        justify-content: flex-start;
                    }
                }
            `}</style>

            <div className="ma-portal-switch">
                <button
                    type="button"
                    className={`ma-portal-switch-btn ${location.pathname === '/manager/leave-requests' ? 'active' : ''}`}
                    onClick={() => navigate('/manager/leave-requests')}
                >
                    <Calendar size={14} /> Leave Approvals
                </button>
                <button
                    type="button"
                    className={`ma-portal-switch-btn ${location.pathname === '/manager/permission-requests' ? 'active' : ''}`}
                    onClick={() => navigate('/manager/permission-requests')}
                >
                    <Clock size={14} /> Permission Approvals
                </button>
                <div style={{ width: '1px', background: '#cbd5e1', margin: '4px 2px' }} />
                <button
                    type="button"
                    className={`ma-portal-switch-btn ${!showAnalysis ? 'active' : ''}`}
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    style={{ color: showAnalysis ? '#0ea5e9' : '#64748b' }}
                >
                    {showAnalysis ? <Eye size={14} /> : <EyeOff size={14} />} 
                    {showAnalysis ? 'Hide' : 'Show'} Analysis
                </button>
            </div>



            {showAnalysis && (
                <div className="mp-grid-mid">
                    <div className="mp-card calendar-card">
                        <div className="mp-trend-toolbar">
                            <div className="mp-card-title" style={{ marginBottom: 0 }}>Permission Activity</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div className="mp-trend-date-box">
                                    <button onClick={() => moveActivityPeriod(-1)} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex', padding: 0 }} type="button"><ChevronLeft size={16} /></button>
                                    <span className="mp-trend-date-text">{getActivityLabel}</span>
                                    <button onClick={() => moveActivityPeriod(1)} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', display: 'flex', padding: 0 }} type="button"><ChevronRight size={16} /></button>
                                </div>
                                <button
                                    onClick={() => setActivityRange(activityRange === 'week' ? 'month' : activityRange === 'month' ? 'year' : 'week')}
                                    className="mp-trend-range-btn"
                                    type="button"
                                >
                                    {activityRange === 'week' ? 'WEEK VIEW' : activityRange === 'month' ? 'MONTH VIEW' : 'YEAR VIEW'}
                                </button>
                            </div>
                        </div>
                        <div style={{ height: '240px', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="permActivityGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 900 }} interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                                    <RechartsTooltip formatter={(value) => [value, 'Requests']} />
                                    <Area
                                        type="monotone"
                                        dataKey="requests"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fill="url(#permActivityGrad)"
                                        isAnimationActive
                                        animationDuration={1200}
                                        animationEasing="ease-in-out"
                                        dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mp-card presence-card">
                        <MiniPermissionCalendar requests={employeeDateFilteredRequests} />
                    </div>

                    <div className="mp-card stats-card">
                        <div className="mp-card-title">Live Presence</div>
                        <div className="mp-switch-row">
                            {['today', 'year', 'all'].map((range) => (
                                <button
                                    key={range}
                                    className={`mp-switch-btn ${presenceRange === range ? 'active' : ''}`}
                                    onClick={() => setPresenceRange(range)}
                                    type="button"
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <div className="mp-presence-list">
                            {presenceData.length > 0 ? presenceData.map((item) => (
                                <div key={item.id} className="mp-presence-item">
                                    <div className="mp-presence-top">
                                        <span className="mp-presence-name">{item.employeeName}</span>
                                        <span className="mp-presence-duration">{item.total}</span>
                                    </div>
                                    <div className="mp-presence-meta">{item.date} • {item.from} - {item.to}</div>
                                    <div className="mp-presence-reason">{item.reason}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '11px', fontWeight: 900 }}>
                                    No permission records for selected range.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mp-card slot-card">
                        <div className="mp-card-title">By Time Slot</div>
                        <div style={{ height: '140px', position: 'relative', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={50} outerRadius={65} dataKey="v" stroke="none">
                                        {pieData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(value, name) => [`${value} requests`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                <span style={{ fontSize: '24px', fontWeight: 950, color: '#0f172a' }}>{pieCenterValue}</span>
                                <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Requests</span>
                            </div>
                        </div>
                        <div className="mp-category-legend">
                            {pieData.map((entry, idx) => {
                                const percent = pieCenterValue > 0 ? ((entry.v / pieCenterValue) * 100).toFixed(0) : '0';
                                return (
                                    <div key={`legend-${entry.name}`} className="mp-category-row">
                                        <div className="mp-category-left">
                                            <span className="mp-category-color" style={{ background: COLORS[idx % COLORS.length] }} />
                                            <span>{entry.name}</span>
                                        </div>
                                        <span>{entry.v} ({percent}%)</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <section className="mp-table-container">
                <div className="mp-filter-shell">
                    <div className="mp-filter-topbar">
                        <div className="mp-header-metrics">
                            <div className="mp-header-metric-item">
                                <div className="mp-header-metric-label">Total Permission This Month</div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '4px' }}>
                                    <div className="mp-header-metric-value" style={{ fontSize: '24px' }}>
                                        {formatMinutes(monthMetrics.totalMinutes)}
                                    </div>
                                </div>
                            </div>
                            <div className="mp-header-divider" />
                            <div className="mp-header-metric-item">
                                <div className="mp-header-metric-label">Pending</div>
                                <div className="mp-header-metric-value" style={{ color: '#f59e0b' }}>{monthMetrics.pending}</div>
                            </div>
                            <div className="mp-header-divider" />
                            <div className="mp-header-metric-item">
                                <div className="mp-header-metric-label">Approved</div>
                                <div className="mp-header-metric-value" style={{ color: '#10b981' }}>{monthMetrics.approved}</div>
                            </div>
                            <div className="mp-header-divider" />
                            <div className="mp-header-metric-item">
                                <div className="mp-header-metric-label">Rejected</div>
                                <div className="mp-header-metric-value" style={{ color: '#ef4444' }}>{monthMetrics.rejected}</div>
                            </div>
                        </div>

                        <div className="mp-filter-actions">
                            <div className="mp-search-chip">
                                <Search size={16} />
                                <input
                                    placeholder="Search by ID or reason..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                className={`mp-toolbar-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters((value) => !value)}
                            >
                                <Filter size={14} /> Show Filters
                            </button>
                            <button type="button" className="mp-toolbar-btn clear" onClick={handleReset}>
                                <RotateCcw size={14} /> Clear
                            </button>
                            <button type="button" className="mp-toolbar-btn export" onClick={handleExportXls}>
                                <Download size={14} /> Export XLS
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mp-filter-panel">
                            <div className="mp-filter-grid">
                                <div className="mp-filter-field">
                                    <label>Employee</label>
                                    <select value={filters.employeeId} onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))}>
                                        <option value="">All Employees</option>
                                        {employeeOptions.map((employee) => (
                                            <option key={employee.value} value={employee.value}>{employee.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mp-filter-field">
                                    <label>Status</label>
                                    <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                                        <option value="ALL">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="mp-filter-field">
                                    <label>From Date</label>
                                    <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
                                </div>
                                <div className="mp-filter-field">
                                    <label>Until Date</label>
                                    <input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <table className="mp-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Submitted On</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {item.employeeName?.[0] || 'E'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.employeeName || 'Unknown Employee'}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>ID: EMP-{String(item.employeeId || '').slice(-4)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ color: '#64748b' }}>{item.date}</td>
                                <td>{parseClock(item.startTime)} - {parseClock(item.endTime)}</td>
                                <td>{formatMinutes(getDurationMinutes(item))}</td>
                                <td style={{ maxWidth: '260px' }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reason || '-'}</div>
                                </td>
                                <td style={{ color: '#64748b' }}>{new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>
                                    {item.status === 'Approved' ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="mp-status-label" style={{ background: '#ecfdf5', color: '#059669' }}>Approved</span>
                                            {item.updatedAt && <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>{new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                                        </div>
                                    ) : item.status === 'Rejected' ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="mp-status-label" style={{ background: '#fef2f2', color: '#dc2626' }}>Rejected</span>
                                            {item.updatedAt && <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>{new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                                        </div>
                                    ) : (
                                        <span className="mp-status-label" style={{ background: '#fff7ed', color: '#ea580c' }}>Pending</span>
                                    )}
                                </td>
                                <td>
                                    {item.status === 'Pending' ? (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <button
                                                className="mp-btn-approve"
                                                onClick={() => handleAction(item.id, 'approve')}
                                                disabled={actionLoading === item.id}
                                                type="button"
                                            >
                                                <Check size={14} /> {actionLoading === item.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                className="mp-btn-reject"
                                                onClick={() => handleAction(item.id, 'reject')}
                                                disabled={actionLoading === item.id}
                                                type="button"
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} type="button"><MoreHorizontal size={18} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {!filteredRequests.length && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px 12px', color: '#64748b', fontWeight: 900 }}>
                                    No permission requests found for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ManagerPermissionApprovalPage;
