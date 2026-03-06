import React, { useState, useEffect } from 'react';
import { AdminAttendanceAPI } from '../../services/api';
import { ShieldCheck, Download, Calendar, Search } from 'lucide-react';

export default function AdminAttendanceDashboard() {
    const today = new Date().toISOString().split('T')[0];

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(today);
    const [exportStartDate, setExportStartDate] = useState(today);
    const [exportEndDate, setExportEndDate] = useState(today);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await AdminAttendanceAPI.getAll(selectedDate);
            setRecords(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await AdminAttendanceAPI.exportExcel(exportStartDate, exportEndDate);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${exportStartDate}_to_${exportEndDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export attendance report.');
        } finally {
            setExporting(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m} ${ampm}`;
    };

    const formatMinutes = (totalMins) => {
        if (totalMins == null || totalMins === 0) return '0h 0m';
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const filteredRecords = records.filter(r =>
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-content">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={28} />
                    HR Attendance Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>View all employees' attendance and export reports</p>
            </div>

            {/* Filter & Export Row */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* View by date */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={16} /> View Date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {/* Search */}
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={16} /> Search
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Separator */}
                    <div style={{ borderLeft: '1px solid var(--border)', height: 50, margin: '0 8px' }}></div>

                    {/* Export date range */}
                    <div className="form-group">
                        <label className="form-label">Export From</label>
                        <input
                            type="date"
                            className="form-input"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Export To</label>
                        <input
                            type="date"
                            className="form-input"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={exporting}
                        style={{ padding: '10px 24px' }}
                    >
                        <Download size={18} />
                        {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">
                        Attendance for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        &nbsp;({filteredRecords.length} records)
                    </span>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Employee Name</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Break Duration</th>
                                <th>Total Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No attendance records for this date.</td></tr>
                            ) : (
                                filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>EMP{String(record.employeeId).padStart(4, '0')}</td>
                                        <td style={{ fontWeight: 500 }}>{record.employeeName}</td>
                                        <td>{formatTime(record.inTime)}</td>
                                        <td>{formatTime(record.outTime)}</td>
                                        <td>{formatMinutes(record.breakDuration)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatMinutes(record.totalHours)}</td>
                                        <td>
                                            <span className={`status-badge ${record.status === 'Late' ? 'status-inactive' : 'status-active'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
