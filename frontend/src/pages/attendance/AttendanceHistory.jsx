import React, { useState, useEffect, useMemo } from 'react';
import { AttendanceAPI, AdminAttendanceAPI } from '../../services/api';
import { History, Search, Filter, Users, Clock3, TriangleAlert, UserX, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { tokenManager } from '../../utils/tokenManager';

export default function AttendanceHistory() {
    const userData = tokenManager.getUserData();
    const EMPLOYEE_ID = userData?.employeeId;
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userData?.role);

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewScope, setViewScope] = useState('my');
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
            const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
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
            setRecords(res.data || []);
        } catch (err) {
            console.error('Failed to fetch attendance history:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0], 10);
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

    const normalizeStatus = (status) => {
        const value = String(status || '').trim().toLowerCase();
        if (!value) return '--';
        if (value === 'lop' || value === 'leave without pay' || value.includes('loss of pay')) return 'Leave';
        if (value.includes('permission')) return 'Permission';
        if (value.includes('late')) return 'Late';
        if (value.includes('leave')) return 'Leave';
        if (value === 'present') return 'Present';
        if (value === 'absent') return 'Absent';
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

            return (
                r.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                normalizeStatus(r.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [records, searchTerm]);

    const stats = useMemo(() => {
        const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
        const lateCount = filteredRecords.filter((r) => r.status === 'Late').length;
        const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;
        const avgHours = filteredRecords.length > 0
            ? Math.round((filteredRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0) / filteredRecords.length) * 10) / 10
            : 0;
        return { total: filteredRecords.length, presentCount, lateCount, absentCount, avgHours };
    }, [filteredRecords]);

    return (
        <div className="history-portal-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');

                .history-portal-page {
                    padding: 16px;
                    background: #ffffff;
                    min-height: 100vh;
                    font-family: 'Outfit', sans-serif;
                    color: #0f172a;
                    box-sizing: border-box;
                }

                .ah-portal-switch { display: inline-flex; gap: 6px; padding: 6px; border-radius: 14px; background: #eef2f7; margin-bottom: 24px; }
                .ah-portal-switch-btn { border: none; background: transparent; color: #64748b; border-radius: 10px; padding: 8px 14px; font-size: 10px; font-weight: 950; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
                .ah-portal-switch-btn.active { background: #f97316; color: #fff; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25); }

                .ah-title-section { margin-bottom: 24px; }
                .ah-title-section h1 { font-size: 28px; font-weight: 950; margin: 0 0 4px 0; color: #0f172a; display: flex; align-items: center; gap: 10px; }
                .ah-title-section p { font-size: 14px; font-weight: 800; color: #64748b; margin: 0; }

                .ah-metrics-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
                .ah-metric-card { background: #f8fafc; border: 1.5px solid #eef2f7; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; align-items: center; }
                .ah-metric-label { font-size: 9px; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .ah-metric-value { font-size: 20px; font-weight: 950; color: #0f172a; }

                .ah-table-shell { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 22px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); overflow: hidden; }
                .ah-filter-topbar { padding: 14px 18px; border-bottom: 3.5px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
                
                .ah-header-metrics { display: flex; align-items: center; gap: 16px; }
                .ah-header-metric-item { display: flex; flex-direction: column; }
                .ah-header-metric-label { font-size: 8px; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
                .ah-header-metric-value { font-size: 14px; font-weight: 950; color: #0f172a; outline: none; border: none; background: transparent; cursor: pointer; }
                .ah-header-divider { width: 1.5px; height: 28px; background: #e2e8f0; margin: 0 2px; }

                .ah-filter-actions { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end; }
                .ah-search-chip { position: relative; flex: 0 1 300px; }
                .ah-search-chip input { width: 100%; height: 38px; border-radius: 14px; border: 1.5px solid #fdba74; background: #fff; padding: 0 16px 0 38px; font-size: 12px; font-weight: 800; outline: none; }
                .ah-search-chip svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #f97316; }

                .ah-toolbar-btn { height: 38px; padding: 0 14px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 950; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 6px; }
                
                .ah-table-ui { width: 100%; border-collapse: collapse; }
                .ah-table-ui th { padding: 12px 18px; background: #fcfcfc; border-bottom: 2px solid #f1f5f9; font-size: 9px; font-weight: 950; text-transform: uppercase; color: #64748b; letter-spacing: 1.2px; text-align: left; }
                .ah-table-ui td { padding: 14px 18px; border-bottom: 1.5px solid #f8fafc; font-size: 13px; font-weight: 800; color: #1e293b; }
                
                .ah-status-pill { padding: 5px 10px; border-radius: 8px; font-size: 10px; font-weight: 950; text-transform: uppercase; }
                .ah-status-present { background: #ecfdf5; color: #059669; }
                .ah-status-late { background: #fff7ed; color: #ea580c; }
                .ah-status-absent { background: #fef2f2; color: #dc2626; }
                .ah-status-other { background: #f1f5f9; color: #64748b; }
            `}</style>

            <div className="ah-title-section">
                <h1><History size={28} style={{ color: '#f97316' }} /> Attendance History</h1>
                <p>{viewScope === 'org' ? 'Complete organizational attendance logs' : 'A detailed overview of your past activity'}</p>
            </div>

            {isHRorAdmin && (
                <div className="ah-portal-switch">
                    <button type="button" className={`ah-portal-switch-btn ${viewScope === 'my' ? 'active' : ''}`} onClick={() => setViewScope('my')}>
                        My Statistics
                    </button>
                    <button type="button" className={`ah-portal-switch-btn ${viewScope === 'org' ? 'active' : ''}`} onClick={() => setViewScope('org')}>
                        Organization Wide
                    </button>
                </div>
            )}

            <div className="ah-metrics-bar">
                <div className="ah-metric-card">
                    <div className="ah-metric-label">Records</div>
                    <div className="ah-metric-value">{stats.total}</div>
                </div>
                <div className="ah-metric-card">
                    <div className="ah-metric-label">Avg Hours</div>
                    <div className="ah-metric-value" style={{ color: '#0ea5e9' }}>{stats.avgHours}h</div>
                </div>
                <div className="ah-metric-card">
                    <div className="ah-metric-label">Present</div>
                    <div className="ah-metric-value" style={{ color: '#10b981' }}>{stats.presentCount}</div>
                </div>
                <div className="ah-metric-card">
                    <div className="ah-metric-label">Late</div>
                    <div className="ah-metric-value" style={{ color: '#f59e0b' }}>{stats.lateCount}</div>
                </div>
                <div className="ah-metric-card">
                    <div className="ah-metric-label">Absent</div>
                    <div className="ah-metric-value" style={{ color: '#ef4444' }}>{stats.absentCount}</div>
                </div>
            </div>

            <div className="ah-table-shell">
                <div className="ah-filter-topbar">
                    <div className="ah-header-metrics">
                        <div className="ah-header-metric-item">
                            <div className="ah-header-metric-label">Select Month</div>
                            <input type="month" className="ah-header-metric-value" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                        </div>
                    </div>

                    <div className="ah-filter-actions">
                        <div className="ah-search-chip">
                            <Search size={14} />
                            <input type="text" placeholder="Filter by name, date or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button type="button" className="ah-toolbar-btn" onClick={() => setSearchTerm('')}>
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="ah-table-ui">
                        <thead>
                            <tr>
                                {viewScope === 'org' && <th>Employee</th>}
                                <th>Date</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Break</th>
                                <th>Total Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={viewScope === 'org' ? '7' : '6'} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Fetching logs...</td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={viewScope === 'org' ? '7' : '6'} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No records found for the selected period.</td></tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id}>
                                        {viewScope === 'org' && <td style={{ fontWeight: 900 }}>{record.employeeName}</td>}
                                        <td style={{ color: '#64748b', fontSize: '11px', fontWeight: 950 }}>{record.date}</td>
                                        <td>{formatTime(record.inTime)}</td>
                                        <td>{formatTime(record.outTime)}</td>
                                        <td>{formatMinutes(record.breakDuration)}</td>
                                        <td style={{ color: '#0ea5e9', fontWeight: 900 }}>{formatMinutes(record.totalHours)}</td>
                                        <td>
                                            <span className={`ah-status-pill ${
                                                normalizeStatus(record.status) === 'Present' ? 'ah-status-present' : 
                                                normalizeStatus(record.status) === 'Late' ? 'ah-status-late' : 
                                                normalizeStatus(record.status) === 'Absent' ? 'ah-status-absent' : 'ah-status-other'
                                            }`}>
                                                {normalizeStatus(record.status)}
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
