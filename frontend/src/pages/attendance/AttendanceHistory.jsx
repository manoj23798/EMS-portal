import React, { useState, useEffect } from 'react';
import { AttendanceAPI } from '../../services/api';
import { History, Search, Filter } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function AttendanceHistory() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userData?.role);

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewScope, setViewScope] = useState('my'); // 'my' or 'org'
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [selectedMonth, viewScope]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

            let res;
            if (viewScope === 'org') {
                res = await AdminAttendanceAPI.getHistory(startDate, endDate);
            } else {
                if (!EMPLOYEE_ID) {
                    setRecords([]);
                    return;
                }
                res = await AttendanceAPI.getHistory(EMPLOYEE_ID, startDate, endDate);
            }
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
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {viewScope === 'org' ? 'Viewing organization-wide attendance history' : 'Viewing your personal attendance records'}
                </p>

                {isHRorAdmin && (
                    <div style={{ display: 'flex', background: 'var(--surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <button onClick={() => setViewScope('my')}
                            style={{ 
                                padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', 
                                background: viewScope === 'my' ? 'var(--primary)' : 'transparent', 
                                color: viewScope === 'my' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                            }}>
                            My History
                        </button>
                        <button onClick={() => setViewScope('org')}
                            style={{ 
                                padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', 
                                background: viewScope === 'org' ? 'var(--primary)' : 'transparent', 
                                color: viewScope === 'org' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                            }}>
                            Organization
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', padding: 20 }}>
                    <div className="form-group" style={{ flex: '0 0 auto' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <Filter size={16} /> Select Month
                        </label>
                        <input
                            type="month"
                            className="form-input"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <Search size={16} /> Quick Filter
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Empty profile state for Admins/HR */}
            {viewScope === 'my' && !EMPLOYEE_ID && !loading && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Management user profile is not linked to a personal employee record.
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Switch to <strong>Organization</strong> view to see all employee records.
                    </p>
                </div>
            )}

            {/* Table */}
            {(viewScope === 'org' || EMPLOYEE_ID) && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">
                            {viewScope === 'org' ? 'Organizational Records' : 'My Records'} ({filteredRecords.length})
                        </span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {viewScope === 'org' && <th>Employee</th>}
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
                                    <tr><td colSpan={viewScope === 'org' ? "7" : "6"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading records...</td></tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr><td colSpan={viewScope === 'org' ? "7" : "6"} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found for this period.</td></tr>
                                ) : (
                                    filteredRecords.map(record => (
                                        <tr key={record.id}>
                                            {viewScope === 'org' && <td style={{ fontWeight: 600 }}>{record.employeeName}</td>}
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
            )}
        </div>
    );
}
