import { NavLink } from 'react-router-dom';
import { Users, Clock, History, ShieldCheck, Briefcase, Calendar, FileText, UserCheck } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Briefcase size={24} />
                <span>Enterprise EMS</span>
            </div>
            <nav className="sidebar-nav">
                {/* Module 1: Employees */}
                <NavLink to="/employees"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <Users size={20} />
                    <span>Employees</span>
                </NavLink>

                {/* Module 2: Attendance */}
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
                <NavLink to="/admin/attendance"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <ShieldCheck size={20} />
                    <span>HR Attendance</span>
                </NavLink>

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
                <NavLink to="/manager/leave-requests"
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    <UserCheck size={20} />
                    <span>Manager Approvals</span>
                </NavLink>
            </nav>
        </aside>
    );
}
