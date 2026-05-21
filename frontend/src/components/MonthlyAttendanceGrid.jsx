import React, { useState, useEffect } from 'react';
import { AdminAttendanceAPI, EmployeeAPI } from '../services/api';
import { Download, CalendarDays } from 'lucide-react';

const SHIFT_START_HOUR = 9;
const SHIFT_START_MINUTE = 0;
const SHIFT_START_MINUTES = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;

// Custom Tooltip Component
function Tooltip({ text, children, position = 'top' }) {
    const [visible, setVisible] = useState(false);

    return (
        <div
            style={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && text && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: position === 'top' ? '100%' : 'auto',
                        top: position === 'bottom' ? '100%' : 'auto',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        color: 'black',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #ddd',
                        marginBottom: position === 'top' ? '4px' : '-4px',
                        marginTop: position === 'bottom' ? '4px' : '-4px',
                        pointerEvents: 'none'
                    }}
                >
                    {text}
                </div>
            )}
        </div>
    );
}

export default function MonthlyAttendanceGrid() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [employees, setEmployees] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = formatLocalDate(new Date(Number(year), Number(month), 0));

            const [empRes, attRes] = await Promise.all([
                EmployeeAPI.getAll(),
                AdminAttendanceAPI.getHistory(startDate, endDate)
            ]);

            setEmployees(empRes.data || []);
            setAttendanceRecords(attRes.data || []);
        } catch (err) {
            console.error('Failed to fetch monthly data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = formatLocalDate(new Date(Number(year), Number(month), 0));

            const res = await AdminAttendanceAPI.exportExcel(startDate, endDate);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `monthly_attendance_${selectedMonth}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export report.');
        }
    };

    const getDaysArray = () => {
        if (!selectedMonth) return [];
        const [year, month] = selectedMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();

        const days = [];
        for (let i = 1; i <= daysInMonth; i += 1) {
            const d = new Date(year, month - 1, i);
            days.push({
                date: i,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                fullDate: `${year}-${month}-${String(i).padStart(2, '0')}`
            });
        }
        return days;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}.${m} ${ampm}`;
    };

    const normalizeStatus = (status, inTime) => {
        const value = String(status || '').trim().toLowerCase();
        if (!value) return '';
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

    const days = getDaysArray();

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
        const employeeKey = record?.employeeId ?? record?.employee?.id ?? record?.employee?.employeeId;
        const dateKey = record?.date ? String(record.date).substring(0, 10) : '';
        if (!employeeKey || !dateKey) return;

        const normalizedEmployeeKey = String(employeeKey);
        if (!attendanceMap[normalizedEmployeeKey]) {
            attendanceMap[normalizedEmployeeKey] = {};
        }
        attendanceMap[normalizedEmployeeKey][dateKey] = record;
    });

    const employeeRows = (() => {
        const map = new Map();

        employees.forEach((emp) => {
            const key = emp?.id ?? emp?.employeeId;
            if (key == null) return;
            map.set(String(key), { ...emp });
        });

        attendanceRecords.forEach((record) => {
            const key = record?.employeeId ?? record?.employee?.id ?? record?.employee?.employeeId;
            if (key == null) return;
            const normalizedKey = String(key);
            const existing = map.get(normalizedKey);

            if (existing) {
                if (!existing.firstName && !existing.lastName && record?.employeeName) {
                    map.set(normalizedKey, { ...existing, employeeName: record.employeeName });
                }
                return;
            }

            map.set(normalizedKey, {
                id: key,
                employeeId: record?.employeeCode ?? null,
                firstName: '',
                lastName: '',
                employeeName: record?.employeeName || ''
            });
        });

        return Array.from(map.values());
    })();

    const statusTotals = attendanceRecords.reduce(
        (acc, record) => {
            const normalized = normalizeStatus(record.status, record.inTime);
            if (normalized === 'Present') acc.present += 1;
            if (normalized === 'Late') {
                acc.present += 1;
                acc.late += 1;
            }
            if (normalized === 'Absent') acc.absent += 1;
            if (normalized === 'Leave') acc.leave += 1;
            return acc;
        },
        { present: 0, late: 0, absent: 0, leave: 0 }
    );

    return (
        <div className="card" style={{ marginTop: 0 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="card-title" style={{ fontSize: '1rem' }}>Monthly View</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarDays size={15} color="var(--text-muted)" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="form-input"
                            style={{ width: 170, padding: '8px 10px', fontSize: '0.9rem' }}
                        />
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '8px 14px', fontSize: '0.88rem' }}>
                    <Download size={15} /> Download
                </button>
            </div>

            <div className="card-body" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Present</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>{statusTotals.present}</p>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Late</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>{statusTotals.late}</p>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Absent</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>{statusTotals.absent}</p>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Leave</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>{statusTotals.leave}</p>
                </div>
            </div>

            <div className="card-body" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Loading month data...</div>
                ) : (
                    <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%' }}>
                        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', tableLayout: 'fixed', fontSize: '0.72rem' }}>
                            <colgroup>
                                <col style={{ width: '240px' }} />
                                {days.map((d) => (
                                    <col key={`col-${d.date}`} style={{ width: '44px' }} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', left: 0, background: '#1f2937', color: 'white', padding: '8px 10px', zIndex: 2, borderRight: '1px solid #334155' }}>Day</th>
                                    {days.map((d) => (
                                        <th
                                            key={`day-${d.date}`}
                                            style={{
                                                background: '#1f2937',
                                                color: 'white',
                                                fontWeight: 500,
                                                textAlign: 'center',
                                                borderRight: '1px solid #334155',
                                                padding: '8px 4px',
                                                fontSize: '0.68rem',
                                                whiteSpace: 'nowrap',
                                                minWidth: '44px'
                                            }}
                                        >
                                            {d.dayName}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th style={{ position: 'sticky', left: 0, background: 'var(--primary)', color: 'white', padding: '8px 10px', zIndex: 2, borderRight: '1px solid #ea580c' }}>Employee</th>
                                    {days.map((d) => (
                                        <th
                                            key={`date-${d.date}`}
                                            style={{
                                                background: 'var(--primary)',
                                                color: 'white',
                                                textAlign: 'center',
                                                borderRight: '1px solid #ea580c',
                                                padding: '8px 4px',
                                                fontSize: '0.68rem',
                                                minWidth: '44px'
                                            }}
                                        >
                                            {d.date}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employeeRows.map((emp) => {
                                    const employeeKey = String(emp?.id ?? emp?.employeeId ?? 'unknown');
                                    const employeeLabel = [emp?.firstName, emp?.lastName]
                                        .filter((v) => Boolean(v && String(v).trim()))
                                        .join(' ')
                                        .trim() || emp?.employeeName || emp?.employeeId || `Employee ${employeeKey}`;

                                    return (
                                    <tr key={employeeKey}>
                                        <td
                                            style={{
                                                position: 'sticky',
                                                left: 0,
                                                background: 'var(--surface)',
                                                fontWeight: 600,
                                                color: '#0f172a',
                                                padding: '8px 12px',
                                                width: '240px',
                                                minWidth: '240px',
                                                borderRight: '1px solid var(--border)',
                                                zIndex: 1,
                                                boxShadow: '2px 0 4px rgba(0,0,0,0.04)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            title={employeeLabel}
                                        >
                                            {employeeLabel}
                                        </td>
                                        {days.map((d) => {
                                            const record = attendanceMap[employeeKey]?.[d.fullDate];
                                            const status = normalizeStatus(record?.status, record?.inTime);
                                            let content = null;
                                            let bgStyle = {};
                                            let tooltip = '';
                                            let indicatorSize = 36; // Square size

                                            if (record) {
                                                if (status === 'Leave') {
                                                    bgStyle = { background: '#f3e8ff', color: '#6b21a8' };
                                                    content = <div style={{ fontWeight: 700, fontSize: '1rem' }}>L</div>;
                                                    tooltip = record.leaveType ? `Leave: ${record.leaveType}` : 'Leave';
                                                } else if (status === 'Holiday') {
                                                    bgStyle = { background: '#ffd7a8', color: '#92400e' };
                                                    content = <div style={{ fontWeight: 700, fontSize: '1rem' }}>H</div>;
                                                    tooltip = record.holidayName ? `Holiday: ${record.holidayName}` : 'Holiday';
                                                } else if (status === 'Absent') {
                                                    bgStyle = { background: '#fecaca', color: '#7f1d1d' };
                                                    content = <div style={{ fontWeight: 700, fontSize: '1rem' }}>A</div>;
                                                    tooltip = 'Absent';
                                                } else if (status === 'Late') {
                                                    bgStyle = { background: '#2b9053', color: '#ffffff' };
                                                    content = <div style={{ fontWeight: 700, fontSize: '1rem' }}>L</div>;
                                                    tooltip = `Late - In: ${formatTime(record.inTime)} Out: ${formatTime(record.outTime)}`;
                                                } else if (status === 'Present') {
                                                    bgStyle = { background: '#bbf7d0', color: '#15803d' };
                                                    content = <div style={{ fontWeight: 700, fontSize: '1rem' }}>P</div>;
                                                    tooltip = `In: ${formatTime(record.inTime)} Out: ${formatTime(record.outTime)}`;
                                                }
                                            } else if (d.isWeekend) {
                                                bgStyle = { background: '#e2e8f0', color: '#334155' };
                                                content = <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>WO</div>;
                                                tooltip = 'Sunday/Saturday - Week Off';
                                            } else {
                                                bgStyle = { background: '#f8fafc' };
                                            }

                                            return (
                                                <td
                                                    key={`${employeeKey}-${d.date}`}
                                                    style={{
                                                        borderRight: '1px solid var(--border)',
                                                        borderBottom: '1px solid var(--border)',
                                                        textAlign: 'center',
                                                        padding: 0,
                                                        height: 56,
                                                        minWidth: '44px',
                                                        overflow: 'hidden',
                                                        cursor: tooltip ? 'help' : 'default',
                                                        position: 'relative',
                                                        background: '#f8fafc'
                                                    }}
                                                >
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {content || tooltip ? (
                                                            <Tooltip text={tooltip} position="top">
                                                                <div
                                                                    style={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        flexShrink: 0,
                                                                        ...bgStyle
                                                                    }}
                                                                >
                                                                    {content}
                                                                </div>
                                                            </Tooltip>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card-body" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>Legend</p>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-main)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#bbf7d0', borderRadius: 4 }}></div>
                        Present (P)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#14532d', borderRadius: 4 }}></div>
                        Late (L)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#fecaca', borderRadius: 4 }}></div>
                        Absent (A)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#f3e8ff', borderRadius: 4 }}></div>
                        Leave (L)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#ffd7a8', borderRadius: 4 }}></div>
                        Holiday (H)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, background: '#e2e8f0', borderRadius: 4 }}></div>
                        Week Off (WO)
                    </div>
                </div>
            </div>
        </div>
    );
}
