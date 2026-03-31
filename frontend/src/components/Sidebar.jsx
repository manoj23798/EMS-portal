import { NavLink } from 'react-router-dom';
import { Users, Clock, History, ShieldCheck, Briefcase, Calendar, FileText, UserCheck, MessageSquare, Megaphone, BookOpen, FileBadge } from 'lucide-react';
import { tokenManager } from '../utils/tokenManager';

export default function Sidebar() {
    const userRole = tokenManager.getUserRole() || '';
    const isHRorAdmin = ['HR', 'ADMIN'].includes(userRole);
    const isManager = ['PROJECT_MANAGER', 'IT_MANAGER', 'ADMIN', 'HR'].includes(userRole);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Briefcase size={24} />
                <span>Elintsys EMS</span>
            </div>
            <nav className="sidebar-nav">
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
                <NavLink to="/attendance/history"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <History size={20} />
                    <span>Attendance History</span>
                </NavLink>

                {isHRorAdmin && (
                    <NavLink to="/admin/attendance"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <ShieldCheck size={20} />
                        <span>HR Attendance</span>
                    </NavLink>
                )}

                {/* Module 3: Leave & Permission */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <NavLink to="/leave"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Calendar size={20} />
                    <span>Leave Dashboard</span>
                </NavLink>
                <NavLink to="/leave/history"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <FileText size={20} />
                    <span>Leave History</span>
                </NavLink>

                {isManager && (
                    <NavLink to="/manager/leave-requests"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <UserCheck size={20} />
                        <span>Manager Approvals</span>
                    </NavLink>
                )}

                {/* Module 5: Employee Communications */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
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
                )}
                
                {/* Module 6: Reimbursement */}
                <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <NavLink to="/reimbursement/history"
                    className={({ isActive }) => isActive || window.location.pathname.startsWith('/reimbursement') ? "nav-item active" : "nav-item"}>
                    <FileBadge size={20} />
                    <span>My Reimbursements</span>
                </NavLink>

                {isManager && (
                    <NavLink to="/admin/reimbursements"
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        <ShieldCheck size={20} />
                        <span>Admin Reimbursement</span>
                    </NavLink>
                )}

                {/* Module 7: Employee Handbook */}
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
