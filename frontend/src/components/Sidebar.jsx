import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Users, Clock, History, ShieldCheck, Briefcase, Calendar, MessageSquare, Megaphone, BookOpen, FileBadge, Package, BarChart2, LayoutDashboard, FileText, ClipboardList, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { tokenManager } from '../utils/tokenManager';

export default function Sidebar() {
    const userRole = tokenManager.getUserRole() || '';
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userRole);
    const isManager = ['PROJECT_MANAGER', 'IT_MANAGER', 'ADMIN', 'HR'].includes(userRole);
    const [isPerfOpen, setIsPerfOpen] = useState(window.location.pathname.startsWith('/performance'));

    const getDropdownStyle = ({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        color: isActive ? '#f97316' : '#64748b',
        background: isActive ? '#fff7ed' : 'transparent',
        fontWeight: isActive ? 700 : 600,
        textDecoration: 'none',
        fontSize: '14px',
        transition: 'all 0.2s'
    });

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Briefcase size={24} />
                <span>Elintsys EMS</span>
            </div>
            <nav className="sidebar-nav">
                {/* Profile */}
                <NavLink to={`/employees/${tokenManager.getUserData()?.id}`}
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <User size={20} />
                    <span>My Profile</span>
                </NavLink>

                {/* Module 1: Employees */}
                {userRole !== 'EMPLOYEE' && (
                    <NavLink to="/employees"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Users size={20} />
                        <span>Employees</span>
                    </NavLink>
                )}

                {/* Module 2: Attendance */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <NavLink to="/attendance"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Clock size={20} />
                    <span>Attendance</span>
                </NavLink>
                {/* <NavLink to="/attendance/history"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <History size={20} />
                    <span>Attendance History</span>
                </NavLink> */}

                {isHRorAdmin && (
                    <NavLink to="/admin/attendance"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <ShieldCheck size={20} />
                        <span>HR Attendance</span>
                    </NavLink>
                )}

                {/* Module 3: Leave & Permission (Enterprise Upgrade) */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0 8px 0' }} />
                
                {userRole !== 'ADMIN' && (
                    <NavLink to="/leave"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Calendar size={18} />
                        <span>My Dashboard</span>
                    </NavLink>
                )}

                {isManager && (
                    <>
                        <div style={{ margin: '8px 0' }} />
                        <NavLink to="/manager/leave-requests"
                            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            <ShieldCheck size={18} />
                            <span>Approvals Portal</span>
                        </NavLink>
                    </>
                )}

                {/* Module 5: Employee Communications */}
                {/* <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <NavLink to="/communications"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                    <MessageSquare size={20} />
                    <span>Communications</span>
                </NavLink>

                {isHRorAdmin && (
                    <NavLink to="/admin/communications"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Megaphone size={20} />
                        <span>HR Comms</span>
                    </NavLink>
                )} */}
                
                {/* Module 6: Reimbursement */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                {userRole !== 'ADMIN' && (
                    <NavLink to="/reimbursement/history"
                        className={({ isActive }) => isActive || window.location.pathname.startsWith('/reimbursement') ? "nav-item active" : "nav-item"}>
                        <FileBadge size={20} />
                        <span>My Reimbursements</span>
                    </NavLink>
                )}

                {isManager && (
                    <NavLink to="/admin/reimbursements"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <ShieldCheck size={20} />
                        <span>Admin Reimbursement</span>
                    </NavLink>
                )}

                {/* Module 7: Asset Management */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                {userRole === 'ADMIN' && (
                    <NavLink to="/assets"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Package size={20} />
                        <span>Admin Assets</span>
                    </NavLink>
                )}
                {userRole === 'HR' && (
                    <NavLink to="/hr-assets"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <Package size={20} />
                        <span>HR Assets</span>
                    </NavLink>
                )}

                {/* Module 8: Performance & MPR */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <div>
                    <div 
                        className={`nav-item ${window.location.pathname.startsWith('/performance') ? 'active' : ''}`}
                        onClick={() => setIsPerfOpen(!isPerfOpen)}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <BarChart2 size={20} />
                            <span>Performance MPR</span>
                        </div>
                        {isPerfOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    
                    {isPerfOpen && (
                        <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            paddingLeft: '32px',
                            marginTop: '4px'
                        }}>
                            {!['ADMIN', 'EMPLOYEE'].includes(userRole) && (
                                <NavLink to="/performance/dashboard" style={getDropdownStyle}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </NavLink>
                            )}
                            <NavLink to="/performance/monthly" style={getDropdownStyle}>
                                <FileText size={18} /> Monthly Review
                            </NavLink>
                            {!['ADMIN', 'EMPLOYEE'].includes(userRole) && (
                                <NavLink to="/performance/yearly" style={getDropdownStyle}>
                                    <BarChart2 size={18} /> Yearly Performance
                                </NavLink>
                            )}
                            <NavLink to="/performance/service-register" style={getDropdownStyle}>
                                <ClipboardList size={18} /> Service Register
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Module 8: Employee Handbook */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <NavLink to="/handbook"
                    className={({ isActive }) => isActive || window.location.pathname.startsWith('/handbook') ? "nav-item active" : "nav-item"} end>
                    <BookOpen size={20} />
                    <span>Handbook</span>
                </NavLink>

            </nav>
        </aside>
    );
}
