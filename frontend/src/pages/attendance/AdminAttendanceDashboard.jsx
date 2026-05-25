import React, { useEffect, useMemo, useState } from 'react';
import { AdminAttendanceAPI } from '../../services/api';
import MonthlyAttendanceGrid from '../../components/MonthlyAttendanceGrid';
import { CalendarDays, Download, Filter, Info, RotateCcw, Search } from 'lucide-react';

const SHIFT_START_HOUR = 9;
const SHIFT_START_MINUTE = 0;
const SHIFT_START_MINUTES = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;

export default function AdminAttendanceDashboard() {
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(todayDate);
    const [toDate, setToDate] = useState(todayDate);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('daily');
    const rowsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, searchTerm, statusFilter]);

    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDate, toDate]);

    const getRangeBounds = () => {
        if (!fromDate || !toDate) return [todayDate, todayDate];
        return fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError('');
            const [startDate, endDate] = getRangeBounds();
            const res = await AdminAttendanceAPI.getHistory(startDate, endDate);
            setRecords(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
            setError(err.response?.data?.message || 'Failed to load attendance records');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const [startDate, endDate] = getRangeBounds();
            const res = await AdminAttendanceAPI.exportExcel(startDate, endDate);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '---';
        const parts = String(timeStr).split(':');
        const h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m} ${ampm}`;
    };

    const formatMinutes = (totalMins) => {
        if (totalMins == null || totalMins === '') return '0 M';
        const value = Math.max(0, Number(totalMins) || 0);
        const hrs = Math.floor(value / 60);
        const mins = value % 60;
        if (hrs === 0) return `${mins} M`;
        if (mins === 0) return `${hrs}h`;
        return `${hrs}h ${mins}m`;
    };

    const normalizeStatus = (status, inTime) => {
        const value = String(status || '').trim().toLowerCase();
        if (!value) return '--';
        if (value === 'absent') return 'Absent';
        if (value.includes('leave') || value === 'lop' || value.includes('loss of pay')) return 'Leave';
        if (value === 'holiday') return 'Holiday';
        if (value === 'permission') return 'Permission';
        if (inTime) {
            const [hours, minutes] = String(inTime).split(':').map((part) => parseInt(part, 10));
            const checkInMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
            return checkInMinutes > SHIFT_START_MINUTES ? 'Late' : 'Present';
        }
        if (value === 'present') return 'Present';
        if (value === 'late') return 'Late';
        return String(status || '').trim();
    };

    const toHHMM = (timeValue) => String(timeValue || '').substring(0, 5);

    const getBreakBreakdownLines = (record) => {
        if (!record?.breaks || !Array.isArray(record.breaks)) return [];

        return record.breaks
            .filter((b) => b?.breakStart && b?.breakEnd && b?.duration != null)
            .map((b) => ({
                label: String(b.breakType || '').toUpperCase() === 'LUNCH' ? 'Lunch break' : 'Tea break',
                start: toHHMM(b.breakStart),
                end: toHHMM(b.breakEnd),
                duration: b.duration
            }));
    };

    const getPermissionLines = (record) => {
        if (!record?.permissions || !Array.isArray(record.permissions)) return [];

        return record.permissions
            .filter((p) => p?.startTime && p?.endTime)
            .map((p) => ({
                start: toHHMM(p.startTime),
                end: toHHMM(p.endTime),
                total: p.totalHours
            }));
    };

    const filteredRecords = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return records.filter((record) => {
            const normalizedStatus = normalizeStatus(record.status, record.inTime);
            const statusMatch = statusFilter === 'ALL' || normalizedStatus === statusFilter;
            if (!statusMatch) return false;

            if (!term) return true;

            return (
                String(record.date || '').toLowerCase().includes(term) ||
                String(record.employeeName || '').toLowerCase().includes(term) ||
                String(record.employeeId || '').toLowerCase().includes(term) ||
                normalizedStatus.toLowerCase().includes(term)
            );
        });
    }, [records, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const present = filteredRecords.filter((r) => normalizeStatus(r.status, r.inTime) === 'Present').length;
        const late = filteredRecords.filter((r) => normalizeStatus(r.status, r.inTime) === 'Late').length;
        const absent = filteredRecords.filter((r) => normalizeStatus(r.status, r.inTime) === 'Absent').length;
        const leave = filteredRecords.filter((r) => normalizeStatus(r.status, r.inTime) === 'Leave').length;
        return {
            total: filteredRecords.length,
            present: present + late,
            late,
            absent,
            leave
        };
    }, [filteredRecords]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
    const pagedRecords = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredRecords.slice(start, start + rowsPerPage);
    }, [filteredRecords, currentPage]);

    const getLateLabel = (record) => {
        const normalized = normalizeStatus(record.status, record.inTime);
        if (normalized !== 'Late' || !record?.inTime) return normalized;

        const [h, m] = String(record.inTime).split(':').map((value) => parseInt(value, 10));
        const inMinutes = (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
        const shiftStartMinutes = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;
        const diffMinutes = Math.max(0, inMinutes - shiftStartMinutes);

        return diffMinutes > 0 ? `Late - ${formatMinutes(diffMinutes)}` : 'Late';
    };

    if (loading) {
        return (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
                <div style={{ fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading daily monitoring...</div>
            </div>
        );
    }

    return (
        <div className="attendance-portal-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .attendance-portal-page {
                    --ap-ink-900: #1e293b;
                    --ap-ink-700: #64748b;
                    --ap-surface: #ffffff;
                    --ap-orange: #f97316;
                    --ap-orange-soft: #fff7ed;
                    --ap-line: #cbd5e1;
                    padding: 10px 12px 12px 12px;
                    background: #ffffff;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: var(--ap-ink-900);
                    box-sizing: border-box;
                }

                .ap-table-shell {
                    background: var(--ap-surface);
                    border-radius: 20px;
                    border: 1.5px solid #cbd5e1;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
                    overflow: hidden;
                }

                .ap-filter-topbar {
                    padding: 12px 16px;
                    border-bottom: 1.5px solid #cbd5e1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .ap-view-switch {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px;
                    border: 1.5px solid #dbe4ef;
                    border-radius: 999px;
                    background: #f8fafc;
                }

                .ap-view-switch button {
                    border: 0;
                    background: transparent;
                    color: #64748b;
                    font-size: 9px;
                    font-weight: 950;
                    letter-spacing: 0.7px;
                    text-transform: uppercase;
                    padding: 7px 12px;
                    border-radius: 999px;
                    cursor: pointer;
                }

                .ap-view-switch button.active {
                    background: #f97316;
                    color: #fff;
                    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.18);
                }

                .ap-header-metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .ap-header-metric-item {
                    display: flex;
                    flex-direction: column;
                    min-width: 76px;
                    padding: 5px 10px;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    background: #f8fafc;
                }
                .ap-header-metric-label { font-size: 10px; font-weight: 950; color: #8ca0bc; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 0; }
                .ap-header-metric-value { font-size: 18px; font-weight: 950; color: #0b1b3b; line-height: 1; }

                .ap-filter-actions { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }
                .ap-search-chip { position: relative; flex: 0 1 320px; }
                .ap-search-chip input {
                    width: 100%;
                    height: 34px;
                    border-radius: 14px;
                    border: 1.5px solid #f5bf84;
                    background: #fff;
                    padding: 0 14px 0 36px;
                    font-size: 11px;
                    font-weight: 800;
                    outline: none;
                }
                .ap-search-chip svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #f97316; }

                .ap-toolbar-btn {
                    height: 34px;
                    padding: 0 12px;
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    background: #f6f8fb;
                    color: #5d7392;
                    font-size: 8px;
                    font-weight: 950;
                    text-transform: uppercase;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .ap-toolbar-btn.export { color: #15803d; border-color: #86efac; background: #f0fdf4; }

                .ap-filters-panel {
                    padding: 10px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .ap-filters-panel select,
                .ap-filters-panel input {
                    height: 34px;
                    border-radius: 10px;
                    border: 1.5px solid #dbe4ef;
                    padding: 0 10px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #1e293b;
                    background: #fff;
                    outline: none;
                }

                .ap-table-wrap { overflow-x: auto; }
                .ap-table { width: 100%; border-collapse: collapse; table-layout: auto; }
                .ap-table th {
                    padding: 11px 14px;
                    background: #eef3f8;
                    border-bottom: 1.5px solid #e2e8f0;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                    color: #334f74;
                    letter-spacing: 1px;
                    text-align: left;
                    white-space: nowrap;
                }
                .ap-table td {
                    padding: 14px;
                    border-bottom: 1px solid #eaf0f6;
                    font-size: 13px;
                    font-weight: 900;
                    color: #1e293b;
                    white-space: nowrap;
                }

                .ap-status-pill {
                    padding: 6px 10px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                }
                .ap-status-present { background: #ecfdf5; color: #059669; }
                .ap-status-late { background: #fff7ed; color: #ea580c; }
                .ap-status-absent { background: #fef2f2; color: #dc2626; }
                .ap-status-leave { background: #f1f5f9; color: #64748b; }
                .ap-status-other { background: #e2e8f0; color: #334155; }

                .ap-break-cell {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    position: relative;
                }

                .ap-break-info-icon {
                    position: relative;
                    cursor: help;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #dbeafe;
                    color: #0369a1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .ap-break-info-icon svg { width: 12px; height: 12px; }

                .ap-break-tooltip {
                    display: none;
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    transform: none;
                    background: #1e293b;
                    color: #ffffff;
                    padding: 10px 12px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: normal;
                    z-index: 1000;
                    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
                    line-height: 1.4;
                    pointer-events: none;
                    min-width: 260px;
                    margin-bottom: 8px;
                }

                .ap-break-info-icon:hover .ap-break-tooltip { display: block; }

                .ap-break-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 18px;
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 4px solid #1e293b;
                }

                .ap-break-tooltip-line {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 800;
                }

                .ap-pager {
                    padding: 8px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1.5px solid #e2e8f0;
                    background: white;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .ap-pager-controls { display: flex; align-items: center; gap: 6px; }
                .ap-pager-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 1.5px solid #dbe4ef;
                    background: white;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .ap-pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }

                .ap-pager-page {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 1.5px solid #dbe4ef;
                    background: white;
                    color: #334155;
                    font-size: 10px;
                    font-weight: 900;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ap-pager-page.active { background: #f97316; border-color: #f97316; color: #fff; box-shadow: 0 4px 10px rgba(249,115,22,0.2); }

                @media (max-width: 900px) {
                    .ap-filter-actions { width: 100%; justify-content: stretch; }
                    .ap-search-chip { flex: 1 1 auto; }
                    .ap-header-metrics { width: 100%; }
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="ap-header-metrics">
                        <div className="ap-header-metric-item">
                            <div className="ap-header-metric-label">Records</div>
                            <div className="ap-header-metric-value">{stats.total}</div>
                        </div>
                        <div className="ap-header-metric-item">
                            <div className="ap-header-metric-label">Present</div>
                            <div className="ap-header-metric-value" style={{ color: '#10b981' }}>{stats.present}</div>
                        </div>
                        <div className="ap-header-metric-item">
                            <div className="ap-header-metric-label">Late</div>
                            <div className="ap-header-metric-value" style={{ color: '#f59e0b' }}>{stats.late}</div>
                        </div>
                        <div className="ap-header-metric-item">
                            <div className="ap-header-metric-label">Absent</div>
                            <div className="ap-header-metric-value" style={{ color: '#ef4444' }}>{stats.absent}</div>
                        </div>
                        <div className="ap-header-metric-item">
                            <div className="ap-header-metric-label">Leave</div>
                            <div className="ap-header-metric-value" style={{ color: '#64748b' }}>{stats.leave}</div>
                        </div>
                    </div>
                    <div className="ap-view-switch" aria-label="Attendance view mode">
                        <button type="button" className={viewMode === 'daily' ? 'active' : ''} onClick={() => setViewMode('daily')}>
                            Daily View
                        </button>
                        <button type="button" className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')}>
                            Monthly Grid
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                    <div className="ap-search-chip">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Filter by name, date or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="button" className="ap-toolbar-btn" onClick={() => setShowFilters((value) => !value)}>
                        <Filter size={14} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button type="button" className="ap-toolbar-btn" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>
                        <RotateCcw size={14} /> Reset
                    </button>
                </div>
            </div>

            {viewMode === 'monthly' ? (
                <MonthlyAttendanceGrid />
            ) : (
            <div className="ap-table-shell">
                {viewMode === 'daily' && (
                <div className="ap-filter-topbar" style={{ borderBottom: 'none', padding: 0 }}>
                </div>
                )}

                {viewMode === 'daily' && showFilters && (
                    <div className="ap-filters-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarDays size={14} color="#f97316" />
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>To</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarDays size={14} color="#f97316" />
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                                <option value="Leave">Leave</option>
                                <option value="Permission">Permission</option>
                            </select>
                            <button type="button" className="ap-toolbar-btn export" onClick={handleExport} disabled={exporting}>
                                <Download size={14} /> {exporting ? '...' : 'Export XLS'}
                            </button>
                        </div>
                    </div>
                )}

                {viewMode === 'daily' && error && (
                    <div style={{ margin: '12px 16px 0 16px', padding: '10px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 800 }}>
                        {error}
                    </div>
                )}

                <div className="ap-table-wrap">
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Employee Name</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Break</th>
                                <th>Permission</th>
                                <th>Total Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        No records found for the selected date.
                                    </td>
                                </tr>
                            ) : (
                                pagedRecords.map((record) => {
                                    const normalized = normalizeStatus(record.status, record.inTime);
                                    const statusClass = normalized === 'Present'
                                        ? 'ap-status-present'
                                        : normalized === 'Late'
                                            ? 'ap-status-late'
                                            : normalized === 'Absent'
                                                ? 'ap-status-absent'
                                                : normalized === 'Leave'
                                                    ? 'ap-status-leave'
                                                    : 'ap-status-other';

                                    return (
                                        <tr key={record.id ?? `${record.employeeId}-${record.date}`}>
                                            <td style={{ color: '#64748b', fontSize: 12, fontWeight: 900 }}>{record.date || '---'}</td>
                                            <td>{record.employeeName || '---'}</td>
                                            <td>{formatTime(record.inTime)}</td>
                                            <td>{formatTime(record.outTime)}</td>
                                            <td>
                                                <span className="ap-break-cell">
                                                    <span>{formatMinutes(record.breakDuration)}</span>
                                                    {getBreakBreakdownLines(record).length > 0 && (
                                                        <span className="ap-break-info-icon">
                                                            <Info />
                                                            <span className="ap-break-tooltip">
                                                                {getBreakBreakdownLines(record).map((line, index) => (
                                                                    <span className="ap-break-tooltip-line" key={`${record.id ?? record.date}-break-${index}`}>
                                                                        <span>o </span>
                                                                        <span style={{ color: '#f97316' }}>{line.label}</span>
                                                                        <span> : </span>
                                                                        <span>{line.start} </span>
                                                                        <span style={{ color: '#f97316' }}>--&gt;</span>
                                                                        <span> {line.end} </span>
                                                                        <span style={{ color: '#f97316' }}>({line.duration}m)</span>
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ap-break-cell">
                                                    <span>{formatMinutes(record.permissionHours)}</span>
                                                    {getPermissionLines(record).length > 0 && (
                                                        <span className="ap-break-info-icon">
                                                            <Info />
                                                            <span className="ap-break-tooltip">
                                                                {getPermissionLines(record).map((line, index) => (
                                                                    <span className="ap-break-tooltip-line" key={`${record.id ?? record.date}-permission-${index}`}>
                                                                        <span>o Permission : </span>
                                                                        <span>{line.start} </span>
                                                                        <span style={{ color: '#f97316' }}>--&gt;</span>
                                                                        <span> {line.end} </span>
                                                                        <span style={{ color: '#f97316' }}>({line.total ?? 0}m)</span>
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td style={{ color: '#94a3b8' }}>{formatMinutes(record.totalHours)}</td>
                                            <td>
                                                <span className={`ap-status-pill ${statusClass}`}>
                                                    {getLateLabel(record)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {viewMode === 'daily' && filteredRecords.length > 0 && (
                    <div className="ap-pager">
                        <div className="ap-pager-controls">
                            <button type="button" className="ap-pager-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
                            <button type="button" className="ap-pager-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹</button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#94a3b8', fontSize: 10 }}>...</span>}
                                        <button type="button" className={`ap-pager-page ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                                    </React.Fragment>
                                ))}

                            <button type="button" className="ap-pager-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>›</button>
                            <button type="button" className="ap-pager-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ( {Math.min(rowsPerPage, filteredRecords.length - (currentPage - 1) * rowsPerPage)} of {filteredRecords.length} )
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
