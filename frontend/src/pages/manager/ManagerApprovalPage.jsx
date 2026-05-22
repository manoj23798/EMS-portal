import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Search,
    Check,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    ShieldCheck,
    Filter,
    RotateCcw,
    Download,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts';
import { LeaveStatsAPI, ManagerAPI } from '../../services/api';

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

const getPresenceRangeBounds = (rangeKey) => {
    const today = toDateOnly(new Date());

    if (rangeKey === 'month') {
        return {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        };
    }

    if (rangeKey === 'year') {
        return {
            start: new Date(today.getFullYear(), 0, 1),
            end: today
        };
    }

    return { start: today, end: today };
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

const formatLeaveTypeLabel = (leaveType) => {
    const normalized = String(leaveType || '').trim().toLowerCase();
    return normalized === 'urgent leave' ? 'Unplanned Leave' : (leaveType || 'Leave');
};

const getSubmittedTimestamp = (request) => {
    const submittedValue = request?.createdAt || request?.submissionDate || request?.submittedAt || request?.appliedDate || request?.startDate;
    const time = submittedValue ? new Date(submittedValue).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
};

const getActionTimestamp = (request) => {
    const actionValue = request?.approvedAt || request?.rejectedAt || request?.updatedAt;
    const time = actionValue ? new Date(actionValue).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
};

const getLeavePaidDays = (request) => Math.max(0, (Number(request.totalDays) || 0) - (Number(request.lopCount) || 0));

const getLeaveTotalDays = (request) => Number(request?.totalDays) || 0;

const formatTooltipDateRange = (request) => {
    if (!request?.startDate || !request?.endDate) return 'N/A';
    const start = new Date(request.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const end = new Date(request.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${start} to ${end}`;
};

const countTotalDaysWithinRange = (request, rangeStart, rangeEnd) => {
    if (!request?.startDate || !request?.endDate || !rangeStart || !rangeEnd) return 0;

    const start = toDateOnly(request.startDate);
    const end = toDateOnly(request.endDate);
    if (end < rangeStart || start > rangeEnd) return 0;

    const totalDays = Math.floor(getLeaveTotalDays(request));
    if (totalDays <= 0) return 0;

    let cursor = new Date(start);
    let counted = 0;
    while (cursor <= end && counted < totalDays) {
        if (cursor >= rangeStart && cursor <= rangeEnd) counted += 1;
        cursor.setDate(cursor.getDate() + 1);
    }

    return counted;
};

const countPaidDaysWithinRange = (request, rangeStart, rangeEnd) => {
    if (!request?.startDate || !request?.endDate || !rangeStart || !rangeEnd) return 0;

    const start = toDateOnly(request.startDate);
    const end = toDateOnly(request.endDate);
    if (end < rangeStart || start > rangeEnd) return 0;

    const totalDays = Math.floor(getLeaveTotalDays(request));
    if (totalDays <= 0) return 0;

    let cursor = new Date(start);
    let counted = 0;
    while (cursor <= end && counted < totalDays) {
        if (cursor >= rangeStart && cursor <= rangeEnd) counted += 1;
        cursor.setDate(cursor.getDate() + 1);
    }

    return counted;
};

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

const MiniCalendar = ({ requests }) => {
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

    for (let i = firstDay - 1; i >= 0; i -= 1) {
        cells.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i += 1) {
        cells.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i += 1) {
        cells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
    }

    const approvedRequests = useMemo(
        () => (requests || []).filter((request) => request.status === 'Approved' && request.startDate && request.endDate),
        [requests]
    );

    const leavesByDate = useMemo(() => {
        const map = new Map();
        approvedRequests.forEach((request) => {
            const start = toDateOnly(request.startDate);
            const end = toDateOnly(request.endDate);
            const cursor = new Date(start);
            while (cursor <= end) {
                const key = formatDateKey(cursor);
                if (!map.has(key)) map.set(key, []);
                map.get(key).push({
                    employeeName: request.employeeName || 'Unknown Employee',
                    leaveType: request.leaveType || 'Leave',
                    reason: request.reason || 'No reason provided'
                });
                cursor.setDate(cursor.getDate() + 1);
            }
        });
        return map;
    }, [approvedRequests]);

    return (
        <div className="ma-custom-calendar">
            <div className="ma-cc-header">
                <div className="ma-cc-title">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year} <ChevronDown size={15} color="#64748b" />
                </div>
                <div className="ma-cc-nav">
                    <button type="button" onClick={prevMonth}><ChevronLeft size={16} /></button>
                    <button type="button" onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="ma-cc-grid">
                {dayNames.map((day, index) => <div key={`dn-${index}`} className="ma-cc-day-name">{day}</div>)}
                {cells.map((cell, index) => {
                    const dateKey = formatDateKey(cell.date);
                    const dayLeaves = leavesByDate.get(dateKey) || [];
                    return (
                        <div key={index} className={`ma-cc-cell ${cell.isCurrentMonth ? '' : 'ma-cc-muted'} ${dayLeaves.length ? 'ma-cc-cell-has-leave' : ''}`}>
                            <div className="ma-cc-circle">
                                {cell.day}
                                {dayLeaves.length > 0 && <span className="ma-cc-dot" />}
                            </div>
                            {dayLeaves.length > 0 && (
                                <div className="ma-cc-tooltip">
                                    {dayLeaves.slice(0, 4).map((leave, idx) => (
                                        <div key={`${dateKey}-${idx}`} className="ma-cc-tooltip-item">
                                            <strong>{leave.employeeName}</strong>
                                            <span>{formatLeaveTypeLabel(leave.leaveType)}</span>
                                            <span>{leave.reason}</span>
                                        </div>
                                    ))}
                                    {dayLeaves.length > 4 && (
                                        <div className="ma-cc-tooltip-more">+{dayLeaves.length - 4} more</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="ma-cc-legend">
                <div className="ma-cc-legend-item">
                    <div className="ma-cc-legend-dot" /> Employee on leave
                </div>
            </div>
        </div>
    );
};

const statusColors = {
    Pending: '#f59e0b',
    Approved: '#10b981',
    Rejected: '#ef4444',
    Canceled: '#64748b'
};

const ManagerApprovalPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [presenceRange, setPresenceRange] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [breakdownYear, setBreakdownYear] = useState(new Date().getFullYear());
    const [breakdownPeriod, setBreakdownPeriod] = useState('year');
    const [filters, setFilters] = useState({
        employeeId: '',
        status: 'ALL',
        leaveType: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [activeCategorySlice, setActiveCategorySlice] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [, allRes] = await Promise.all([
                    LeaveStatsAPI.getAnalytics({}),
                    ManagerAPI.getPendingLeaves()
                ]);
                setAllRequests(allRes.data || []);
            } catch (err) {
                console.error('Failed to fetch manager data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

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

        return Array.from(uniqueEmployees.values()).sort((left, right) => left.label.localeCompare(right.label));
    }, [allRequests]);

    const leaveTypeOptions = useMemo(() => ([
        { value: 'Planned Leave', label: 'Planned Leave' },
        { value: 'Urgent Leave', label: 'Unplanned Leave' },
        { value: 'Casual Leave', label: 'Casual Leave' }
    ]), []);

    const showLopCountColumn = filters.status === 'LOP';

    const filteredRequests = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        const fromDate = filters.dateFrom ? toDateOnly(filters.dateFrom) : null;
        const toDate = filters.dateTo ? toDateOnly(filters.dateTo) : null;

        return allRequests.filter((request) => {
            const requestStart = request.startDate ? toDateOnly(request.startDate) : null;
            const requestEnd = request.endDate ? toDateOnly(request.endDate) : null;

            const matchesSearch = !search || [
                request.employeeName,
                request.employeeId,
                request.leaveType,
                request.reason,
                request.cancelReason,
                request.status,
                request.department,
                request.designation
            ].some((value) => String(value || '').toLowerCase().includes(search));

            const matchesEmployee = !filters.employeeId || String(request.employeeId || '') === String(filters.employeeId);
            const matchesStatus = filters.status === 'ALL'
                || (filters.status === 'LOP'
                    ? (Number(request.lopCount) || 0) > 0
                    : request.status === filters.status);
            const matchesType = !filters.leaveType || String(request.leaveType || '').toLowerCase() === filters.leaveType.toLowerCase();
            const matchesFrom = !fromDate || (requestEnd ? requestEnd >= fromDate : requestStart && requestStart >= fromDate);
            const matchesTo = !toDate || (requestStart ? requestStart <= toDate : requestEnd && requestEnd <= toDate);

            return matchesSearch && matchesEmployee && matchesStatus && matchesType && matchesFrom && matchesTo;
        }).sort((a, b) => getSubmittedTimestamp(b) - getSubmittedTimestamp(a));
    }, [allRequests, searchTerm, filters]);

    const employeeDateFilteredRequests = useMemo(() => filteredRequests, [filteredRequests]);

    const requestsByEmployee = useMemo(() => {
        const grouped = new Map();

        employeeDateFilteredRequests.forEach((request) => {
            const employeeId = request.employeeId;
            if (!employeeId) return;

            const key = String(employeeId);
            if (!grouped.has(key)) {
                grouped.set(key, {
                    employeeId,
                    joiningDate: request.joiningDate || null,
                    requests: []
                });
            }

            const bucket = grouped.get(key);
            if (!bucket.joiningDate && request.joiningDate) {
                bucket.joiningDate = request.joiningDate;
            }
            bucket.requests.push(request);
        });

        return Array.from(grouped.values());
    }, [employeeDateFilteredRequests]);

    const statusSummary = useMemo(() => ({
        pending: filteredRequests.filter((request) => request.status === 'Pending').length,
        approved: filteredRequests.filter((request) => request.status === 'Approved').length,
        rejected: filteredRequests.filter((request) => request.status === 'Rejected').length,
        canceled: filteredRequests.filter((request) => request.status === 'Canceled').length
    }), [filteredRequests]);

    const approvedRequests = useMemo(
        () => employeeDateFilteredRequests.filter((request) => request.status === 'Approved' && request.startDate && request.endDate),
        [employeeDateFilteredRequests]
    );

    const overlapsDate = (request, date) => {
        const start = toDateOnly(request.startDate);
        const end = toDateOnly(request.endDate);
        return date >= start && date <= end;
    };

    const presenceData = useMemo(() => {
        const today = toDateOnly(new Date());
        const { start, end } = getPresenceRangeBounds(presenceRange);

        const filtered = approvedRequests.filter((request) => {
            const requestStart = toDateOnly(request.startDate);
            const requestEnd = toDateOnly(request.endDate);

            // Exclude requests that start in the future.
            if (requestStart > today) return false;

            // Keep current/used leaves that overlap selected range window.
            return requestEnd >= start && requestStart <= end;
        });

        return filtered
            .slice()
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .map((request) => ({
                id: request.id,
                employeeName: request.employeeName || 'Unknown Employee',
                leaveType: request.leaveType || 'Leave',
                reason: request.reason || 'No reason',
                from: new Date(request.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                to: new Date(request.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                totalDays: typeof request.totalDays === 'number' ? request.totalDays.toFixed(1).replace(/\.0$/, '') : request.totalDays
            }));
    }, [approvedRequests, presenceRange]);

    const categoryStats = useMemo(() => {
        const map = new Map();
        employeeDateFilteredRequests
            .filter((request) => request?.status === 'Approved')
            .forEach((request) => {
            const key = formatLeaveTypeLabel(request.leaveType || 'Unknown');
            const existing = map.get(key) || [];
            existing.push({
                employeeName: request.employeeName || 'Unknown Employee',
                reason: request.reason || 'No reason',
                totalDays: typeof request.totalDays === 'number' ? request.totalDays.toFixed(1).replace(/\.0$/, '') : (request.totalDays || '0'),
                dateRange: formatTooltipDateRange(request)
            });
            map.set(key, existing);
        });

        const entries = Array.from(map.entries())
            .map(([name, requests]) => ({ name, v: requests.length, requests }))
            .sort((a, b) => b.v - a.v);

        const total = entries.reduce((sum, item) => sum + item.v, 0);
        return {
            total,
            entries
        };
    }, [employeeDateFilteredRequests]);

    const CategoryTooltip = ({ active, payload, coordinate }) => {
        if (!active || !payload || !payload.length) return null;

        const slice = payload[0]?.payload;
        const requestItems = slice?.requests || [];
        const hideEmployeeName = Boolean(filters.employeeId);
        const tooltipStyle = coordinate
            ? {
                position: 'absolute',
                left: `${coordinate.x - 16}px`,
                top: `${coordinate.y + 16}px`
            }
            : {};

        return (
            <div style={{
                background: 'white',
                border: '1px solid #dbe4ef',
                borderRadius: '14px',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                padding: '12px 14px',
                minWidth: '260px',
                maxWidth: '360px',
                zIndex: 25,
                pointerEvents: 'none',
                transform: coordinate ? 'translateX(-100%)' : 'none',
                ...tooltipStyle
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {slice?.name || 'Leave Category'}
                    </div>
                    <div style={{ textAlign: 'right', lineHeight: 1 }}>
                        <div style={{ fontSize: '9px', fontWeight: 950, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Total Leaves
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: '#ef4444', marginTop: '4px' }}>
                            {slice?.v || 0}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                    {requestItems.map((request, index) => (
                        <div key={`${request.employeeName}-${index}`} style={{ borderBottom: index === requestItems.length - 1 ? 'none' : '1px solid #eef2f7', paddingBottom: index === requestItems.length - 1 ? 0 : '10px' }}>
                            {!hideEmployeeName && (
                                <div style={{ fontSize: '11px', fontWeight: 950, color: '#0f172a', marginBottom: '4px' }}>{request.employeeName}</div>
                            )}
                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                                <div><span style={{ color: '#64748b', textTransform: 'uppercase' }}>Reason:</span> {request.reason}</div>
                                <div><span style={{ color: '#64748b', textTransform: 'uppercase' }}>Days:</span> {request.totalDays}</div>
                                <div><span style={{ color: '#64748b', textTransform: 'uppercase' }}>Date:</span> {request.dateRange}</div>
                            </div>
                        </div>
                    ))}
                    {!requestItems.length && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>No leave records.</div>
                    )}
                </div>
            </div>
        );
    };

    const breakdownYears = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        employeeDateFilteredRequests.forEach((request) => {
            if (request.startDate) years.add(new Date(request.startDate).getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [employeeDateFilteredRequests]);

    const monthlyBreakdown = useMemo(() => {
        const today = toDateOnly(new Date());
        const isCurrentYearView = breakdownYear === today.getFullYear();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

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

        employeeDateFilteredRequests.forEach((request) => {
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

        const monthRequests = employeeDateFilteredRequests.filter((request) => {
            if (!request.startDate) return false;
            const requestDate = new Date(request.startDate);
            return requestDate.getFullYear() === breakdownYear;
        });

        const scopedEmployees = filters.employeeId
            ? requestsByEmployee.filter((bucket) => String(bucket.employeeId) === String(filters.employeeId))
            : requestsByEmployee;

        const joinDates = scopedEmployees
            .map((bucket) => bucket.joiningDate)
            .filter(Boolean)
            .map((dateValue) => toDateOnly(dateValue));

        const earliestJoining = joinDates.length > 0
            ? joinDates.reduce((minDate, dateValue) => (dateValue < minDate ? dateValue : minDate), joinDates[0])
            : null;

        const startBound = earliestJoining
            ? new Date(earliestJoining.getFullYear(), earliestJoining.getMonth(), 1)
            : new Date(breakdownYear, 0, 1);
        const endBound = isCurrentYearView ? currentMonthStart : new Date(breakdownYear, 11, 1);

        const allRows = Array.from(map.values()).map((row, index) => {
            const monthEnd = getMonthEnd(breakdownYear, index);
            const monthStart = getMonthStart(breakdownYear, index);
            const monthHasData = monthRequests.some((request) => {
                const requestDate = new Date(request.startDate);
                return requestDate.getMonth() === index;
            });

            const isFutureMonthInCurrentYear = isCurrentYearView && monthStart > today;
            const balanceAsOf = monthEnd;

            const balance = isFutureMonthInCurrentYear
                ? 0
                : scopedEmployees.reduce((sum, bucket) => {
                    return sum + calculateBalanceAsOfDate(bucket.requests, bucket.joiningDate, balanceAsOf);
                }, 0);

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

            return {
                ...row,
                balance,
                hintText
            };
        });

        return allRows.filter((row, index) => {
            const rowDate = new Date(row.year, index, 1);
            if (rowDate < startBound) return false;
            if (rowDate > endBound) return false;
            return true;
        });
    }, [employeeDateFilteredRequests, breakdownYear, filters.employeeId, requestsByEmployee]);

    const monthMetrics = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const filtered = allRequests.filter((request) => {
            const d = request.startDate ? new Date(request.startDate) : null;
            return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        return {
            totalDays: filtered.reduce((sum, r) => sum + (Number(r.totalDays) || 0), 0),
            pending: filtered.filter((r) => r.status === 'Pending').length,
            approved: filtered.filter((r) => r.status === 'Approved').length,
            rejected: filtered.filter((r) => r.status === 'Rejected').length
        };
    }, [allRequests]);

    const yearlyBreakdownTotals = useMemo(() => {
        const now = new Date();
        const today = toDateOnly(now);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        let periodStart = new Date(breakdownYear, 0, 1);
        let periodEnd = new Date(breakdownYear, 11, 31);

        if (breakdownPeriod === 'week') {
            const startOfNowWeek = new Date(now);
            startOfNowWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            periodStart = new Date(breakdownYear, startOfNowWeek.getMonth(), startOfNowWeek.getDate());
            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 6);
        } else if (breakdownPeriod === 'month') {
            periodStart = new Date(breakdownYear, currentMonth, 1);
            periodEnd = new Date(breakdownYear, currentMonth + 1, 0);
        } else if (breakdownPeriod === 'year') {
            periodStart = new Date(breakdownYear, 0, 1);
            periodEnd = new Date(breakdownYear, 11, 31);
        }

        const requestsInPeriod = employeeDateFilteredRequests.filter((request) => {
            if (!request.startDate) return false;
            const requestDate = toDateOnly(request.startDate);
            return requestDate >= periodStart && requestDate <= periodEnd;
        });

        const approvedRequests = requestsInPeriod.filter((r) => r.status === 'Approved');
        const totalLeaveDays = approvedRequests.reduce((sum, request) => sum + (Number(request.totalDays) || 0), 0);
        const lopDays = approvedRequests.reduce((sum, request) => sum + (Number(request.lopCount) || 0), 0);
        
        const pendingCount = requestsInPeriod.filter((r) => r.status === 'Pending').length;
        const rejectedCount = requestsInPeriod.filter((r) => r.status === 'Rejected').length;

        const balanceMonthKey = `${breakdownYear}-${String(breakdownYear === currentYear ? currentMonth + 1 : 12).padStart(2, '0')}`;
        const balance = monthlyBreakdown.find((row) => row.key === balanceMonthKey)?.balance ?? 0;

        return { approved: totalLeaveDays, lop: lopDays, balance, pending: pendingCount, rejected: rejectedCount };
    }, [breakdownPeriod, breakdownYear, employeeDateFilteredRequests, monthlyBreakdown]);

    const handleReset = () => {
        setSearchTerm('');
        setFilters({ employeeId: '', status: 'ALL', leaveType: '', dateFrom: '', dateTo: '' });
        setShowFilters(false);
    };

    const handleExportXls = () => {
        if (!filteredRequests.length) return;

        const headers = ['Request ID', 'Employee', 'Leave Type', 'Status', 'LOP Count', 'Balance', 'Dates', 'Days', 'Reason', 'Cancel Reason'];
        const rows = filteredRequests.map((request) => [
            request.id,
            request.employeeName,
            formatLeaveTypeLabel(request.leaveType),
            request.status,
            request.lopCount ?? 0,
            request.leaveBalance ?? 0,
            `${request.startDate || ''} -> ${request.endDate || ''}`,
            request.totalDays ?? 0,
            request.reason || '',
            request.cancelReason || ''
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const downloadLink = document.createElement('a');
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'Leave_Requests.csv';
        downloadLink.click();
        URL.revokeObjectURL(url);
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') await ManagerAPI.approveLeave(id, 1, 'Approved');
            else await ManagerAPI.rejectLeave(id, 1, 'Rejected');

            const allRes = await ManagerAPI.getPendingLeaves();
            setAllRequests(allRes.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#cbd5e1'];

    if (loading) {
        return (
            <div className="approval-portal-page" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
                <div style={{ fontWeight: 900, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Loading approvals...</div>
            </div>
        );
    }

    return (
        <div className="approval-portal-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .approval-portal-page {
                    padding: 16px;
                    background: #ffffff;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #0f172a;
                    box-sizing: border-box;
                }

                .ma-portal-switch {
                    display: inline-flex;
                    gap: 6px;
                    padding: 6px;
                    border-radius: 14px;
                    background: #eef2f7;
                    margin-bottom: 10px;
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

                .ma-layout-grid {
                    display: grid;
                    grid-template-columns: 1.15fr 1.2fr 1.25fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .ma-card-ui {
                    background: #fff;
                    border: 1.5px solid #eef2f7;
                    border-radius: 18px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
                    padding: 12px;
                    min-height: 292px;
                }

                .ma-card-title-ui {
                    font-size: 12px;
                    font-weight: 950;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                    color: #0f172a;
                }

                .ma-switch-row {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #eef2f7;
                    border-radius: 11px;
                    padding: 4px;
                    margin-bottom: 10px;
                }

                .ma-switch-btn {
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    padding: 6px 10px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #64748b;
                    cursor: pointer;
                }

                .ma-switch-btn.active {
                    background: #fff;
                    color: #0f172a;
                    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
                }

                .ma-presence-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 214px;
                    overflow-y: auto;
                    padding-right: 4px;
                }

                .ma-presence-item {
                    background: #f8fafc;
                    border: 1px solid #edf2f7;
                    border-radius: 10px;
                    padding: 8px;
                    display: grid;
                    gap: 2px;
                }

                .ma-presence-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                }

                .ma-presence-name {
                    font-size: 11px;
                    font-weight: 900;
                    color: #0f172a;
                }

                .ma-presence-type {
                    font-size: 10px;
                    font-weight: 900;
                    color: #ea580c;
                    text-transform: uppercase;
                }

                .ma-presence-meta {
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                }

                .ma-presence-reason {
                    font-size: 9px;
                    font-weight: 700;
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ma-category-legend {
                    margin-top: 8px;
                    display: grid;
                    gap: 6px;
                }

                .ma-category-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                }

                .ma-category-left {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .ma-category-color {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                }

                .ma-breakdown-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    gap: 8px;
                }

                .ma-breakdown-head select {
                    height: 30px;
                    border-radius: 9px;
                    border: 1px solid #dbe4ef;
                    background: #fff;
                    padding: 0 8px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #334155;
                }

                .ma-breakdown-list {
                    display: grid;
                    gap: 8px;
                    max-height: 188px;
                    overflow-y: auto;
                    padding-right: 4px;
                }

                .ma-breakdown-item {
                    border: 1px solid #e8edf4;
                    border-radius: 12px;
                    padding: 10px;
                    background: #f8fafc;
                }

                .ma-breakdown-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .ma-breakdown-month {
                    font-size: 12px;
                    font-weight: 950;
                    color: #0f172a;
                }

                .ma-breakdown-status {
                    font-size: 8px;
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.5px;
                }

                .ma-breakdown-badges {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 6px;
                    flex-wrap: wrap;
                }

                .ma-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .ma-badge-lop {
                    background: rgba(239, 68, 68, 0.15);
                    color: #dc2626;
                }

                .ma-badge-availed {
                    background: rgba(226, 232, 240, 0.8);
                    color: #334155;
                }

                .ma-badge-balance {
                    background: rgba(234, 88, 12, 0.15);
                    color: #ea580c;
                }

                .ma-breakdown-hint {
                    font-size: 8px;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.3px;
                }

                .ma-period-selector {
                    display: inline-flex;
                    gap: 6px;
                    padding: 4px;
                    border-radius: 12px;
                    background: #eef2f7;
                    margin-bottom: 0;
                }

                .ma-period-btn {
                    border: none;
                    background: transparent;
                    color: #64748b;
                    border-radius: 8px;
                    padding: 4px 10px;
                    font-size: 10px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .ma-period-btn.active {
                    background: #fff;
                    color: #0f172a;
                    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
                }

                .ma-breakdown-mini {
                    margin-top: 12px;
                    border: 1px solid #e8edf4;
                    border-radius: 12px;
                    padding: 12px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    background: #f8fafc;
                }

                .ma-breakdown-mini-item {
                    border-right: 1px solid #dde7f2;
                    padding-right: 12px;
                    text-align: center;
                }

                .ma-breakdown-mini-item:last-child {
                    border-right: none;
                    padding-right: 0;
                }

                .ma-breakdown-mini-label {
                    font-size: 9px;
                    font-weight: 950;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 1px;
                    margin-bottom: 6px;
                }

                .ma-breakdown-mini-value {
                    font-size: 28px;
                    font-weight: 950;
                    letter-spacing: -1px;
                    line-height: 1;
                    color: #0f172a;
                }

                .ma-breakdown-mini-unit {
                    font-size: 10px;
                    font-weight: 900;
                    color: #64748b;
                    margin-left: 4px;
                    text-transform: uppercase;
                }

                .ma-cc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .ma-cc-title {
                    font-size: 24px;
                    font-weight: 950;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #0f172a;
                }

                .ma-cc-nav {
                    display: inline-flex;
                    gap: 4px;
                }

                .ma-cc-nav button {
                    width: 24px;
                    height: 24px;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    background: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #334155;
                }

                .ma-cc-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }

                .ma-cc-day-name {
                    font-size: 10px;
                    font-weight: 950;
                    color: #64748b;
                    text-align: center;
                    margin-bottom: 4px;
                }

                .ma-cc-cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 27px;
                    position: relative;
                }

                .ma-cc-circle {
                    width: 24px;
                    height: 24px;
                    border-radius: 7px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    position: relative;
                }

                .ma-cc-muted {
                    opacity: 0.35;
                }

                .ma-cc-dot {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ef4444;
                    bottom: 0;
                    right: 0;
                }

                .ma-cc-tooltip {
                    display: none;
                    position: absolute;
                    top: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #0f172a;
                    color: #e2e8f0;
                    border-radius: 10px;
                    padding: 8px;
                    width: 205px;
                    z-index: 20;
                    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.35);
                }

                .ma-cc-cell-has-leave:hover .ma-cc-tooltip {
                    display: block;
                }

                .ma-cc-tooltip-item {
                    display: grid;
                    gap: 2px;
                    padding: 3px 0;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                }

                .ma-cc-tooltip-item:last-child {
                    border-bottom: none;
                }

                .ma-cc-tooltip-item strong {
                    font-size: 10px;
                    color: #f8fafc;
                }

                .ma-cc-tooltip-item span {
                    font-size: 9px;
                    line-height: 1.2;
                    color: #94a3b8;
                }

                .ma-cc-tooltip-more {
                    margin-top: 4px;
                    font-size: 9px;
                    color: #94a3b8;
                    text-align: right;
                }

                .ma-cc-legend {
                    margin-top: 10px;
                }

                .ma-cc-legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #334155;
                    font-size: 12px;
                    font-weight: 800;
                }

                .ma-cc-legend-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #ef4444;
                }

                .ma-table-container {
                    background: #fff;
                    border-radius: 22px;
                    border: 1.5px solid #f1f5f9;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
                }

                .ma-filter-topbar {
                    padding: 14px 18px;
                    border-bottom: 1.5px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .ma-status-strip {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .ma-status-strip-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 70px;
                }

                .ma-status-strip-label {
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #64748b;
                }

                .ma-status-strip-value {
                    font-size: 30px;
                    line-height: 1;
                    font-weight: 950;
                }

                .ma-filter-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    margin-left: auto;
                }

                .ma-search-chip {
                    position: relative;
                    width: 280px;
                    max-width: 100%;
                }

                .ma-search-chip input {
                    width: 100%;
                    height: 38px;
                    border-radius: 14px;
                    border: 1.5px solid #f97316;
                    background: #fff;
                    padding: 0 16px 0 40px;
                    font-size: 12px;
                    font-weight: 800;
                    outline: none;
                    color: #1e293b;
                    box-shadow: 0 8px 15px rgba(249, 115, 22, 0.08);
                }

                .ma-search-chip svg {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #f97316;
                }

                .ma-toolbar-btn { 
                    height: 38px; 
                    border-radius: 12px; 
                    border: 1.5px solid #e2e8f0; 
                    background: #fff; 
                    padding: 0 14px; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 8px; 
                    font-size: 10px; 
                    font-weight: 950; 
                    cursor: pointer; 
                    text-transform: uppercase; 
                    letter-spacing: 0.8px; 
                    color: #475569; 
                    transition: 0.2s; 
                }
                .ma-toolbar-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .ma-toolbar-btn.active { background: #f0f9ff; border-color: #bae6fd; color: #0ea5e9; }
                .ma-toolbar-btn.clear { color: #64748b; }
                .ma-toolbar-btn.export { color: #16a34a; border-color: #86efac; background: #f0fdf4; }

                .ma-table-container { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); overflow: hidden; margin-bottom: 20px; }
                .ma-filter-topbar { padding: 12px 18px; border-bottom: 3.5px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
                
                .ma-header-metrics { display: flex; align-items: center; gap: 18px; }
                .ma-header-metric-item { display: flex; flex-direction: column; }
                .ma-header-metric-label { font-size: 8px; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
                .ma-header-metric-value { font-size: 18px; font-weight: 950; line-height: 1; display: flex; align-items: baseline; gap: 3px; }
                .ma-header-metric-unit { font-size: 8px; font-weight: 950; color: #334155; }
                .ma-header-divider { width: 1.5px; height: 28px; background: #e2e8f0; margin: 0 2px; }

                .ma-filter-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; flex: 1; }
                .ma-search-chip { position: relative; flex: 0 1 340px; }
                .ma-search-chip input { width: 100%; height: 38px; border-radius: 14px; border: 1.5px solid #fdba74; background: #fff; padding: 0 16px 0 40px; font-size: 12px; font-weight: 800; outline: none; color: #1e293b; transition: 0.2s; }
                .ma-search-chip input:focus { border-color: #f97316; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
                .ma-search-chip svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #f97316; }

                .ma-filter-panel { padding: 16px 18px; background: #f8fafc; border-bottom: 2px solid #eef2f7; }
                .ma-filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }

                .ma-filter-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .ma-filter-field label {
                    font-size: 10px;
                    font-weight: 950;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                }

                .ma-filter-field select,
                .ma-filter-field input {
                    height: 38px;
                    border-radius: 10px;
                    border: 1.5px solid #dbe4ef;
                    background: #fff;
                    padding: 0 12px;
                    font-size: 12px;
                    font-weight: 800;
                    outline: none;
                    color: #1e293b;
                }

                .ma-filter-field select:focus,
                .ma-filter-field input:focus {
                    border-color: #f97316;
                    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.08);
                }

                .ma-table-ui {
                    width: 100%;
                    border-collapse: collapse;
                }

                .ma-table-ui th {
                    padding: 12px 18px;
                    background: #edf2f7;
                    border-bottom: 2px solid #f1f5f9;
                    font-size: 9px;
                    font-weight: 950;
                    text-transform: uppercase;
                    color: #1e293b;
                    letter-spacing: 1.5px;
                    text-align: left;
                }

                .ma-table-ui td {
                    padding: 14px 18px;
                    border-bottom: 1.5px solid #f8fafc;
                    font-size: 13px;
                    font-weight: 800;
                    color: #1e293b;
                    vertical-align: middle;
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

                .ma-btn-approve:hover {
                    background: #059669;
                    color: #fff;
                }

                .ma-btn-reject {
                    background: #f8fafc;
                    color: #64748b;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 8px 12px;
                    font-size: 11px;
                    font-weight: 950;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .ma-btn-reject:hover {
                    background: #fef2f2;
                    color: #dc2626;
                    border-color: #fee2e2;
                }

                @media (max-width: 1400px) {
                    .ma-layout-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (max-width: 900px) {
                    .ma-layout-grid {
                        grid-template-columns: 1fr;
                    }

                    .ma-filter-grid {
                        grid-template-columns: 1fr;
                    }

                    .ma-search-chip {
                        width: 100%;
                    }

                    .ma-filter-actions {
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
                <div className="ma-layout-grid">
                    <div className="ma-card-ui">
                        <MiniCalendar requests={employeeDateFilteredRequests} />
                    </div>

                    <div className="ma-card-ui">
                        <div className="ma-card-title-ui">On Leave</div>
                        <div className="ma-switch-row">
                            {['today', 'month', 'year'].map((range) => (
                                <button
                                    key={range}
                                    className={`ma-switch-btn ${presenceRange === range ? 'active' : ''}`}
                                    onClick={() => setPresenceRange(range)}
                                    type="button"
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="ma-presence-list">
                            {presenceData.length > 0 ? presenceData.map((item) => (
                                <div key={item.id} className="ma-presence-item">
                                    <div className="ma-presence-top">
                                        <span className="ma-presence-name">{item.employeeName}</span>
                                        <span className="ma-presence-type">{formatLeaveTypeLabel(item.leaveType)}</span>
                                    </div>
                                    <div className="ma-presence-meta">{item.from} - {item.to} • {item.totalDays} days</div>
                                    <div className="ma-presence-reason">{item.reason}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '11px', fontWeight: 900 }}>
                                    No leave records for selected range.
                                </div>
                            )}
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
                                    No records found for this period
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
                        {/* Period selector removed — defaulting to yearly breakdown */}
                        <div className="ma-breakdown-mini">
                            <div className="ma-breakdown-mini-item">
                                <div className="ma-breakdown-mini-label">Total Leave</div>
                                <div className="ma-breakdown-mini-value">{yearlyBreakdownTotals.approved.toFixed(0)}<span className="ma-breakdown-mini-unit">Days</span></div>
                            </div>
                            <div className="ma-breakdown-mini-item">
                                <div className="ma-breakdown-mini-label">LOP</div>
                                <div className="ma-breakdown-mini-value">{yearlyBreakdownTotals.lop.toFixed(0)}<span className="ma-breakdown-mini-unit">Days</span></div>
                            </div>
                            <div className="ma-breakdown-mini-item">
                                <div className="ma-breakdown-mini-label">Balance</div>
                                <div className="ma-breakdown-mini-value" style={{ color: '#ea580c' }}>{yearlyBreakdownTotals.balance.toFixed(1)}<span className="ma-breakdown-mini-unit">Days</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="ma-card-ui">
                        <div className="ma-card-title-ui">By Category</div>
                        <div style={{ height: '175px', position: 'relative', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryStats.entries}
                                        innerRadius={52}
                                        outerRadius={72}
                                        dataKey="v"
                                        stroke="none"
                                        onMouseEnter={(_, index) => setActiveCategorySlice(index)}
                                        onMouseLeave={() => setActiveCategorySlice(null)}
                                    >
                                        {categoryStats.entries.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip
                                        content={<CategoryTooltip />}
                                        cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                                        allowEscapeViewBox={{ x: true, y: true }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: activeCategorySlice === null ? 1 : 0 }}>
                                <span style={{ fontSize: '36px', fontWeight: 950, color: '#0f172a', lineHeight: 1 }}>{categoryStats.total}</span>
                                <span style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase' }}>Requests</span>
                            </div>
                        </div>
                        <div className="ma-category-legend">
                            {categoryStats.entries.map((entry, idx) => {
                                const percent = categoryStats.total > 0 ? ((entry.v / categoryStats.total) * 100).toFixed(0) : '0';
                                return (
                                    <div key={`legend-${entry.name}`} className="ma-category-row">
                                        <div className="ma-category-left">
                                            <span className="ma-category-color" style={{ background: COLORS[idx % COLORS.length] }} />
                                            <span>{entry.name}</span>
                                        </div>
                                        <span>{entry.v}({percent}%)</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <section className="ma-table-container">
                <div className="ma-filter-topbar">
                    <div className="ma-header-metrics">
                        <div className="ma-header-metric-item">
                            <div className="ma-header-metric-label">Pending</div>
                            <div className="ma-header-metric-value" style={{ color: statusColors.Pending }}>{monthMetrics.pending}</div>
                        </div>
                        <div className="ma-header-divider" />
                        <div className="ma-header-metric-item">
                            <div className="ma-header-metric-label">Approved</div>
                            <div className="ma-header-metric-value" style={{ color: statusColors.Approved }}>{monthMetrics.approved}</div>
                        </div>
                        <div className="ma-header-divider" />
                        <div className="ma-header-metric-item">
                            <div className="ma-header-metric-label">Rejected</div>
                            <div className="ma-header-metric-value" style={{ color: statusColors.Rejected }}>{monthMetrics.rejected}</div>
                        </div>
                    </div>

                    <div className="ma-filter-actions">
                        <div className="ma-search-chip">
                            <Search size={16} />
                            <input
                                placeholder="Search by ID or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className={`ma-toolbar-btn ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters((value) => !value)}
                        >
                            <Filter size={14} /> Show Filters
                        </button>
                        <button type="button" className="ma-toolbar-btn clear" onClick={handleReset}>
                            <RotateCcw size={14} /> Clear
                        </button>
                        <button type="button" className="ma-toolbar-btn export" onClick={handleExportXls}>
                            <Download size={14} /> Export XLS
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="ma-filter-panel">
                        <div className="ma-filter-grid">
                            <div className="ma-filter-field">
                                <label>Employee</label>
                                <select value={filters.employeeId} onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))}>
                                    <option value="">All Employees</option>
                                    {employeeOptions.map((employee) => (
                                        <option key={employee.value} value={employee.value}>{employee.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ma-filter-field">
                                <label>Status</label>
                                <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                                    <option value="ALL">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="LOP">LOP</option>
                                    <option value="Canceled">Canceled</option>
                                </select>
                            </div>
                            <div className="ma-filter-field">
                                <label>Leave Category</label>
                                <select value={filters.leaveType} onChange={(e) => setFilters((prev) => ({ ...prev, leaveType: e.target.value }))}>
                                    <option value="">All Categories</option>
                                    {leaveTypeOptions.map((leaveType) => (
                                        <option key={leaveType.value} value={leaveType.value}>{leaveType.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ma-filter-field">
                                <label>From Date</label>
                                <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
                            </div>
                            <div className="ma-filter-field">
                                <label>Until Date</label>
                                <input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                )}

                <table className="ma-table-ui">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Leave Type</th>
                            <th>Reason</th>
                            {showLopCountColumn && <th style={{ textAlign: 'center' }}>LOP Count</th>}
                            <th>Submitted On</th>
                            <th>Dates</th>
                            <th style={{ textAlign: 'center' }}>Total Days</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((lr) => (
                            <tr key={lr.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                backgroundColor: '#f1f5f9',
                                                backgroundImage: lr.profilePhotoUrl ? `url(${lr.profilePhotoUrl})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                                border: '1px solid #e2e8f0',
                                                flexShrink: 0
                                            }}
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <div style={{ fontWeight: 900, color: '#0f172a' }}>{lr.employeeName}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>ID: EMP-{String(lr.employeeId).slice(-4)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span style={{ color: '#ea580c', fontWeight: 900 }}>{formatLeaveTypeLabel(lr.leaveType)}</span></td>
                                <td style={{ color: '#64748b', fontSize: '13px', fontWeight: 800, maxWidth: '260px' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lr.reason || '-'}>{lr.reason || '-'}</div>
                                    {lr.status === 'Canceled' && lr.cancelReason && (
                                        <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: 900, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lr.cancelReason}>
                                            Cancel: {lr.cancelReason}
                                        </div>
                                    )}
                                </td>
                                {showLopCountColumn && (
                                    <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 950, color: (Number(lr.lopCount) || 0) > 0 ? '#ef4444' : '#64748b' }}>
                                        {typeof lr.lopCount === 'number' ? lr.lopCount.toFixed(1).replace(/\.0$/, '') : 0}
                                    </td>
                                )}
                                <td style={{ color: '#64748b' }}>{new Date(lr.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>{new Date(lr.startDate).getDate()} - {new Date(lr.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td style={{ textAlign: 'center' }}>{typeof lr.totalDays === 'number' ? lr.totalDays.toFixed(1).replace(/\.0$/, '') : lr.totalDays} Days</td>
                                <td>
                                    {lr.status === 'Approved' ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="ma-status-label" style={{ background: '#ecfdf5', color: '#059669' }}>Approved</span>
                                            {getActionTimestamp(lr) > 0 && <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>Approved on {new Date(getActionTimestamp(lr)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                                        </div>
                                    ) : lr.status === 'Canceled' ? (
                                        <span className="ma-status-label" style={{ background: '#f1f5f9', color: '#475569' }}>Canceled</span>
                                    ) : lr.status === 'Rejected' ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="ma-status-label" style={{ background: '#fef2f2', color: '#dc2626' }}>Rejected</span>
                                            {getActionTimestamp(lr) > 0 && <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>Rejected on {new Date(getActionTimestamp(lr)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button className="ma-btn-approve" type="button" onClick={() => handleAction(lr.id, 'approve')}>
                                                <Check size={14} strokeWidth={4} /> Approve
                                            </button>
                                            <button className="ma-btn-reject" type="button" onClick={() => handleAction(lr.id, 'reject')}>
                                                <X size={14} strokeWidth={3} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredRequests.length === 0 && (
                            <tr>
                                <td colSpan={showLopCountColumn ? 8 : 7} style={{ padding: '100px 0', textAlign: 'center' }}>
                                    <ShieldCheck size={64} style={{ color: '#f1f5f9', marginBottom: '20px' }} />
                                    <div style={{ fontSize: '12px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', letterSpacing: '4px' }}>No requests found</div>
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
