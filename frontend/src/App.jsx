import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './layouts/ProtectedRoute';
import RoleGuard from './guards/RoleGuard';
import LoginPage from './pages/auth/LoginPage';
import EmployeeListPage from './pages/employee/EmployeeListPage';
import EmployeeCreatePage from './pages/employee/EmployeeCreatePage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import EmployeeEditPage from './pages/employee/EmployeeEditPage';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import AttendanceHistory from './pages/attendance/AttendanceHistory';
import AdminAttendanceDashboard from './pages/attendance/AdminAttendanceDashboard';
import LeaveDashboard from './pages/leave/LeaveDashboard';
import LeaveApply from './pages/leave/LeaveApply';
import LeaveHistory from './pages/leave/LeaveHistory';
import PermissionApply from './pages/permission/PermissionApply';
import ManagerApprovalPage from './pages/manager/ManagerApprovalPage';


import AdminCommunicationDashboard from './pages/communications/AdminCommunicationDashboard';
import AdminCommunicationCreate from './pages/communications/AdminCommunicationCreate';
import EmployeeCommunicationDashboard from './pages/communications/EmployeeCommunicationDashboard';
import CommunicationDetails from './pages/communications/CommunicationDetails';


import HandbookPage from './pages/handbook/HandbookPage';
import PolicyView from './pages/handbook/PolicyView';
import PolicyEditor from './pages/handbook/PolicyEditor';

import ReimbursementApply from './pages/reimbursement/ReimbursementApply';
import ReimbursementHistory from './pages/reimbursement/ReimbursementHistory';
import AdminReimbursementDashboard from './pages/reimbursement/AdminReimbursementDashboard';
import ReimbursementView from './pages/reimbursement/ReimbursementView';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/employees" replace />} />
            
            {/* Employee endpoints */}
            <Route path="employees" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><EmployeeListPage /></RoleGuard>} />
            <Route path="employees/new" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><EmployeeCreatePage /></RoleGuard>} />
            <Route path="employees/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><EmployeeProfilePage /></RoleGuard>} />
            <Route path="employees/:id/edit" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><EmployeeEditPage /></RoleGuard>} />

            {/* Attendance Modules */}
            <Route path="attendance" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><AttendanceDashboard /></RoleGuard>} />
            <Route path="attendance/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><AttendanceHistory /></RoleGuard>} />
            <Route path="admin/attendance" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminAttendanceDashboard /></RoleGuard>} />

            {/* Leave & Permission Modules */}
            <Route path="leave" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveDashboard /></RoleGuard>} />
            <Route path="leave/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveApply /></RoleGuard>} />
            <Route path="leave/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveHistory /></RoleGuard>} />
            <Route path="permission/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><PermissionApply /></RoleGuard>} />
            <Route path="manager/leave-requests" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER']}><ManagerApprovalPage /></RoleGuard>} />

            {/* Communications Modules */}
            <Route path="communications" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><EmployeeCommunicationDashboard /></RoleGuard>} />
            <Route path="communications/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><CommunicationDetails /></RoleGuard>} />
            <Route path="admin/communications" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminCommunicationDashboard /></RoleGuard>} />
            <Route path="admin/communications/create" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminCommunicationCreate /></RoleGuard>} />
            
            {/* Employee Handbook Modules */}
            <Route path="handbook" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><HandbookPage /></RoleGuard>}>
                <Route path="policy/:id" element={<PolicyView />} />
                <Route path="editor" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><PolicyEditor /></RoleGuard>} />
                <Route path="editor/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><PolicyEditor /></RoleGuard>} />
            </Route>

            {/* Reimbursement Modules */}
            <Route path="reimbursement/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementApply /></RoleGuard>} />
            <Route path="reimbursement/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementHistory /></RoleGuard>} />
            <Route path="reimbursement/view/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementView /></RoleGuard>} />
            <Route path="manager/reimbursements" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER']}><AdminReimbursementDashboard /></RoleGuard>} />
            <Route path="admin/reimbursements" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminReimbursementDashboard /></RoleGuard>} />

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
