import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api', 
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = tokenManager.getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s & Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh-token') {
            originalRequest._retry = true;
            
            try {
                // Dynamically import to avoid circular dependency
                const { authService } = await import('./authService');
                const newToken = await authService.refreshToken();
                
                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, force logout
                tokenManager.clearAll();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

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
    getHistory: (startDate, endDate) => api.get(`/admin/attendance/history?startDate=${startDate}&endDate=${endDate}`),
    exportExcel: (startDate, endDate) => api.get(`/admin/attendance/export?startDate=${startDate}&endDate=${endDate}`, {
        responseType: 'blob'
    }),
};

export const LeaveAPI = {
    apply: (data) => api.post('/leaves/apply', data),
    getMy: (employeeId) => api.get(`/leaves/my?employeeId=${employeeId}`),
    getBalance: (employeeId) => api.get(`/leaves/balance?employeeId=${employeeId}`),
    getAll: () => api.get('/admin/leaves'), // Admin endpoint
};

export const PermissionAPI = {
    apply: (data) => api.post('/permissions/apply', data),
    getMy: (employeeId) => api.get(`/permissions/my?employeeId=${employeeId}`),
    getAll: () => api.get('/admin/permissions'), // Admin endpoint
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



export const CommunicationAPI = {
    getMyCommunications: (employeeId) => api.get(`/communications/my?employeeId=${employeeId}`),
    getById: (id, employeeId) => api.get(`/communications/${id}?employeeId=${employeeId}`)
};

export const AdminCommunicationAPI = {
    create: (data) => api.post('/admin/communications', data, {
        headers: { 'Content-Type': 'multipart/form-data' } // handle file uploads
    }),
    getAll: () => api.get('/admin/communications'),
    getById: (id) => api.get(`/admin/communications/${id}`),
    delete: (id) => api.delete(`/admin/communications/${id}`),
    getTypes: () => api.get('/communications/types')
};

export default api;
