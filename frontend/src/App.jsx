import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './layouts/ProtectedRoute';
import RoleGuard from './guards/RoleGuard';
import LoginPage from './pages/auth/LoginPage';
import EmployeeListPage from './pages/employee/EmployeeListPage';
import EmployeeCreatePage from './pages/employee/EmployeeCreatePage';
import EmployeeProfilePage from './pages/performance/EmployeeProfile';
import EmployeeEditPage from './pages/employee/EmployeeEditPage';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
// import AttendanceHistory from './pages/attendance/AttendanceHistory';
import AdminAttendanceDashboard from './pages/attendance/AdminAttendanceDashboard';
import LeaveDashboard from './pages/leave/LeaveDashboard';
import LeaveApply from './pages/leave/LeaveApply';
import LeaveHistory from './pages/leave/LeaveHistory';
import PermissionApply from './pages/permission/PermissionApply';
import PermissionHistory from './pages/permission/PermissionHistory';
import ManagerApprovalPage from './pages/manager/ManagerApprovalPage';
import ManagerPermissionApprovalPage from './pages/manager/ManagerPermissionApprovalPage';
import AdminLeaveDashboard from './pages/leave/admin/AdminLeaveDashboard';


import AdminCommunicationDashboard from './pages/communications/AdminCommunicationDashboard';
import AdminCommunicationCreate from './pages/communications/AdminCommunicationCreate';
import EmployeeCommunicationDashboard from './pages/communications/EmployeeCommunicationDashboard';
import CommunicationDetails from './pages/communications/CommunicationDetails';


import HandbookPage from './pages/handbook/HandbookPage';
import PolicyView from './pages/handbook/PolicyView';

import ReimbursementApply from './pages/reimbursement/ReimbursementApply';
import ReimbursementHistory from './pages/reimbursement/ReimbursementHistory';
import ReimbursementView from './pages/reimbursement/ReimbursementView';
import AdvancedAnalytics from './pages/reimbursement/AdvancedAnalytics';
import AssetManagementDashboard from './pages/assets/AssetManagementDashboard';

// Performance Management Modules
import PerformanceLayout from './pages/performance/PerformanceLayout';
import PerformanceDashboard from './pages/performance/PerformanceDashboard';
import MonthlyReviewList from './pages/performance/MonthlyReviewList';
import MonthlyReviewForm from './pages/performance/MonthlyReviewForm';
import YearlyPerformance from './pages/performance/YearlyPerformance';
import ServiceRegisterList from './pages/performance/ServiceRegisterList';
import TemplateManager from './pages/performance/TemplateManager';

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
            {/* <Route path="attendance/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><AttendanceHistory /></RoleGuard>} /> */}
            <Route path="admin/attendance" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminAttendanceDashboard /></RoleGuard>} />

            {/* Leave & Permission Modules */}
            <Route path="leave" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveDashboard /></RoleGuard>} />
            <Route path="leave/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveApply /></RoleGuard>} />
            <Route path="leave/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><LeaveHistory /></RoleGuard>} />
            <Route path="permission/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><PermissionApply /></RoleGuard>} />
            <Route path="permission/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><PermissionHistory /></RoleGuard>} />
            <Route path="manager/leave-requests" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER']}><ManagerApprovalPage /></RoleGuard>} />
            <Route path="manager/permission-requests" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER']}><ManagerPermissionApprovalPage /></RoleGuard>} />
            
            {/* Enterprise Leave Extensions */}
            <Route path="admin/leave-dashboard" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminLeaveDashboard /></RoleGuard>} />
            <Route path="admin/leave-types" element={<Navigate to="/leave" replace />} />
            <Route path="admin/holidays" element={<Navigate to="/leave" replace />} />
            <Route path="leave/calendar" element={<Navigate to="/leave" replace />} />

            {/* Communications Modules */}
            {/* <Route path="communications" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><EmployeeCommunicationDashboard /></RoleGuard>} />
            <Route path="communications/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><CommunicationDetails /></RoleGuard>} />
            <Route path="admin/communications" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminCommunicationDashboard /></RoleGuard>} />
            <Route path="admin/communications/create" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdminCommunicationCreate /></RoleGuard>} /> */}
            
            {/* Employee Handbook Modules */}
            <Route path="handbook" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><HandbookPage /></RoleGuard>}>
                <Route path="policy/:id" element={<PolicyView />} />
            </Route>

            {/* Reimbursement Modules */}
            <Route path="reimbursement/apply" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementApply /></RoleGuard>} />
            <Route path="reimbursement/history" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementHistory /></RoleGuard>} />
            <Route path="reimbursement/view/:id" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER', 'EMPLOYEE']}><ReimbursementView /></RoleGuard>} />
            <Route path="manager/reimbursements" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'IT_MANAGER']}><AdvancedAnalytics /></RoleGuard>} />
            <Route path="admin/reimbursements" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdvancedAnalytics /></RoleGuard>} />
            <Route path="admin/reimbursement-dashboard" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AdvancedAnalytics /></RoleGuard>} />

            {/* Asset Management Module */}
            <Route path="assets" element={<RoleGuard allowedRoles={['ADMIN']}><AssetManagementDashboard /></RoleGuard>} />
            <Route path="hr-assets" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><AssetManagementDashboard isHrView={true} /></RoleGuard>} />

            {/* Performance Management Module */}
            <Route path="performance" element={<RoleGuard allowedRoles={['ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE']}><PerformanceLayout /></RoleGuard>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PerformanceDashboard />} />
              <Route path="monthly" element={<MonthlyReviewList />} />
              <Route path="monthly/:id" element={<MonthlyReviewForm />} />
              <Route path="yearly" element={<YearlyPerformance />} />
              <Route path="service-register" element={<ServiceRegisterList />} />
              <Route path="templates" element={<RoleGuard allowedRoles={['ADMIN', 'HR']}><TemplateManager /></RoleGuard>} />
            </Route>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
