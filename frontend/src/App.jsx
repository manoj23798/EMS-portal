import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeCreatePage from './pages/EmployeeCreatePage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import EmployeeEditPage from './pages/EmployeeEditPage';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import AttendanceHistory from './pages/attendance/AttendanceHistory';
import AdminAttendanceDashboard from './pages/attendance/AdminAttendanceDashboard';
import LeaveDashboard from './pages/leave/LeaveDashboard';
import LeaveApply from './pages/leave/LeaveApply';
import LeaveHistory from './pages/leave/LeaveHistory';
import PermissionApply from './pages/permission/PermissionApply';
import ManagerApprovalPage from './pages/manager/ManagerApprovalPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="employees" element={<EmployeeListPage />} />
          <Route path="employees/new" element={<EmployeeCreatePage />} />
          <Route path="employees/:id" element={<EmployeeProfilePage />} />
          <Route path="employees/:id/edit" element={<EmployeeEditPage />} />

          {/* Module 2: Attendance Management */}
          <Route path="attendance" element={<AttendanceDashboard />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="admin/attendance" element={<AdminAttendanceDashboard />} />

          {/* Module 3: Leave & Permission Management */}
          <Route path="leave" element={<LeaveDashboard />} />
          <Route path="leave/apply" element={<LeaveApply />} />
          <Route path="leave/history" element={<LeaveHistory />} />
          <Route path="permission/apply" element={<PermissionApply />} />
          <Route path="manager/leave-requests" element={<ManagerApprovalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
