import React, { useState, useEffect } from 'react';
import { AttendanceAPI } from '../../services/api';
import { History, Search, Filter } from 'lucide-react';

export default function AttendanceHistory() {
    const EMPLOYEE_ID = 1;

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [selectedMonth]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

            const res = await AttendanceAPI.getHistory(EMPLOYEE_ID, startDate, endDate);
            setRecords(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance history:', err);
        } finally {
            setLoading(false);
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
        r.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-content">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <History size={28} />
                    Attendance History
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>View your past attendance records</p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '0 0 auto' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Filter size={16} /> Month
                        </label>
                        <input
                            type="month"
                            className="form-input"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={16} /> Search
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by date or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Records ({filteredRecords.length})</span>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Break Time</th>
                                <th>Total Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found for this period.</td></tr>
                            ) : (
                                filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 500 }}>{record.date}</td>
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
