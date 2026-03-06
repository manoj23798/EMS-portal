import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8087/api', // Spring Boot endpoint
});

export const EmployeeAPI = {
    getAll: () => api.get('/employees'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    deactivate: (id) => api.delete(`/employees/${id}`),
};

export const DepartmentAPI = {
    getAll: () => api.get('/departments')
};

export const DesignationAPI = {
    getAll: () => api.get('/designations')
};

export const DocumentAPI = {
    upload: (employeeId, file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', type);
        return api.post(`/employees/${employeeId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getByEmployee: (employeeId) => api.get(`/employees/${employeeId}/documents`)
};

export const AttendanceAPI = {
    timerIn: (employeeId) => api.post(`/attendance/timer-in?employeeId=${employeeId}`),
    timerOut: (employeeId) => api.post(`/attendance/timer-out?employeeId=${employeeId}`),
    startBreak: (employeeId) => api.post(`/attendance/start-break?employeeId=${employeeId}`),
    endBreak: (employeeId) => api.post(`/attendance/end-break?employeeId=${employeeId}`),
    getToday: (employeeId) => api.get(`/attendance/my-attendance?employeeId=${employeeId}`),
    getHistory: (employeeId, startDate, endDate) => {
        let url = `/attendance/history?employeeId=${employeeId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        return api.get(url);
    },
};

export const AdminAttendanceAPI = {
    getAll: (date) => api.get(`/admin/attendance?date=${date}`),
    exportExcel: (startDate, endDate) => api.get(`/admin/attendance/export?startDate=${startDate}&endDate=${endDate}`, {
        responseType: 'blob'
    }),
};

export const LeaveAPI = {
    apply: (data) => api.post('/leaves/apply', data),
    getMy: (employeeId) => api.get(`/leaves/my?employeeId=${employeeId}`),
    getBalance: (employeeId) => api.get(`/leaves/balance?employeeId=${employeeId}`),
};

export const PermissionAPI = {
    apply: (data) => api.post('/permissions/apply', data),
    getMy: (employeeId) => api.get(`/permissions/my?employeeId=${employeeId}`),
};

export const ManagerAPI = {
    getPendingLeaves: () => api.get('/manager/leaves'),
    approveLeave: (id, managerId, remarks) => {
        let url = `/manager/leaves/${id}/approve?managerId=${managerId}`;
        if (remarks) url += `&remarks=${encodeURIComponent(remarks)}`;
        return api.put(url);
    },
    rejectLeave: (id, managerId, remarks) => {
        let url = `/manager/leaves/${id}/reject?managerId=${managerId}`;
        if (remarks) url += `&remarks=${encodeURIComponent(remarks)}`;
        return api.put(url);
    },
    getPendingPermissions: () => api.get('/manager/permissions'),
    approvePermission: (id, managerId) => api.put(`/manager/permissions/${id}/approve?managerId=${managerId}`),
    rejectPermission: (id, managerId) => api.put(`/manager/permissions/${id}/reject?managerId=${managerId}`),
};

export default api;
