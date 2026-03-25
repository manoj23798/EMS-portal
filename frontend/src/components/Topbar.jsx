import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ManagerAPI } from '../services/api';
import { tokenManager } from '../utils/tokenManager';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

export default function Topbar() {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [generalNotifications, setGeneralNotifications] = useState([]);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            // Generic System Notifications for all users (e.g. Handbook Updates)
            const notifRes = await notificationService.getMyNotifications();
            setGeneralNotifications(notifRes.data);

            // Only fetch pending leaves if the user is a manager (to avoid 403s on employee accounts)
            if (['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER'].includes(tokenManager.getUserRole())) {
                const res = await ManagerAPI.getPendingLeaves();
                setPendingLeaves(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markNotificationAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = () => {
        setShowNotifications(false);
        navigate('/manager/leave-requests');
    };

    return (
        <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search module..."
                    className="form-input"
                    style={{ border: 'none', background: 'transparent', width: '250px' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', color: 'var(--text-main)' }}>
                {/* Notification Bell */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <div
                        style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} style={{ transition: 'var(--transition)' }} className="hover-effect" />
                        { (pendingLeaves.length + generalNotifications.filter(n => !n.isRead).length) > 0 && (
                            <span style={{
                                position: 'absolute', top: 0, right: 0,
                                background: 'var(--danger)', color: 'white',
                                borderRadius: '50%', width: '16px', height: '16px',
                                fontSize: '0.65rem', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 'bold'
                            }}>
                                {pendingLeaves.length + generalNotifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </div>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '12px',
                            width: '320px', background: 'var(--surface)',
                            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                            border: '1px solid var(--border)', zIndex: 50, overflow: 'hidden'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Notifications</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }} onClick={fetchNotifications}>Refresh</span>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {pendingLeaves.length === 0 && generalNotifications.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        No new notifications
                                    </div>
                                ) : (
                                    <>
                                        {/* General System Notifications */}
                                        {generalNotifications.map(notif => (
                                            <div
                                                key={`sys-${notif.id}`}
                                                onClick={() => markNotificationAsRead(notif.id)}
                                                style={{
                                                    padding: '16px', borderBottom: '1px solid var(--border)',
                                                    cursor: 'pointer', transition: 'background 0.2s',
                                                    display: 'flex', flexDirection: 'column', gap: '4px',
                                                    background: notif.isRead ? 'transparent' : 'rgba(239,83,80,0.05)'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(239,83,80,0.05)'}
                                            >
                                                <div style={{ fontWeight: notif.isRead ? 400 : 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                    {notif.message}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Manager Leave Requests */}
                                        {pendingLeaves.map(leave => (
                                            <div
                                                key={`leave-${leave.id}`}
                                                onClick={handleNotificationClick}
                                                style={{
                                                    padding: '16px', borderBottom: '1px solid var(--border)',
                                                    cursor: 'pointer', transition: 'background 0.2s',
                                                    display: 'flex', flexDirection: 'column', gap: '4px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                    {leave.employeeName} requests {leave.totalDays} day(s) leave
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {leave.leaveType}: {leave.startDate} to {leave.endDate}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            {pendingLeaves.length > 0 && (
                                <div
                                    onClick={handleNotificationClick}
                                    style={{
                                        borderTop: '1px solid var(--border)',
                                        padding: '12px', textAlign: 'center', background: 'var(--primary-light)',
                                        color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                                    }}
                                >
                                    View Leave Requests
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <User size={18} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tokenManager.getUserData()?.username || 'User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tokenManager.getUserRole()}</div>
                    </div>
                    <button 
                        onClick={() => authService.logout()}
                        className="btn"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, marginLeft: 8 }}
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
