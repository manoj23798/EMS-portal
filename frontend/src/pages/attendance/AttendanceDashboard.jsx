import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceAPI } from '../../services/api';
import {
    Clock,
    Coffee,
    LogOut,
    Play,
    Calendar as CalendarIcon,
    Search,
    Filter,
    RotateCcw,
    MapPin,
    Laptop,
    CircleAlert,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Info,
} from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

const SHIFT_START_HOUR = 9;
const SHIFT_START_MINUTE = 0;
const SHIFT_END_HOUR = 18;
const SHIFT_END_MINUTE = 0;
const SHIFT_TOTAL_MINUTES = (SHIFT_END_HOUR * 60 + SHIFT_END_MINUTE) - (SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE);
const MAX_BREAK_MINUTES = 60;
const SHIFT_START_MINUTES = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;

export default function AttendanceDashboard() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;

    const [attendance, setAttendance] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [breakType, setBreakType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, selectedMonth]);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!EMPLOYEE_ID) {
            setLoading(false);
            setRecordsLoading(false);
            return;
        }

        const load = async () => {
            await Promise.all([fetchToday(), fetchHistory()]);
        };

        load();
    }, [EMPLOYEE_ID, selectedMonth]);

    const fetchToday = async () => {
        try {
            setLoading(true);
            const res = await AttendanceAPI.getToday(EMPLOYEE_ID);
            if (res.status === 204) setAttendance(null);
            else setAttendance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setRecordsLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
            const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
            const res = await AttendanceAPI.getHistory(EMPLOYEE_ID, startDate, endDate);
            const apiRows = Array.isArray(res.data) ? res.data : [];

            const coerceStatus = (row) => {
                const raw = String(row?.status || '').trim().toLowerCase();
                if (raw === 'absent' || raw === 'leave' || raw === 'permission') return raw.charAt(0).toUpperCase() + raw.slice(1);
                if (raw === 'lop' || raw === 'leave without pay' || raw.includes('loss of pay') || raw.includes('leave')) {
                    return 'Leave';
                }
                if (raw.includes('permission')) return 'Permission';
                if (row?.inTime) {
                    const [hours, minutes] = String(row.inTime).split(':').map((value) => parseInt(value, 10));
                    const checkInMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
                    return checkInMinutes > SHIFT_START_MINUTES ? 'Late' : 'Present';
                }
                if (raw === 'present' || raw === 'late') {
                    return raw.charAt(0).toUpperCase() + raw.slice(1);
                }
                return 'Absent';
            };

            const byDate = new Map();
            apiRows.forEach((row) => {
                if (!row?.date) return;
                byDate.set(row.date, {
                    ...row,
                    status: coerceStatus(row)
                });
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expanded = [];

            for (let day = 1; day <= lastDay; day += 1) {
                const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, day);
                dateObj.setHours(0, 0, 0, 0);

                // Do not show future dates.
                if (dateObj > today) continue;

                const existing = byDate.get(dateStr);
                if (existing) {
                    expanded.push(existing);
                    continue;
                }

                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                if (isWeekend) continue;

                expanded.push({
                    id: `absent-${dateStr}`,
                    date: dateStr,
                    inTime: null,
                    outTime: null,
                    breakDuration: 0,
                    permissionHours: 0,
                    permissions: [],
                    totalHours: 0,
                    status: 'Absent'
                });
            }

            expanded.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
            setRecords(expanded);
        } catch (err) {
            console.error('Failed to fetch attendance history:', err);
            setRecords([]);
        } finally {
            setRecordsLoading(false);
        }
    };

    const handleAction = async (actionFn, label) => {
        if (label === 'Break' && !breakType) {
            setError('Please select break type (Lunch Break or Tea Break) before taking break.');
            return;
        }

        try {
            setActionLoading(true);
            setError('');

            // Guard against stale UI state: check server before timer-in.
            if (label === 'In') {
                try {
                    const todayRes = await AttendanceAPI.getToday(EMPLOYEE_ID);
                    if (todayRes?.status === 200 && todayRes?.data?.inTime) {
                        setAttendance(todayRes.data);
                        setError('Already Timed In for today.');
                        return;
                    }
                } catch (todayErr) {
                    // 204 means no attendance for today yet; continue timer-in.
                    if (todayErr?.response?.status !== 204) {
                        console.warn('Could not pre-check today attendance:', todayErr);
                    }
                }
            }

            let res;
            if (label === 'Break') {
                res = await actionFn(EMPLOYEE_ID, breakType);
            } else {
                res = await actionFn(EMPLOYEE_ID);
            }
            setAttendance(res.data);
            if (label === 'Break') setBreakType('');
            await fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || err.message || `${label} failed.`);

            // If backend rejects timer-in, refresh current attendance to keep button states correct.
            if (label === 'In' && err?.response?.status === 400) {
                await fetchToday();
                await fetchHistory();
            }
        } finally {
            setActionLoading(false);
        }
    };

    const timedIn = attendance?.inTime != null;
    const timedOut = attendance?.outTime != null;
    const isOnBreak = attendance?.onBreak === true;

    const toTodayDateFromTime = (timeValue) => {
        if (!timeValue) return null;
        const [h, m, s] = String(timeValue).split(':').map((v) => parseInt(v, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        const d = new Date(currentTime);
        d.setHours(h, m, Number.isNaN(s) ? 0 : s, 0);
        return d;
    };

    const inAt = toTodayDateFromTime(attendance?.inTime);
    const outAt = toTodayDateFromTime(attendance?.outTime);
    const sessionEnd = outAt || currentTime;
    const sessionSeconds = inAt ? Math.max(0, Math.floor((sessionEnd - inAt) / 1000)) : null;

    const storedBreakMinutes = attendance?.breakDuration != null ? Number(attendance.breakDuration) || 0 : 0;
    const activeBreak = attendance?.breaks?.find((b) => !b?.breakEnd && b?.breakStart);
    const activeBreakStart = toTodayDateFromTime(activeBreak?.breakStart);
    const activeBreakSeconds = activeBreakStart ? Math.max(0, Math.floor((currentTime - activeBreakStart) / 1000)) : 0;

    const storedBreakSeconds = Math.max(0, storedBreakMinutes * 60);
    const breakSeconds = Math.min(MAX_BREAK_MINUTES * 60, storedBreakSeconds + activeBreakSeconds);
    const breakMinutes = Math.floor(breakSeconds / 60);
    const breakRemainingSeconds = inAt ? Math.max(0, MAX_BREAK_MINUTES * 60 - breakSeconds) : null;
    const breakRemainingMinutes = breakRemainingSeconds == null ? null : Math.floor(breakRemainingSeconds / 60);

    const breakTypeMinutes = useMemo(() => {
        const totals = { lunch: 0, tea: 0 };
        if (!attendance?.breaks || !Array.isArray(attendance.breaks)) return totals;

        attendance.breaks.forEach((b) => {
            const isLunch = String(b?.breakType || '').toUpperCase() === 'LUNCH';
            const key = isLunch ? 'lunch' : 'tea';

            if (b?.breakEnd && b?.duration != null) {
                totals[key] += Math.max(0, Number(b.duration) || 0);
                return;
            }

            if (!b?.breakEnd && b?.breakStart) {
                const start = toTodayDateFromTime(b.breakStart);
                if (start) {
                    const activeMinutes = Math.floor(Math.max(0, (currentTime - start) / 60000));
                    totals[key] += activeMinutes;
                }
            }
        });

        return totals;
    }, [attendance?.breaks, currentTime]);

    // Keep work time running after timer-in (including break period), as requested.
    const workSeconds = sessionSeconds;
    const workMinutes = workSeconds == null ? null : Math.floor(workSeconds / 60);
    const remainingWorkSeconds = sessionSeconds != null ? Math.max(0, SHIFT_TOTAL_MINUTES * 60 - sessionSeconds) : null;
    const remainingMinutes = remainingWorkSeconds == null ? null : Math.floor(remainingWorkSeconds / 60);

    const timerInDisabled = actionLoading || timedIn;
    const timerOutDisabled = actionLoading || !timedIn || timedOut;
    const startBreakDisabled = actionLoading || !timedIn || timedOut || isOnBreak || (breakRemainingMinutes != null && breakRemainingMinutes <= 0);
    const endBreakDisabled = actionLoading || !isOnBreak;

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
        if (totalMins == null || totalMins === '') return '---';
        const value = Math.max(0, Number(totalMins) || 0);
        const hrs = Math.floor(value / 60);
        const mins = value % 60;
        if (hrs === 0) return `${mins} M`;
        if (mins === 0) return `${hrs}h`;
        return `${hrs}h ${String(mins).padStart(2, '0')}m`;
    };

    const formatMinutesOnly = (totalMins) => {
        if (totalMins == null || totalMins === '') return '---';
        const value = Math.max(0, Number(totalMins) || 0);
        return `${value} M`;
    };

    const formatLiveDuration = (totalSeconds) => {
        if (totalSeconds == null) return '---';
        const value = Math.max(0, Number(totalSeconds) || 0);
        const hrs = Math.floor(value / 3600);
        const mins = Math.floor((value % 3600) / 60);
        const secs = value % 60;

        if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
        if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`;
        return `${secs}s`;
    };

    const normalizeStatus = (status, inTime) => {
        const value = String(status || '').trim().toLowerCase();
        if (!value) return '---';
        if (value === 'lop' || value === 'leave without pay' || value.includes('loss of pay')) return 'Leave';
        if (value.includes('permission')) return 'Permission';
        if (value.includes('leave')) return 'Leave';
        if (value === 'absent') return 'Absent';
        if (inTime) {
            const [hours, minutes] = String(inTime).split(':').map((part) => parseInt(part, 10));
            const checkInMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
            return checkInMinutes > SHIFT_START_MINUTES ? 'Late' : 'Present';
        }
        if (value === 'present') return 'Present';
        if (value === 'late') return 'Late';
        return String(status);
    };

    const filteredRecords = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return records.filter((r) => {
            const recordDate = r.date ? new Date(r.date) : null;
            if (recordDate) {
                recordDate.setHours(0, 0, 0, 0);
                if (recordDate > today) return false;
            }

            const normalized = normalizeStatus(r.status, r.inTime);
            const statusMatch = statusFilter === 'ALL' || normalized === statusFilter;
            if (!statusMatch) return false;

            const term = searchTerm.toLowerCase();
            if (!term) return true;

            return (
                String(r.date || '').toLowerCase().includes(term) ||
                normalized.toLowerCase().includes(term) ||
                String(r.employeeName || '').toLowerCase().includes(term)
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

    const lateMinutes = useMemo(() => {
        if (!attendance?.inTime) return null;
        const [h, m] = String(attendance.inTime).split(':').map((value) => parseInt(value, 10));
        const inMinutes = (h || 0) * 60 + (m || 0);
        const shiftStartMinutes = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;
        return Math.max(0, inMinutes - shiftStartMinutes);
    }, [attendance?.inTime]);

    const overTimeMinutes = useMemo(() => {
        if (!attendance?.outTime) return null;
        const [h, m] = String(attendance.outTime).split(':').map((value) => parseInt(value, 10));
        const outMinutes = (h || 0) * 60 + (m || 0);
        const shiftEndMinutes = SHIFT_END_HOUR * 60 + SHIFT_END_MINUTE;
        return Math.max(0, outMinutes - shiftEndMinutes);
    }, [attendance?.outTime]);

    const getBreakBreakdownLines = (record) => {
        if (!record?.breaks || !Array.isArray(record.breaks)) return [];

        const toHHMM = (timeValue) => String(timeValue || '').substring(0, 5);
        const labelForType = (type) => (String(type || '').toUpperCase() === 'LUNCH' ? 'Lunch break' : 'Tea break');

        const lines = record.breaks
            .filter((b) => b?.breakStart && b?.breakEnd && b?.duration != null)
            .map((b) => ({
                label: labelForType(b.breakType),
                start: toHHMM(b.breakStart),
                end: toHHMM(b.breakEnd),
                duration: b.duration
            }));

        return lines;
    };

    const getPermissionLines = (record) => {
        if (!record?.permissions || !Array.isArray(record.permissions)) return [];

        const toHHMM = (timeValue) => String(timeValue || '').substring(0, 5);

        return record.permissions
            .filter((p) => p?.startTime && p?.endTime)
            .map((p) => ({
                start: toHHMM(p.startTime),
                end: toHHMM(p.endTime),
                total: p.totalHours
            }));
    };

    if (loading) {
        return (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
                <div style={{ fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Loading attendance...</div>
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
                    padding: 0 24px 24px 24px;
                    background: #ffffff;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: var(--ap-ink-900);
                    box-sizing: border-box;
                }

                .attendance-portal-page > * {
                    max-width: 100%;
                    margin-left: auto;
                    margin-right: auto;
                }

                .ap-top-grid {
                    display: grid;
                    grid-template-columns: minmax(340px, 520px) minmax(520px, 1fr);
                    gap: 14px;
                    margin-bottom: 16px;
                    align-items: stretch;
                }

                .ap-punch-card,
                .ap-summary-card,
                .ap-table-shell {
                    background: var(--ap-surface);
                    border-radius: 20px;
                    border: 1.5px solid #cbd5e1;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
                }

                .ap-punch-card {
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .ap-mini-title {
                    display: none;
                }

                .ap-clock-box {
                    position: relative;
                    border-radius: 16px;
                    border: 1.5px solid #dbe4ef;
                    background: linear-gradient(180deg, #fafcff 0%, #f4f7fb 100%);
                    padding: 0;
                    display: grid;
                    grid-template-columns: 108px minmax(0, 1fr);
                    align-items: center;
                    gap: 0;
                    overflow: hidden;
                    min-height: 96px;
                }

                .ap-clock-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    text-align: left;
                    padding: 8px 12px 8px 8px;
                    z-index: 1;
                }

                .ap-clock-row {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 8px;
                }

                .ap-clock-row svg {
                    color: #f97316;
                    flex: 0 0 auto;
                }

                .ap-clock-time {
                    font-family: 'Outfit', sans-serif;
                    font-size: clamp(24px, 1.9vw, 32px);
                    line-height: 1;
                    font-weight: 950;
                    letter-spacing: 1px;
                    color: var(--ap-orange);
                }

                .ap-clock-date {
                    margin-top: 4px;
                    font-size: clamp(10px, 0.8vw, 12px);
                    font-weight: 800;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .ap-analog-shell {
                    width: 96px;
                    height: 96px;
                    margin: 0 auto;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    box-shadow: none;
                    display: grid;
                    place-items: center;
                }

                .ap-break-type {
                    height: 34px;
                    border-radius: 10px;
                    border: 1.5px solid #fdba74;
                    background: #fff;
                    color: #1e293b;
                    font-size: 12px;
                    font-weight: 900;
                    padding: 0 10px;
                    outline: none;
                }

                .ap-action-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .ap-btn {
                    height: 42px;
                    border-radius: 12px;
                    border: 1.5px solid var(--ap-line);
                    font-size: 13px;
                    font-weight: 900;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.18s ease, box-shadow 0.2s ease, background 0.2s ease;
                }

                .ap-btn svg { width: 16px; height: 16px; }
                .ap-btn-in {
                    background: #ffffff;
                    color: #64748b;
                    border-color: #cbd5e1;
                }
                .ap-btn-out {
                    background: #f97316;
                    color: #fff;
                    border-color: #f97316;
                }
                .ap-btn-break {
                    background: #ffffff;
                    color: #f97316;
                    border-color: #fdba74;
                    padding: 0 14px;
                    height: 34px;
                    border-radius: 10px;
                    font-size: 12px;
                }
                .ap-btn-in:not(:disabled):hover,
                .ap-btn-break:not(:disabled):hover {
                    background: var(--ap-orange-soft);
                    border-color: #f97316;
                    color: #f97316;
                }
                .ap-btn-out:not(:disabled):hover {
                    background: #ea580c;
                    border-color: #ea580c;
                }
                .ap-btn:not(:disabled):hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
                }
                .ap-btn:disabled { opacity: 0.56; cursor: not-allowed; }

                .ap-break-strip {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    border: 1.5px dashed #cbd5e1;
                    border-radius: 12px;
                    padding: 8px 10px;
                    background: #f8fafc;
                }

                .ap-break-title { font-size: 14px; font-weight: 900; color: #1e293b; }
                .ap-break-sub { font-size: 12px; font-weight: 800; color: #64748b; line-height: 1.2; }

                .ap-summary-card {
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                }

                .ap-summary-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                .ap-shift-chip {
                    background: var(--ap-orange-soft);
                    border: 1.5px solid #fdba74;
                    color: #f97316;
                    padding: 5px 12px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 900;
                }

                .ap-summary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                    flex: 1 1 auto;
                    min-height: 0;
                }

                .ap-summary-box {
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 11px 13px;
                    min-height: 0;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 38px 1fr auto;
                    gap: 10px;
                    align-items: center;
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
                }

                .ap-feature-box {
                    grid-template-columns: 56px minmax(0, 1fr) auto;
                }

                .ap-feature-box-nochip {
                    grid-template-columns: 56px minmax(0, 1fr);
                }

                .ap-punch-wrap {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }

                .ap-punch-wrap .ap-summary-value {
                    white-space: nowrap;
                }

                .ap-punch-arrow {
                    color: #f97316;
                    font-size: 26px;
                    font-weight: 900;
                    line-height: 1;
                }

                .ap-break-lines {
                    margin-top: 0;
                    display: grid;
                    gap: 4px;
                    font-size: 9px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .ap-break-line-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .ap-break-box {
                    grid-template-columns: 56px minmax(0, 1fr) 1px minmax(0, 1fr);
                    gap: 14px;
                }

                .ap-break-main {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 6px;
                    min-width: 0;
                }

                .ap-break-divider {
                    width: 1px;
                    height: 100%;
                    background: #94a3b8;
                    border-radius: 999px;
                    opacity: 0.9;
                }

                .ap-break-right {
                    display: grid;
                    align-content: center;
                    min-width: 0;
                }

                .ap-summary-icon {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: #f1f5f9;
                    display: grid;
                    place-items: center;
                    color: #475569;
                }
                .ap-summary-icon svg { width: 16px; height: 16px; }

                .ap-summary-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
                .ap-summary-value { font-size: clamp(14px, 1.15vw, 20px); font-weight: 900; color: #0f172a; line-height: 1.05; }
                .ap-summary-side-chip {
                    border-radius: 999px;
                    border: 1.5px solid #e2e8f0;
                    background: #f8fafc;
                    color: #64748b;
                    padding: 4px 9px;
                    font-size: 10px;
                    font-weight: 900;
                    white-space: nowrap;
                }

                .ap-box-green { border-color: #e2e8f0; }
                .ap-box-orange { border-color: #e2e8f0; }
                .ap-box-blue { border-color: #e2e8f0; }

                .ap-split-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: clamp(18px, 1.3vw, 22px);
                    font-weight: 950;
                    line-height: 1;
                }

                .ap-meta-col { display: flex; flex-direction: column; gap: 6px; }
                .ap-meta-label {
                    font-size: 9px;
                    font-weight: 900;
                    border: 1px solid;
                    border-radius: 4px;
                    padding: 2px 6px;
                    text-transform: uppercase;
                    width: fit-content;
                }

                .ap-meta-label-late { color: #dc2626; border-color: #ef4444; }
                .ap-meta-label-over { color: #15803d; border-color: #22c55e; }
                .ap-divider { width: 1px; height: 40px; background: #cbd5e1; }

                .ap-table-shell {
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

                .ap-header-metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .ap-header-metric-item {
                    display: flex;
                    flex-direction: column;
                    min-width: 76px;
                    padding: 5px 10px;
                    border: 1px solid #dbe4ef;
                    border-radius: 10px;
                    background: #f1f5f9;
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

                .ap-filters-panel {
                    padding: 10px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
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
                .ap-table { width: 100%; border-collapse: collapse; }
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
                }
                .ap-table td {
                    padding: 14px;
                    border-bottom: 1px solid #eaf0f6;
                    font-size: 13px;
                    font-weight: 900;
                    color: #1e293b;
                }

                .ap-table tbody tr {
                    transition: background 0.16s ease;
                }

                .ap-table tbody tr:hover {
                    background: #f9fbfd;
                }

                .ap-status-pill {
                    padding: 6px 10px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                }

                .ap-status-present { background: #ecfdf5; color: #059669; }
                .ap-status-late { background: #fff7ed; color: #ea580c; }
                .ap-status-absent { background: #fef2f2; color: #dc2626; }
                .ap-status-leave { background: #f1f5f9; color: #64748b; }
                .ap-status-other { background: #e2e8f0; color: #334155; }

                .ap-break-info-icon {
                    position: relative;
                    cursor: help;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #dbeafe;
                    color: #0369a1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-left: 4px;
                }

                .ap-break-info-icon svg { width: 12px; height: 12px; }

                .ap-break-cell {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    position: relative;
                }

                .ap-break-cell .ap-break-tooltip {
                    display: none;
                    left: 0;
                    transform: none;
                    min-width: 260px;
                    white-space: normal;
                    text-transform: none;
                    font-weight: 700;
                }

                .ap-break-cell:hover .ap-break-tooltip {
                    display: block;
                }

                .ap-break-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    color: #ffffff;
                    padding: 10px 12px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    margin-bottom: 8px;
                    z-index: 1000;
                    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
                    line-height: 1.4;
                    pointer-events: none;
                }

                .ap-break-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 4px solid #1e293b;
                }

                @media (max-width: 1100px) {
                    .ap-top-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 860px) {
                    .ap-clock-box {
                        grid-template-columns: 1fr;
                    }

                    .ap-analog-shell {
                        margin: 8px auto 0 auto;
                    }

                    .ap-clock-meta {
                        text-align: center;
                        padding-left: 0;
                    }

                    .ap-clock-row {
                        justify-content: center;
                    }

                    .ap-mini-title {
                        font-size: 16px;
                    }

                    .ap-clock-date {
                        font-size: 11px;
                    }

                    .ap-btn {
                        font-size: 12px;
                    }

                    .ap-break-title {
                        font-size: 13px;
                    }

                    .ap-break-sub {
                        font-size: 11px;
                    }

                    .ap-summary-label {
                        font-size: 9px;
                    }

                    .ap-summary-side-chip,
                    .ap-meta-label {
                        font-size: 9px;
                    }

                    .ap-summary-value {
                        font-size: 24px;
                    }

                    .ap-split-meta {
                        font-size: 20px;
                    }

                    .ap-summary-grid {
                        grid-template-columns: 1fr;
                    }
                    .ap-action-row {
                        grid-template-columns: 1fr;
                    }
                    .ap-filter-actions {
                        width: 100%;
                        justify-content: stretch;
                    }
                    .ap-search-chip {
                        flex: 1 1 auto;
                    }

                    .ap-header-metrics {
                        width: 100%;
                    }

                    .ap-shift-chip {
                        font-size: 9px;
                    }
                }
            `}</style>

            {error && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', fontSize: '12px', fontWeight: 800, marginBottom: 12 }}>
                    {error}
                </div>
            )}

            <div className="ap-top-grid">
                <section className="ap-punch-card">
                    <div className="ap-clock-box">
                        <div className="ap-analog-shell">
                            <svg width="78" height="78" viewBox="0 0 200 200" role="img" aria-label="Attendance analog clock">
                                <circle cx="100" cy="100" r="88" fill="white" stroke="#3f4349" strokeWidth="8" />

                                {[1, 2, 4, 5, 7, 8, 10, 11].map((hour) => {
                                    const angle = (hour * 30 - 90) * (Math.PI / 180);
                                    const x1 = 100 + 70 * Math.cos(angle);
                                    const y1 = 100 + 70 * Math.sin(angle);
                                    const x2 = 100 + 80 * Math.cos(angle);
                                    const y2 = 100 + 80 * Math.sin(angle);
                                    return <line key={hour} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f4349" strokeWidth="6" strokeLinecap="square" />;
                                })}

                                <text x="100" y="38" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3f4349">12</text>
                                <text x="170" y="108" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3f4349">3</text>
                                <text x="100" y="178" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3f4349">6</text>
                                <text x="30" y="108" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3f4349">9</text>

                                <line
                                    x1="100"
                                    y1="100"
                                    x2={100 + 28 * Math.cos(((currentTime.getHours() % 12 + currentTime.getMinutes() / 60) / 12 * 360 - 90) * Math.PI / 180)}
                                    y2={100 + 28 * Math.sin(((currentTime.getHours() % 12 + currentTime.getMinutes() / 60) / 12 * 360 - 90) * Math.PI / 180)}
                                    stroke="#3f4349"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                />

                                <line
                                    x1="100"
                                    y1="100"
                                    x2={100 + 44 * Math.cos((currentTime.getMinutes() / 60 * 360 - 90) * Math.PI / 180)}
                                    y2={100 + 44 * Math.sin((currentTime.getMinutes() / 60 * 360 - 90) * Math.PI / 180)}
                                    stroke="#3f4349"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                />

                                <circle cx="100" cy="100" r="5" fill="#3f4349" />
                            </svg>
                        </div>
                        <div className="ap-clock-meta">
                            <div className="ap-clock-row">
                                <Clock size={16} />
                                <div className="ap-clock-time">{currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                            </div>
                            <div className="ap-clock-date">
                                <CalendarIcon size={12} />
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    <div className="ap-action-row">
                        <button
                            type="button"
                            className="ap-btn ap-btn-in"
                            disabled={timerInDisabled}
                            onClick={() => handleAction(AttendanceAPI.timerIn, 'In')}
                        >
                            <Play size={18} />
                            Timer In
                        </button>
                        <button
                            type="button"
                            className="ap-btn ap-btn-out"
                            disabled={timerOutDisabled}
                            onClick={() => handleAction(AttendanceAPI.timerOut, 'Out')}
                        >
                            <LogOut size={18} />
                            Timer Out
                        </button>
                    </div>

                    <div className="ap-break-strip">
                        <div className="ap-break-title">
                            <Coffee size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            {breakType ? (breakType === 'LUNCH' ? 'Lunch Break' : 'Tea Break') : 'Break'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <select
                                className="ap-break-type"
                                value={breakType}
                                onChange={(e) => setBreakType(e.target.value)}
                                disabled={isOnBreak || actionLoading || timedOut}
                            >
                                <option value="">type</option>
                                <option value="LUNCH">Lunch Break</option>
                                <option value="TEA">Tea Break</option>
                            </select>
                            <button
                                type="button"
                                className="ap-btn ap-btn-break"
                                disabled={startBreakDisabled}
                                onClick={() => handleAction(AttendanceAPI.startBreak, 'Break')}
                            >
                                Take Break
                            </button>
                            <button
                                type="button"
                                className="ap-btn ap-btn-break"
                                disabled={endBreakDisabled}
                                onClick={() => handleAction(AttendanceAPI.endBreak, 'End break')}
                            >
                                End Break
                            </button>
                        </div>
                    </div>
                </section>

                <section className="ap-summary-card">
                    <div className="ap-summary-head">
                        <div className="ap-mini-title" style={{ gap: 0 }}>Today's Summary</div>
                        <div className="ap-shift-chip">Status: {attendance?.status || '---'}</div>
                    </div>

                    <div className="ap-summary-grid">
                        <article className="ap-summary-box ap-feature-box ap-feature-box-nochip ap-box-green">
                            <div className="ap-summary-icon"><MapPin size={16} /></div>
                            <div className="ap-punch-wrap">
                                <div>
                                    <div className="ap-summary-label">Punch In</div>
                                    <div className="ap-summary-value">{formatTime(attendance?.inTime)}</div>
                                </div>
                                <div className="ap-punch-arrow">{'->'}</div>
                                <div>
                                    <div className="ap-summary-label">Punch Out</div>
                                    <div className="ap-summary-value">{formatTime(attendance?.outTime)}</div>
                                </div>
                            </div>
                        </article>

                        <article className="ap-summary-box ap-box-blue ap-break-box">
                            <div className="ap-summary-icon"><Coffee size={16} /></div>
                            <div className="ap-break-main">
                                <div className="ap-summary-label">Break Time</div>
                                <div className="ap-summary-value">{formatLiveDuration(breakSeconds)}</div>
                                <div className="ap-summary-side-chip">Remaining: {formatLiveDuration(breakRemainingSeconds)}</div>
                            </div>
                            <div className="ap-break-divider" />
                            <div className="ap-break-right">
                                <div className="ap-break-lines">
                                    <div className="ap-break-line-item">
                                        <span>Lunch break</span>
                                        <span>{formatMinutesOnly(breakTypeMinutes.lunch)}</span>
                                    </div>
                                    <div className="ap-break-line-item">
                                        <span>Tea break</span>
                                        <span>{formatMinutesOnly(breakTypeMinutes.tea)}</span>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article className="ap-summary-box ap-box-orange">
                            <div className="ap-summary-icon"><Laptop size={16} /></div>
                            <div>
                                <div className="ap-summary-label">Work Hours</div>
                                <div className="ap-summary-value">{formatLiveDuration(workSeconds)}</div>
                            </div>
                            <div className="ap-summary-side-chip">Remaining: {formatLiveDuration(remainingWorkSeconds)}</div>
                        </article>

                        <article className="ap-summary-box ap-box-orange" style={{ gridTemplateColumns: '34px 1fr' }}>
                            <div className="ap-summary-icon"><CircleAlert size={16} /></div>
                            <div className="ap-split-meta">
                                <div className="ap-meta-col">
                                    <span className="ap-meta-label ap-meta-label-late">Late</span>
                                    <span>{formatMinutes(lateMinutes)}</span>
                                </div>
                                <div className="ap-divider" />
                                <div className="ap-meta-col">
                                    <span className="ap-meta-label ap-meta-label-over">Over Time</span>
                                    <span>{formatMinutes(overTimeMinutes)}</span>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>
            </div>

            <section className="ap-table-shell">
                <div className="ap-filter-topbar">
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

                    <div className="ap-filter-actions">
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

                {showFilters && (
                    <div className="ap-filters-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="ALL">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                                <option value="Leave">Leave</option>
                                <option value="Permission">Permission</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="ap-table-wrap">
                    <table className="ap-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Break</th>
                                <th>Permission</th>
                                <th>Total Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recordsLoading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        Fetching logs...
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        No records found for the selected period.
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

                                    const lateDurationText = (() => {
                                        if (normalized !== 'Late' || !record?.inTime) return null;

                                        const [h, m] = String(record.inTime).split(':').map((value) => parseInt(value, 10));
                                        const inMinutes = (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
                                        const shiftStartMinutes = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;
                                        const diffMinutes = Math.max(0, inMinutes - shiftStartMinutes);

                                        return diffMinutes > 0 ? formatMinutes(diffMinutes) : null;
                                    })();

                                    return (
                                        <tr key={record.id ?? record.date}>
                                            <td style={{ color: '#64748b', fontSize: '13px', fontWeight: 900 }}>{record.date || '---'}</td>
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
                                                                    <div key={`${record.id ?? record.date}-break-${index}`}>
                                                                        <span>o </span>
                                                                        <span style={{ color: '#f97316' }}>{line.label}</span>
                                                                        <span> : </span>
                                                                        <span>{line.start} </span>
                                                                        <span style={{ color: '#f97316' }}>--&gt;</span>
                                                                        <span> {line.end} </span>
                                                                        <span style={{ color: '#f97316' }}>({line.duration}m)</span>
                                                                    </div>
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
                                                                    <div key={`${record.id ?? record.date}-permission-${index}`}>
                                                                        <span>o Permission : </span>
                                                                        <span>{line.start} </span>
                                                                        <span style={{ color: '#f97316' }}>--&gt;</span>
                                                                        <span> {line.end} </span>
                                                                        <span style={{ color: '#f97316' }}>({line.total ?? 0}m)</span>
                                                                    </div>
                                                                ))}
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td style={{ color: '#0ea5e9' }}>{formatMinutes(record.totalHours)}</td>
                                            <td>
                                                <span className={`ap-status-pill ${statusClass}`}>
                                                    {normalized === 'Late' && lateDurationText ? (
                                                        <>
                                                            <span>Late - </span>
                                                            <span style={{ color: '#0f172a' }}>{lateDurationText}</span>
                                                        </>
                                                    ) : (
                                                        normalized
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredRecords.length > 0 && (
                    <div style={{ padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #e2e8f0', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #dbe4ef', background: 'white', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronsLeft size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #dbe4ef', background: 'white', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: '#94a3b8', fontSize: '10px' }}>...</span>}
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPage(p)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                border: '1.5px solid',
                                                borderColor: currentPage === p ? '#f97316' : '#dbe4ef',
                                                background: currentPage === p ? '#f97316' : 'white',
                                                color: currentPage === p ? 'white' : '#334155',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: currentPage === p ? '0 4px 10px rgba(249,115,22,0.2)' : 'none'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}

                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #dbe4ef', background: 'white', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}
                            >
                                <ChevronRight size={14} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #dbe4ef', background: 'white', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}
                            >
                                <ChevronsRight size={14} />
                            </button>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ( {Math.min(rowsPerPage, filteredRecords.length - (currentPage - 1) * rowsPerPage)} of {filteredRecords.length} )
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
