import React, { useState, useEffect, useMemo } from 'react';
import { LeaveAPI, PermissionAPI } from '../../services/api';
import { 
    Calendar, FileText, Clock, TrendingUp, Plus, 
    ArrowRight, CheckCircle, AlertCircle, XCircle, History,
    Eye, EyeOff
} from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import LeaveHistory from './LeaveHistory';

export default function LeaveDashboard() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const navigate = useNavigate();

    const [balances, setBalances] = useState([]);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [recentPermissions, setRecentPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [permissionRange, setPermissionRange] = useState('month'); // week, month, year
    
    // Monthly Breakdown & Category Analytics
    const [breakdownYear, setBreakdownYear] = useState(new Date().getFullYear());
    const [breakdownPeriod, setBreakdownPeriod] = useState('year');

    const [dashView, setDashView] = useState('leave'); // 'leave' or 'permission'

    const formatLeaveTypeLabel = (leaveType) => {
        const normalized = String(leaveType || '').trim().toLowerCase();
        return normalized === 'urgent leave' ? 'Unplanned Leave' : (leaveType || 'Leave');
    };

    const toDateOnly = (input) => {
        const d = new Date(input);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const getMonthEnd = (year, monthIndex) => new Date(year, monthIndex + 1, 0);
    const getMonthStart = (year, monthIndex) => new Date(year, monthIndex, 1);
    const getMonthKey = (year, monthIndex) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    const diffMonthsInclusive = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    };

    const isBefore = (left, right) => left.getTime() < right.getTime();

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#dc2626'];
    const statusColors = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444', Canceled: '#64748b' };

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
            const [balanceRes, leavesRes, permissionsRes] = await Promise.all([
                LeaveAPI.getBalance(EMPLOYEE_ID),
                LeaveAPI.getMy(EMPLOYEE_ID),
                PermissionAPI.getMy(EMPLOYEE_ID),
            ]);
            setBalances(Array.isArray(balanceRes.data) ? balanceRes.data : []);
            setRecentLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
            setRecentPermissions(Array.isArray(permissionsRes.data) ? permissionsRes.data : []);
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
        if (s === 'canceled') return { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' }; // Pending
    };

    const getSubmittedTimestamp = (entry) => {
        const submittedValue = entry?.createdAt || entry?.submissionDate || entry?.submittedAt || entry?.appliedDate || entry?.date || entry?.startDate;
        const time = submittedValue ? new Date(submittedValue).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    };

    const cardLeaves = useMemo(() => recentLeaves, [recentLeaves]);

    const cardPermissions = useMemo(() => recentPermissions, [recentPermissions]);

    const filteredBalances = useMemo(() => balances, [balances]);

    const employeeJoiningDate = useMemo(() => {
        const matchedLeave = cardLeaves.find((leave) => leave.joiningDate);
        if (matchedLeave?.joiningDate) return new Date(matchedLeave.joiningDate);
        return null;
    }, [cardLeaves]);

    const calculateBalanceAsOfDate = (requests, joiningDateInput, asOfDateInput) => {
        const joiningDate = joiningDateInput ? toDateOnly(joiningDateInput) : null;
        const asOfDate = asOfDateInput ? toDateOnly(asOfDateInput) : null;

        if (!joiningDate || !asOfDate || asOfDate < joiningDate) return 0;

        const probationEnd = new Date(joiningDate);
        probationEnd.setMonth(probationEnd.getMonth() + 6);
        probationEnd.setDate(probationEnd.getDate() - 1);

        const approvedRequests = (requests || []).filter((request) => request.status === 'Approved' && request.startDate && request.endDate);

        if (asOfDate <= probationEnd) {
            const monthStart = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 1);
            const used = approvedRequests.reduce((sum, request) => sum + countTotalDaysWithinRange(request, monthStart, asOfDate), 0);
            return Math.max(0, 1 - used);
        }

        const yearStart = new Date(asOfDate.getFullYear(), 0, 1);
        const permanentStart = new Date(probationEnd);
        permanentStart.setDate(permanentStart.getDate() + 1);
        const effectiveStart = isBefore(permanentStart, yearStart) ? yearStart : permanentStart;

        if (asOfDate < effectiveStart) return 0;

        const monthsAccrued = diffMonthsInclusive(effectiveStart, asOfDate);
        const accrued = monthsAccrued * 1.5;
        const used = approvedRequests.reduce((sum, request) => sum + countTotalDaysWithinRange(request, effectiveStart, asOfDate), 0);
        return Math.max(0, accrued - used);
    };

    const countTotalDaysWithinRange = (request, rangeStart, rangeEnd) => {
        if (!request?.startDate || !request?.endDate || !rangeStart || !rangeEnd) return 0;
        const start = toDateOnly(request.startDate);
        const end = toDateOnly(request.endDate);
        if (end < rangeStart || start > rangeEnd) return 0;
        const totalDays = Math.floor(Number(request?.totalDays) || 0);
        if (totalDays <= 0) return 0;
        let cursor = new Date(start);
        let counted = 0;
        while (cursor <= end && counted < totalDays) {
            if (cursor >= rangeStart && cursor <= rangeEnd) counted += 1;
            cursor.setDate(cursor.getDate() + 1);
        }
        return counted;
    };

    const categoryStats = useMemo(() => {
        const map = new Map();
        cardLeaves
            .filter((request) => request?.status === 'Approved')
            .forEach((request) => {
            const key = formatLeaveTypeLabel(request.leaveType || 'Unknown');
            map.set(key, (map.get(key) || 0) + 1);
        });
        const entries = Array.from(map.entries()).map(([name, value]) => ({ name, v: value })).sort((a, b) => b.v - a.v);
        const total = entries.reduce((sum, item) => sum + item.v, 0);
        return { total, entries };
    }, [cardLeaves]);

    const breakdownYears = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        cardLeaves.forEach((request) => {
            if (request.startDate) years.add(new Date(request.startDate).getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [cardLeaves]);

    const monthlyBreakdown = useMemo(() => {
        const today = toDateOnly(new Date());
        const isCurrentYearView = breakdownYear === today.getFullYear();

        const baseMonths = Array.from({ length: 12 }, (_, index) => {
            const date = new Date(breakdownYear, index, 1);
            return {
                key: getMonthKey(breakdownYear, index),
                month: date.toLocaleDateString('en-US', { month: 'long' }),
                year: breakdownYear,
                pending: 0,
                approved: 0,
                rejected: 0,
                lop: 0,
                totalLeaveDays: 0,
                availed: 0,
                balance: 0,
                hintText: ''
            };
        });

        const map = new Map(baseMonths.map((row) => [row.key, row]));

        cardLeaves.forEach((request) => {
            if (!request.startDate) return;
            const date = new Date(request.startDate);
            if (date.getFullYear() !== breakdownYear) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const row = map.get(key);
            if (!row) return;

            const totalDays = Number(request.totalDays) || 0;
            const lopDays = Number(request.lopCount) || 0;

            if (request.status === 'Approved') {
                row.totalLeaveDays += totalDays;
                row.availed += Math.max(0, totalDays - lopDays);
                row.lop += lopDays;
            }

            if (request.status === 'Pending') row.pending += 1;
            if (request.status === 'Rejected') row.rejected += 1;
            if (request.status === 'Approved') row.approved += 1;
        });

        const allRows = Array.from(map.values()).map((row, index) => {
            const monthEnd = getMonthEnd(breakdownYear, index);
            const monthStart = getMonthStart(breakdownYear, index);
            const monthHasData = row.totalLeaveDays > 0 || row.pending > 0;
            const isFutureMonthInCurrentYear = isCurrentYearView && monthStart > today;
            const balanceAsOf = monthEnd;

            const balance = isFutureMonthInCurrentYear ? 0 : calculateBalanceAsOfDate(cardLeaves, employeeJoiningDate, balanceAsOf);

            let hintText = '';
            if (!monthHasData || isFutureMonthInCurrentYear) {
                hintText = '';
            } else if (row.lop > 0) {
                hintText = 'Loss of Pay recorded';
            } else if (row.totalLeaveDays > 0) {
                hintText = 'Approved records';
            } else if (row.pending > 0) {
                hintText = 'Pending requests';
            }

            return { ...row, balance, hintText };
        });

        // Filter: Only months from Joining Date until Current Month
        const now = new Date();
        const start = employeeJoiningDate ? new Date(employeeJoiningDate.getFullYear(), employeeJoiningDate.getMonth(), 1) : null;
        const end = new Date(now.getFullYear(), now.getMonth(), 1);

        return allRows.filter(row => {
            const rowDate = new Date(row.year, baseMonths.find(m => m.month === row.month).key.split('-')[1] - 1, 1);
            if (start && rowDate < start) return false;
            if (rowDate > end) return false;
            return true;
        });
    }, [cardLeaves, breakdownYear, employeeJoiningDate]);

    const yearlyBreakdownTotals = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

        let periodStart = new Date(breakdownYear, 0, 1);
        let periodEnd = new Date(breakdownYear, 11, 31);

        if (breakdownPeriod === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0, 0, 0, 0);
            periodStart = new Date(breakdownYear, startOfWeek.getMonth(), startOfWeek.getDate());
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 6);
        } else if (breakdownPeriod === 'month') {
            periodStart = new Date(breakdownYear, currentMonth, 1);
            periodEnd = new Date(breakdownYear, currentMonth + 1, 0);
        } else if (breakdownPeriod === 'year') {
            periodStart = new Date(breakdownYear, 0, 1);
            periodEnd = new Date(breakdownYear, 11, 31);
        }

        const requestsInPeriod = cardLeaves.filter((request) => {
            if (!request.startDate) return false;
            const requestDate = toDateOnly(request.startDate);
            return requestDate >= periodStart && requestDate <= periodEnd;
        });

        const approvedRequests = requestsInPeriod.filter((r) => r.status === 'Approved');
        const totalLeaveDays = approvedRequests.reduce((sum, request) => sum + (Number(request.totalDays) || 0), 0);
        const lopDays = approvedRequests.reduce((sum, request) => sum + (Number(request.lopCount) || 0), 0);
        
        const pendingCount = requestsInPeriod.filter((r) => r.status === 'Pending').length;
        const rejectedCount = requestsInPeriod.filter((r) => r.status === 'Rejected').length;

        const balanceMonthIndex = breakdownYear === currentYear ? currentMonth : 11;
        const balance = monthlyBreakdown[balanceMonthIndex]?.balance ?? 0;

        return { approved: totalLeaveDays, lop: lopDays, balance, pending: pendingCount, rejected: rejectedCount };
    }, [breakdownPeriod, breakdownYear, cardLeaves, monthlyBreakdown]);

    const metrics = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const filtered = cardLeaves.filter(l => new Date(l.startDate).getMonth() === currentMonth && new Date(l.startDate).getFullYear() === currentYear);
        
        return {
            pending: filtered.filter(l => l.status === 'Pending').length,
            approved: filtered.filter(l => l.status === 'Approved').length,
            rejected: filtered.filter(l => l.status === 'Rejected').length
        };
    }, [cardLeaves]);

    const permissionMetrics = useMemo(() => {
        const now = new Date();
        const todayKey = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let filtered = cardPermissions;
        if (permissionRange === 'month') {
            filtered = cardPermissions.filter((permission) => {
                const date = new Date(permission.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
        } else if (permissionRange === 'year') {
            filtered = cardPermissions.filter((permission) => new Date(permission.date).getFullYear() === currentYear);
        } else if (permissionRange === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = cardPermissions.filter((permission) => new Date(permission.date) >= startOfWeek);
        }

        const approved = filtered.filter((permission) => permission.status === 'Approved');
        const rejected = filtered.filter((permission) => permission.status === 'Rejected');
        const pending = filtered.filter((permission) => permission.status === 'Pending');
        const totalMinutes = approved.reduce((sum, permission) => sum + (Number(permission.totalHours) || 0), 0);
        const todayMinutes = approved
            .filter((permission) => String(permission.date || '').startsWith(todayKey))
            .reduce((sum, permission) => sum + (Number(permission.totalHours) || 0), 0);

        return {
            todayMinutes,
            totalMinutes,
            totalPermissions: filtered.length,
            pending: pending.length,
            approved: approved.length,
            rejected: rejected.length
        };
    }, [cardPermissions, permissionRange]);

    const formatPermissionDuration = (minutes) => {
        const safe = Number(minutes) || 0;
        const h = Math.floor(safe / 60);
        const m = safe % 60;
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h}h`;
        return `${m}m`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: 'transparent' }}>
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
                    padding: 12px;
                    background: transparent;
                    min-height: auto;
                    font-family: 'Outfit', sans-serif;
                    color: #1e293b;
                    box-sizing: border-box;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 14px;
                }


                .title-unit h1 {
                    font-size: 22px;
                    font-weight: 900;
                    margin: 0;
                    letter-spacing: -1px;
                    color: #0f172a;
                }

                .subtitle-unit {
                    font-size: 10px;
                    font-weight: 800;
                    color: #ea580c;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-top: 2px;
                }

                .action-cluster {
                    display: flex;
                    gap: 8px;
                }

                .btn-primary-premium {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-weight: 900;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 10px 25px rgba(234, 88, 12, 0.25);
                }

                .btn-secondary-premium {
                    background: white;
                    color: #0f172a;
                    border: 1.5px solid #e2e8f0;
                    padding: 8px 14px;
                    border-radius: 12px;
                    font-weight: 900;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-secondary-premium:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    background: #fff7ed;
                }

                .balances-row {
                    display: none;
                }

                .balance-card-ui {
                    background: white;
                    border-radius: 20px;
                    border: 1.5px solid #eef2f7;
                    padding: 18px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
                }

                .balance-card-ui:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 45px rgba(0,0,0,0.06);
                }

                .balance-type-label {
                    font-size: 11px;
                    font-weight: 950;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 6px;
                    display: block;
                }

                .balance-val-group {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    margin-bottom: 12px;
                }

                .balance-val-big {
                    font-size: 32px;
                    font-weight: 950;
                    color: #0f172a;
                    letter-spacing: -1.5px;
                }

                .balance-val-total {
                    font-size: 12px;
                    font-weight: 950;
                    color: #94a3b8;
                    text-transform: uppercase;
                }

                .progress-track-ui {
                    height: 8px;
                    width: 100%;
                    background: #f1f5f9;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .progress-fill-ui {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .ma-layout-grid {
                    display: grid;
                    grid-template-columns: 1.25fr 0.75fr;
                    gap: 14px;
                    margin-bottom: 24px;
                }

                .ma-card-ui {
                    background: #fff;
                    border: 1.5px solid #eef2f7;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
                    padding: 16px;
                    height: 390px;
                    display: flex;
                    flex-direction: column;
                }

                .ma-card-title-ui {
                    font-size: 13px;
                    font-weight: 950;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 16px;
                    color: #0f172a;
                }

                .ma-breakdown-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .ma-breakdown-head select {
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 6px 12px;
                    font-size: 12px;
                    font-weight: 900;
                    outline: none;
                    background: #f8fafc;
                    cursor: pointer;
                }

                .ma-breakdown-list {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-right: 8px;
                    margin-bottom: 12px;
                }

                .ma-breakdown-list::-webkit-scrollbar { width: 4px; }
                .ma-breakdown-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .ma-breakdown-item {
                    border: 1.5px solid #eef2f7;
                    border-radius: 14px;
                    padding: 12px;
                    background: #fcfdfe;
                }

                .ma-breakdown-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .ma-breakdown-month {
                    font-size: 13px;
                    font-weight: 950;
                    color: #0f172a;
                }

                .ma-breakdown-status {
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.5px;
                }

                .ma-breakdown-badges {
                    display: flex;
                    gap: 8px;
                }

                .ma-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ma-badge-lop { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
                .ma-badge-availed { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
                .ma-badge-balance { background: rgba(249, 115, 22, 0.1); color: #ea580c; }

                .ma-period-selector {
                    display: inline-flex;
                    gap: 6px;
                    padding: 5px;
                    border-radius: 12px;
                    background: #f1f5f9;
                    margin: 0 auto 16px;
                }

                .ma-period-btn {
                    border: none;
                    background: transparent;
                    color: #64748b;
                    border-radius: 9px;
                    padding: 6px 14px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .ma-period-btn.active {
                    background: #fff;
                    color: #0f172a;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
                }

                .ma-breakdown-mini {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    padding-top: 16px;
                    border-top: 1.5px solid #f1f5f9;
                }

                .ma-breakdown-mini-item {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .ma-breakdown-mini-label {
                    font-size: 9px;
                    font-weight: 950;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 1.5px;
                }

                .ma-breakdown-mini-value {
                    font-size: 26px;
                    font-weight: 950;
                    color: #0f172a;
                    line-height: 1;
                }

                .ma-breakdown-mini-unit {
                    font-size: 10px;
                    font-weight: 900;
                    color: #94a3b8;
                    margin-left: 4px;
                }

                .ma-category-color {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .archive-panel-ui {
                    background: white;
                    border-radius: 20px;
                    border: 1.5px solid #eef2f7;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
                }

                .panel-header-ui {
                    padding: 16px 20px;
                    border-bottom: 2px solid #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .table-ui-premium {
                    width: 100%;
                    border-collapse: collapse;
                }

                .table-ui-premium th {
                    padding: 14px 20px;
                    text-align: left;
                    font-size: 10px;
                    font-weight: 950;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    background: #fbfbfc;
                    border-bottom: 2px solid #f1f5f9;
                }

                .table-ui-premium td {
                    padding: 16px 20px;
                    border-bottom: 1.5px solid #f8fafc;
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                }

                .status-pill-ui {
                    padding: 6px 14px;
                    border-radius: 11px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    border: 1.5px solid;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .dashboard-analysis-layout {
                    display: grid;
                    grid-template-columns: 320px 1.25fr 0.75fr;
                    gap: 14px;
                    margin-bottom: 24px;
                }

                .metrics-circles-card {
                    background: #fff;
                    border: 1.5px solid #eef2f7;
                    border-radius: 20px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 390px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
                }

                .ma-circles-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-areas:
                        'approved approved'
                        'pending rejected';
                    gap: 8px;
                    align-items: center;
                    justify-items: center;
                    flex: 1;
                }

                .stat-circle-ui {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    border: 7px solid;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    transition: all 0.3s ease;
                }

                .stat-circle-ui:hover { transform: scale(1.05); }

                .stat-circle-pending { 
                    border-color: #f9731633; border-left-color: #f97316; border-top-color: #f97316; border-right-color: #f97316; color: #f97316;
                    grid-area: pending;
                } 
                .stat-circle-rejected { 
                    border-color: #ef444433; border-top-color: #ef4444; border-right-color: #ef4444; border-left-color: #ef4444; color: #ef4444;
                    grid-area: rejected;
                }
                .stat-circle-approved { 
                    border-color: #22c55e33; border-bottom-color: #22c55e; border-left-color: #22c55e; border-right-color: #22c55e; color: #22c55e;
                    grid-area: approved;
                    margin-bottom: -15px;
                }

                .circle-label-ui {
                    font-size: 9px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                    margin-bottom: 2px;
                }

                .circle-val-ui {
                    font-size: 24px;
                    font-weight: 950;
                    color: inherit;
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }

                .circle-unit-ui {
                    font-size: 10px;
                    font-weight: 900;
                    opacity: 0.8;
                }

                .ma-category-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #f8fafc;
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                }

                .ma-category-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .ma-category-color {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .table-wrap-compact {
                    margin-top: 12px;
                }

                .tables-stack {
                    display: flex;
                    flex-direction: column;
                }

                .leave-requests-panel {
                    order: 1;
                }

                .permission-insights-panel {
                    order: 2;
                }

                .permission-summary-row {
                    display: grid;
                    grid-template-columns: 0.9fr 1.2fr 1.1fr;
                    gap: 10px;
                    margin-bottom: 12px;
                }

                .permission-metric-card {
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .permission-metric-label {
                    font-size: 11px;
                    font-weight: 900;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .permission-metric-value {
                    font-size: 22px;
                    font-weight: 900;
                    color: #0f172a;
                    line-height: 1;
                    letter-spacing: -0.8px;
                }

                .permission-metric-unit {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 800;
                    margin-left: 6px;
                }

                .status-box-consolidated {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    background: white;
                    border: 1.5px solid #eef2f7;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }

                .status-section {
                    padding: 12px;
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
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                }

                .stat-value-ui {
                    font-size: 22px;
                    font-weight: 950;
                    color: #0f172a;
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    line-height: 1;
                }

                .stat-unit-ui {
                    font-size: 11px;
                    color: #94a3b8;
                    font-weight: 800;
                }

                .range-switch-ui {
                    display: flex;
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 3px;
                    gap: 4px;
                    width: fit-content;
                    margin-bottom: 8px;
                }

                .switch-btn {
                    padding: 5px 10px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 950;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #64748b;
                    background: transparent;
                }

                .switch-btn.active {
                    background: white;
                    color: #0f172a;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .ma-switch-row {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #eef2f7;
                    border-radius: 12px;
                    padding: 5px;
                    margin-bottom: 20px;
                }

                .ma-switch-btn {
                    border: none;
                    background: transparent;
                    border-radius: 9px;
                    padding: 8px 16px;
                    font-size: 11px;
                    font-weight: 950;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .ma-switch-btn.active {
                    background: #fff;
                    color: #0f172a;
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
                }
            `}</style>

            <header className="dashboard-header">
                <div className="title-unit">
                    <h1>MY DASHBOARD</h1>
                </div>
                <div className="action-cluster">
                    <button onClick={() => navigate('/leave/apply')} className="btn-primary-premium"> <Plus size={20}/> REQUEST LEAVE </button>
                    <button onClick={() => navigate('/permission/apply')} className="btn-secondary-premium"> <Clock size={20}/> REQUEST PERMISSION </button>
                </div>
            </header>

            <div className="ma-switch-row">
                <button 
                    className={`ma-switch-btn ${dashView === 'leave' ? 'active' : ''}`} 
                    onClick={() => setDashView('leave')}
                >
                    Leave Overview
                </button>
                <button 
                    className={`ma-switch-btn ${dashView === 'permission' ? 'active' : ''}`} 
                    onClick={() => setDashView('permission')}
                >
                    Permission Overview
                </button>
            </div>

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
                    {dashView === 'leave' ? (
                        <>
                            <section className="dashboard-analysis-layout">
                                <div className="metrics-circles-card">
                                    <div className="ma-circles-grid">
                                        <div className="stat-circle-ui stat-circle-pending">
                                            <span className="circle-label-ui">Pending</span>
                                            <div className="circle-val-ui">
                                                {metrics.pending}
                                            </div>
                                        </div>
                                        <div className="stat-circle-ui stat-circle-rejected">
                                            <span className="circle-label-ui">Rejected</span>
                                            <div className="circle-val-ui">
                                                {metrics.rejected}
                                            </div>
                                        </div>
                                        <div className="stat-circle-ui stat-circle-approved">
                                            <span className="circle-label-ui">Approval</span>
                                            <div className="circle-val-ui">
                                                {metrics.approved}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ma-card-ui">
                                    <div className="ma-breakdown-head">
                                        <div className="ma-card-title-ui" style={{ marginBottom: 0 }}>Monthly Breakdown</div>
                                        <select value={breakdownYear} onChange={(event) => setBreakdownYear(Number(event.target.value))}>
                                            {breakdownYears.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ma-breakdown-list">
                                        {monthlyBreakdown.length === 0 ? (
                                            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                No leave activity recorded for this year
                                            </div>
                                        ) : (
                                            monthlyBreakdown.map((row) => (
                                                <div className="ma-breakdown-item" key={row.key}>
                                                    <div className="ma-breakdown-top">
                                                        <span className="ma-breakdown-month">{row.month}</span>
                                                    </div>
                                                    <div className="ma-breakdown-badges">
                                                        <span className="ma-badge ma-badge-lop">LOP <strong>{row.lop.toFixed(0)}</strong></span>
                                                        <span className="ma-badge ma-badge-availed">Total Leave <strong>{row.totalLeaveDays.toFixed(0)}</strong></span>
                                                        <span className="ma-badge ma-badge-balance">Balance <strong>{row.balance.toFixed(1)}</strong></span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="ma-period-selector">
                                        <button type="button" className={`ma-period-btn ${breakdownPeriod === 'week' ? 'active' : ''}`} onClick={() => setBreakdownPeriod('week')}>Week</button>
                                        <button type="button" className={`ma-period-btn ${breakdownPeriod === 'month' ? 'active' : ''}`} onClick={() => setBreakdownPeriod('month')}>Month</button>
                                        <button type="button" className={`ma-period-btn ${breakdownPeriod === 'year' ? 'active' : ''}`} onClick={() => setBreakdownPeriod('year')}>Year</button>
                                    </div>
                                    <div className="ma-breakdown-mini">
                                        <div className="ma-breakdown-mini-item">
                                            <div className="ma-breakdown-mini-label">Total Leave</div>
                                            <div className="ma-breakdown-mini-value">{yearlyBreakdownTotals.approved.toFixed(0)}</div>
                                        </div>
                                        <div className="ma-breakdown-mini-item">
                                            <div className="ma-breakdown-mini-label">LOP</div>
                                            <div className="ma-breakdown-mini-value">{yearlyBreakdownTotals.lop.toFixed(0)}</div>
                                        </div>
                                        <div className="ma-breakdown-mini-item">
                                            <div className="ma-breakdown-mini-label">Balance</div>
                                            <div className="ma-breakdown-mini-value" style={{ color: '#ea580c' }}>{yearlyBreakdownTotals.balance.toFixed(1)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ma-card-ui">
                                    <div className="ma-card-title-ui" style={{ marginBottom: '20px' }}>By Category</div>
                                    <div style={{ height: '180px', position: 'relative', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '100%', height: '100%' }}>
                                            <PieChart width={220} height={180} style={{ margin: '0 auto' }}>
                                                <Pie 
                                                    data={categoryStats.entries} 
                                                    innerRadius={55} 
                                                    outerRadius={80} 
                                                    dataKey="v" 
                                                    stroke="none"
                                                    paddingAngle={5}
                                                >
                                                    {categoryStats.entries.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip formatter={(value, name) => [`${value} requests`, name]} />
                                            </PieChart>
                                        </div>
                                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                            <span style={{ fontSize: '36px', fontWeight: 950, color: '#0f172a', lineHeight: 1 }}>{categoryStats.total}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Requests</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                                        {categoryStats.entries.map((entry, idx) => {
                                            const percent = categoryStats.total > 0 ? ((entry.v / categoryStats.total) * 100).toFixed(0) : '0';
                                            return (
                                                <div key={`legend-${entry.name}`} className="ma-category-row">
                                                    <div className="ma-category-left">
                                                        <span className="ma-category-color" style={{ background: COLORS[idx % COLORS.length] }} />
                                                        <span style={{ fontSize: '11px', fontWeight: 900 }}>{entry.name}</span>
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: 900 }}>{entry.v} ({percent}%)</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section style={{ marginTop: '18px' }}>
                                <LeaveHistory embedded />
                            </section>
                        </>
                    ) : (
                        <>
                            <div className="permission-summary-row" style={{ marginBottom: '20px' }}>
                                <article className="permission-metric-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                    <span className="permission-metric-label" style={{ color: '#2563eb' }}>Today Permission</span>
                                    <div className="permission-metric-value" style={{ color: '#1d4ed8' }}>
                                        {formatPermissionDuration(permissionMetrics.todayMinutes)}
                                        <span className="permission-metric-unit">USED</span>
                                    </div>
                                </article>

                                <article className="permission-metric-card" style={{ background: '#f8fafc' }}>
                                    <div className="range-switch-ui">
                                        <button className={`switch-btn ${permissionRange === 'week' ? 'active' : ''}`} onClick={() => setPermissionRange('week')}>Week</button>
                                        <button className={`switch-btn ${permissionRange === 'month' ? 'active' : ''}`} onClick={() => setPermissionRange('month')}>Month</button>
                                        <button className={`switch-btn ${permissionRange === 'year' ? 'active' : ''}`} onClick={() => setPermissionRange('year')}>Year</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '22px' }}>
                                        <div>
                                            <span className="stat-label-ui">Total Time</span>
                                            <div className="stat-value-ui">{formatPermissionDuration(permissionMetrics.totalMinutes)}</div>
                                        </div>
                                    </div>
                                </article>

                                <article className="status-box-consolidated">
                                    <div className="status-section">
                                        <span className="stat-label-ui">Approved</span>
                                        <div className="stat-value-ui" style={{ color: '#16a34a' }}>{permissionMetrics.approved}</div>
                                    </div>
                                    <div className="status-section">
                                        <span className="stat-label-ui">Rejected</span>
                                        <div className="stat-value-ui" style={{ color: '#ef4444' }}>{permissionMetrics.rejected}</div>
                                    </div>
                                    <div className="status-section">
                                        <span className="stat-label-ui">Pending</span>
                                        <div className="stat-value-ui" style={{ color: '#f59e0b' }}>{permissionMetrics.pending}</div>
                                    </div>
                                </article>
                            </div>

                            <section className="archive-panel-ui table-wrap-compact permission-insights-panel" style={{ marginBottom: '18px' }}>
                                <header className="panel-header-ui">
                                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Clock size={20} style={{ color: '#3b82f6' }} /> PERMISSION HISTORY
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/permission/history')}
                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                                    >
                                        VIEW MORE <ArrowRight size={16} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                                    </button>
                                </header>

                                <div style={{ overflowX: 'auto' }}>
                                    <table className="table-ui-premium">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Window</th>
                                                <th>Duration</th>
                                                <th>Reason</th>
                                                <th style={{ textAlign: 'center' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cardPermissions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '70px 0', textAlign: 'center' }}>
                                                        <Clock size={48} style={{ color: '#e2e8f0', marginBottom: '12px' }} />
                                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '3px' }}>No permission history found</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                cardPermissions
                                                    .slice()
                                                    .sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a))
                                                    .slice(0, 5)
                                                    .map((permission) => {
                                                        const statusStyle = getStatusStyle(permission.status);
                                                        return (
                                                            <tr key={permission.id}>
                                                                <td>
                                                                    {permission.date ? new Date(permission.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                                </td>
                                                                <td>
                                                                    <span style={{ fontWeight: 800, color: '#475569' }}>
                                                                        {(permission.startTime || '').slice(0, 5)} - {(permission.endTime || '').slice(0, 5)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span style={{ fontWeight: 900 }}>{formatPermissionDuration(permission.totalHours)}</span>
                                                                </td>
                                                                <td style={{ maxWidth: '320px' }}>
                                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{permission.reason || '-'}</div>
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <span className="status-pill-ui" style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>
                                                                        {permission.status === 'Approved' ? <CheckCircle size={12} /> : permission.status === 'Rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                                                                        {permission.status?.toUpperCase() || 'PENDING'}
                                                                    </span>
                                                                    {permission.updatedAt && permission.status !== 'Pending' && (
                                                                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                                                                            {new Date(permission.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
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
                            </section>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
