import React, { useState, useEffect } from 'react';
import { AdminAttendanceAPI, EmployeeAPI } from '../services/api';
import { Download } from 'lucide-react';

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

    const fetchData = async () => {
        try {
            setLoading(true);

            // Calculate start and end dates based on selectedMonth (YYYY-MM)
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

            const [empRes, attRes] = await Promise.all([
                EmployeeAPI.getAll(),
                AdminAttendanceAPI.getHistory(startDate, endDate)
            ]);

            setEmployees(empRes.data);
            setAttendanceRecords(attRes.data);
        } catch (err) {
            console.error("Failed to fetch monthly data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

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

    // Calculate calendar days
    const getDaysArray = () => {
        if (!selectedMonth) return [];
        const [year, month] = selectedMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();

        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
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
        let h = parseInt(parts[0]);
        const m = parts[1];
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}.${m} ${ampm}`;
    };

    const days = getDaysArray();

    // Group attendance by employee and date for O(1) lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
        if (!attendanceMap[record.employeeId]) {
            attendanceMap[record.employeeId] = {};
        }
        attendanceMap[record.employeeId][record.date] = record;
    });

    return (
        <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span className="card-title">Monthly View</span>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="form-input"
                        style={{ width: 180 }}
                    />
                </div>
                <button className="btn btn-secondary" onClick={handleExport} style={{ padding: '8px 16px' }}>
                    <Download size={16} /> Download
                </button>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading month data...</div>
                ) : (
                    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', fontSize: '0.8rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', left: 0, background: '#222222', color: 'white', padding: '10px 16px', zIndex: 2, borderRight: '1px solid #444', minWidth: 150 }}>Days</th>
                                    {days.map(d => (
                                        <th key={`day-${d.date}`} style={{ background: '#222222', color: 'white', fontWeight: 'normal', textAlign: 'center', borderRight: '1px solid #444', minWidth: 60, padding: '4px' }}>
                                            {d.dayName}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th style={{ position: 'sticky', left: 0, background: '#f97316', color: 'white', padding: '10px 16px', zIndex: 2, borderRight: '1px solid #ea580c' }}>Names</th>
                                    {days.map(d => (
                                        <th key={`date-${d.date}`} style={{ background: '#f97316', color: 'white', textAlign: 'center', borderRight: '1px solid #ea580c', padding: '4px' }}>
                                            {d.date}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id}>
                                        <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', fontWeight: 600, padding: '12px 16px', borderRight: '1px solid var(--border)', zIndex: 1, boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
                                            {emp.firstName} {emp.lastName}
                                        </td>
                                        {days.map(d => {
                                            const record = attendanceMap[emp.id]?.[d.fullDate];
                                            let content = null;
                                            let bgStyle = {};

                                            // Determine cell appearance
                                            if (record) {
                                                if (record.status === 'Leave') {
                                                    bgStyle = { background: '#e81cff', color: 'white' }; // Pinkish
                                                    content = <div style={{ fontWeight: 600 }}>L</div>;
                                                } else if (record.status === 'Absent') {
                                                    bgStyle = { background: '#ef4444', color: 'white' }; // Red
                                                    content = <div style={{ fontWeight: 600 }}>A</div>;
                                                } else if (record.status === 'Present' || record.status === 'Late') {
                                                    bgStyle = { background: 'var(--primary-light)' };
                                                    content = (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-main)' }}>
                                                            <span>{formatTime(record.inTime)}</span>
                                                            <span>{formatTime(record.outTime)}</span>
                                                        </div>
                                                    );
                                                }
                                            } else {
                                                if (d.isWeekend) {
                                                    bgStyle = { background: '#64748b', color: 'white' }; // Slate
                                                    content = <div style={{ fontWeight: 600, alignSelf: 'flex-end', justifySelf: 'flex-end' }}>WO</div>;
                                                } else {
                                                    // No record, but weekday (could be Future, or Absent not marked yet)
                                                    bgStyle = { background: '#f1f5f9' };
                                                }
                                            }

                                            return (
                                                <td key={`${emp.id}-${d.date}`} style={{
                                                    borderRight: '1px solid var(--border)',
                                                    borderBottom: '1px solid var(--border)',
                                                    textAlign: 'center',
                                                    padding: '8px 4px',
                                                    height: 60,
                                                    ...bgStyle
                                                }}>
                                                    {content}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card-body" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <p style={{ color: 'var(--text-main)', fontWeight: 500, marginBottom: 8 }}>Legend:</p>
                <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, background: '#64748b', borderRadius: 4 }}></div>
                        Week Off (WO)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, background: '#e81cff', borderRadius: 4 }}></div>
                        Leave (L)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, background: '#ef4444', borderRadius: 4 }}></div>
                        Absent (A)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, background: 'var(--primary-light)', borderRadius: 4, border: '1px solid var(--border)' }}></div>
                        Present / Late
                    </div>
                </div>
            </div>
        </div>
    );
}
