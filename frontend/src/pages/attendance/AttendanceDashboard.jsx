import React, { useState, useEffect } from 'react';
import { AttendanceAPI } from '../../services/api';
import { Clock, Coffee, LogOut, Play, Pause, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceDashboard() {
    // For demo purposes, using employeeId = 1. In production, this comes from auth context.
    const EMPLOYEE_ID = 1;
    const navigate = useNavigate();

    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live clock
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch today's attendance
    useEffect(() => {
        fetchToday();
    }, []);

    const fetchToday = async () => {
        try {
            setLoading(true);
            const res = await AttendanceAPI.getToday(EMPLOYEE_ID);
            if (res.status === 204) {
                setAttendance(null);
            } else {
                setAttendance(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionFn, label) => {
        try {
            setActionLoading(true);
            setError('');
            const res = await actionFn(EMPLOYEE_ID);
            setAttendance(res.data);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || err.message || `${label} failed.`);
        } finally {
            setActionLoading(false);
        }
    };

    const timedIn = attendance?.inTime != null;
    const timedOut = attendance?.outTime != null;

    // Determine break state
    const isOnBreak = attendance && !timedOut && attendance.breakDuration !== null;
    // We can't perfectly determine active break from current response shape, 
    // so we rely on server error messages for edge cases.

    const formatMinutes = (totalMins) => {
        if (totalMins == null || totalMins === 0) return '0h 0m';
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return `${hrs}h ${mins}m`;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        // timeStr is like "HH:mm:ss.nnn" or "HH:mm:ss"
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="page-content">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <Timer size={40} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                        <p style={{ color: 'var(--text-muted)' }}>Loading attendance...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Attendance</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: 'rgba(247, 37, 133, 0.08)',
                    border: '1px solid rgba(247,37,133,0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 20px',
                    marginBottom: 20,
                    color: 'var(--danger)',
                    fontWeight: 500
                }}>
                    {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
            )}

            {/* Action Buttons Card */}
            <div className="card" style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <span className="card-title">Quick Actions</span>
                    {attendance?.status && (
                        <span className={`status-badge ${attendance.status === 'Late' ? 'status-inactive' : 'status-active'}`}>
                            {attendance.status}
                        </span>
                    )}
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {/* Timer In */}
                        <button
                            className="btn btn-primary"
                            disabled={actionLoading || timedIn}
                            onClick={() => handleAction(AttendanceAPI.timerIn, 'Timer In')}
                            style={{ minWidth: 160, padding: '14px 28px', fontSize: '1rem', opacity: timedIn ? 0.5 : 1 }}
                        >
                            <Play size={20} />
                            Timer In
                        </button>

                        {/* Timer Out */}
                        <button
                            className="btn btn-danger"
                            disabled={actionLoading || !timedIn || timedOut}
                            onClick={() => handleAction(AttendanceAPI.timerOut, 'Timer Out')}
                            style={{
                                minWidth: 160, padding: '14px 28px', fontSize: '1rem',
                                background: 'var(--danger)', color: 'white',
                                opacity: (!timedIn || timedOut) ? 0.5 : 1
                            }}
                        >
                            <LogOut size={20} />
                            Timer Out
                        </button>

                        {/* Start Break */}
                        <button
                            className="btn btn-secondary"
                            disabled={actionLoading || !timedIn || timedOut}
                            onClick={() => handleAction(AttendanceAPI.startBreak, 'Start Break')}
                            style={{
                                minWidth: 160, padding: '14px 28px', fontSize: '1rem',
                                background: 'var(--warning)', color: 'white',
                                opacity: (!timedIn || timedOut) ? 0.5 : 1
                            }}
                        >
                            <Coffee size={20} />
                            Start Break
                        </button>

                        {/* End Break */}
                        <button
                            className="btn btn-secondary"
                            disabled={actionLoading || !timedIn || timedOut}
                            onClick={() => handleAction(AttendanceAPI.endBreak, 'End Break')}
                            style={{
                                minWidth: 160, padding: '14px 28px', fontSize: '1rem',
                                background: '#2d6a4f', color: 'white',
                                opacity: (!timedIn || timedOut) ? 0.5 : 1
                            }}
                        >
                            <Pause size={20} />
                            End Break
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <Play size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>In Time</p>
                    <p style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatTime(attendance?.inTime)}</p>
                </div>

                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <LogOut size={28} style={{ color: 'var(--danger)', marginBottom: 8 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Out Time</p>
                    <p style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatTime(attendance?.outTime)}</p>
                </div>

                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <Coffee size={28} style={{ color: 'var(--warning)', marginBottom: 8 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Break Duration</p>
                    <p style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatMinutes(attendance?.breakDuration)}</p>
                </div>

                <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <Timer size={28} style={{ color: '#2d6a4f', marginBottom: 8 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>Working Hours</p>
                    <p style={{ fontWeight: 700, fontSize: '1.4rem' }}>{formatMinutes(attendance?.totalHours)}</p>
                </div>
            </div>

            {/* Quick Navigation */}
            <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => navigate('/attendance/history')}>
                    View Attendance History →
                </button>
            </div>
        </div>
    );
}
