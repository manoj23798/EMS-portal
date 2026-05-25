import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
});

api.interceptors.request.use((config) => {
    const token = tokenManager.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            tokenManager.clearAll();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const EmployeeAPI = {
    getAll: () => api.get('/employees'),
    search: (query) => api.get('/employees/search', { params: { query } }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
    uploadPhoto: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'PROFILE_PHOTO');
        return api.post(`/employees/${id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const OnboardingAPI = {
    // Education
    getEducation: (empId) => api.get(`/onboarding/${empId}/education`),
    saveEducation: (empId, data) => api.post(`/onboarding/${empId}/education`, data),
    deleteEducation: (id) => api.delete(`/onboarding/education/${id}`),
    uploadEducationDocument: (eduId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/onboarding/education/${eduId}/document`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Employment History (The correct naming for the new structure)
    getEmploymentHistory: (empId) => api.get(`/onboarding/${empId}/employment`),
    saveEmploymentHistory: (empId, data) => api.post(`/onboarding/${empId}/employment`, data),
    saveEmploymentHistoryBatch: (empId, data) => api.post(`/onboarding/${empId}/employment/batch`, data),
    deleteEmploymentHistory: (id) => api.delete(`/onboarding/employment/${id}`),
    uploadEmploymentDoc: (historyId, file, docType) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', docType);
        return api.post(`/onboarding/employment/${historyId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Documents (Personal/Company)
    getDocuments: (empId, category) => api.get(`/onboarding/${empId}/documents`, { params: { category } }),
    uploadDocument: (empId, file, type, category) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', type);
        formData.append('category', category);
        return api.post(`/onboarding/${empId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteDocument: (id) => api.delete(`/onboarding/documents/${id}`),

    // Emergency Details
    updateEmergency: (empId, data) => api.put(`/onboarding/${empId}/emergency`, data),

    // Checklist
    getChecklist: (empId) => api.get(`/onboarding/${empId}/checklist`),
    saveChecklist: (empId, data) => api.post(`/onboarding/${empId}/checklist`, data),
    
    // Feedback
    getFeedback: (empId) => api.get(`/onboarding/${empId}/feedback`),
    saveFeedback: (empId, data) => api.post(`/onboarding/${empId}/feedback`, data),

    // BGV
    getVerification: (empId) => api.get(`/onboarding/${empId}/verification`),
    saveVerification: (empId, data) => api.post(`/onboarding/${empId}/verification`, data),
};

export const CandidateAPI = {
    get: (empId) => api.get(`/candidates/${empId}`),
    save: (empId, data) => api.post(`/candidates/${empId}`, data),
    uploadPhoto: (empId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/candidates/${empId}/photo`, formData, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
        });
    }
};

export const ExitManagementAPI = {
    get: (empId) => api.get(`/exit/${empId}`),
    save: (empId, data) => api.post(`/exit/${empId}`, data),
};

export const AuthAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getCurrentUser: () => api.get('/auth/me'),
};

export const AttendanceAPI = {
    getToday: (empId) => api.get(`/attendance/my-attendance`, { params: { employeeId: empId } }),
    getHistory: (empId, start, end) => api.get(`/attendance/history`, { params: { employeeId: empId, startDate: start, endDate: end } }),
    timerIn: (empId) => api.post(`/attendance/timer-in?employeeId=${empId}`),
    timerOut: (empId) => api.post(`/attendance/timer-out?employeeId=${empId}`),
    startBreak: (empId, type) => api.post(`/attendance/start-break?employeeId=${empId}&breakType=${type}`),
    endBreak: (empId) => api.post(`/attendance/end-break?employeeId=${empId}`),
};

export const AdminAttendanceAPI = {
    getHistory: (start, end) => api.get(`/admin/attendance/history`, { params: { startDate: start, endDate: end } }),
    exportExcel: (start, end) => api.get(`/admin/attendance/export`, { 
        params: { startDate: start, endDate: end },
        responseType: 'blob' 
    }),
};

export const LeaveAPI = {
    getBalance: (empId) => api.get(`/leaves/balance`, { params: { employeeId: empId } }),
    getMy: (empId) => api.get(`/leaves/my`, { params: { employeeId: empId } }),
    apply: (data) => api.post(`/leaves/apply`, data),
    cancel: (id, empId, reason) => api.put(`/leaves/${id}/cancel?employeeId=${empId}`, { cancelReason: reason }),
};

export const PermissionAPI = {
    getMy: (empId) => api.get(`/permissions/my`, { params: { employeeId: empId } }),
    apply: (data) => api.post(`/permissions/apply`, data),
    getAll: () => api.get(`/admin/permissions`),
};

export const ManagerAPI = {
    getPendingLeaves: () => api.get(`/manager/leaves`),
    approveLeave: (id, managerId, remarks) => api.put(`/manager/leaves/${id}/approve`, null, { params: { managerId, remarks } }),
    rejectLeave: (id, managerId, remarks) => api.put(`/manager/leaves/${id}/reject`, null, { params: { managerId, remarks } }),
    getPendingPermissions: () => api.get(`/manager/permissions`),
    approvePermission: (id, managerId) => api.put(`/manager/permissions/${id}/approve`, null, { params: { managerId } }),
    rejectPermission: (id, managerId, remarks) => api.put(`/manager/permissions/${id}/reject`, null, { params: { managerId, remarks } }),
};

export const LeaveStatsAPI = {
    getAnalytics: (params) => api.get(`/leave/stats/analytics`, { params }),
    getCalendar: (start, end) => api.get(`/leave/stats/calendar`, { params: { start, end } }),
};

export const LeaveConfigAPI = {
    getTypes: () => api.get(`/leave-config/types`),
    getHolidays: (start, end) => api.get(`/leave-config/holidays`, { params: { start, end } }),
};

export const DepartmentAPI = {
    getAll: () => api.get('/departments'),
    getById: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`),
};

export const DesignationAPI = {
    getAll: () => api.get('/designations'),
    getById: (id) => api.get(`/designations/${id}`),
    create: (data) => api.post('/designations', data),
    update: (id, data) => api.put(`/designations/${id}`, data),
    delete: (id) => api.delete(`/designations/${id}`),
};

export const DocumentAPI = {
    upload: (empId, file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', type);
        return api.post(`/employees/${empId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

export const CommunicationAPI = {
    getAll: () => api.get('/communications'),
    getById: (id) => api.get(`/communications/${id}`),
};

export const AdminCommunicationAPI = {
    getAll: () => api.get('/admin/communications'),
    create: (data) => api.post('/admin/communications', data),
    update: (id, data) => api.put(`/admin/communications/${id}`, data),
    delete: (id) => api.delete(`/admin/communications/${id}`),
};

export const ReimbursementAPI = {
    getAll: () => api.get('/reimbursement'),
    getById: (id) => api.get(`/reimbursement/${id}`),
    create: (data) => api.post('/reimbursement/create', data),
    update: (id, data) => api.put(`/reimbursement/${id}`, data),
    delete: (id) => api.delete(`/reimbursement/${id}`),
    getMy: (empId) => api.get('/reimbursement/my', { params: { employeeId: empId } }),
    getAnalytics: (params) => api.get('/reimbursements/analytics/dashboard', { params }),
    getAnalyticsEmployees: () => api.get('/reimbursements/analytics/filters/employees'),
    getAnalyticsProjects: () => api.get('/reimbursements/analytics/filters/projects'),
};

export const PerformanceAPI = {
    // MPRs (Monthly Performance Reviews)
    getAllMPRs: () => api.get('/performance/reviews'),
    getMPRById: (id) => api.get(`/performance/reviews/${id}`),
    createMPR: (data) => api.post('/performance/reviews', data),
    updateMPR: (id, data) => api.put(`/performance/reviews/${id}`, data),
    deleteMPR: (id) => api.delete(`/performance/reviews/${id}`),
    getMPRsByEmployee: (employeeId) => api.get(`/performance/reviews/employee/${employeeId}`),

    // Service Register
    getAllServiceRegisters: () => api.get('/performance/service-register'),
    createServiceRegister: (data) => api.post('/performance/service-register', data),
    updateServiceRegister: (id, data) => api.put(`/performance/service-register/${id}`, data),
    deleteServiceRegister: (id) => api.delete(`/performance/service-register/${id}`),

    // Templates
    createTemplate: (data) => api.post('/performance/templates', data),
    updateTemplate: (id, data) => api.put(`/performance/templates/${id}`, data),
    getAllTemplates: () => api.get('/performance/templates'),
    getTemplateById: (id) => api.get(`/performance/templates/${id}`),
    deleteTemplate: (id) => api.delete(`/performance/templates/${id}`),

    // Misc
    getMyReviews: (empId) => api.get('/performance/my-reviews', { params: { employeeId: empId } }),
    submitReview: (data) => api.post('/performance/submit-review', data),
};

export const AssetAPI = {
    // Dashboard
    getDashboard: () => api.get('/assets/dashboard'),

    // Inventory
    getInventory: () => api.get('/assets/inventory'),
    createInventory: (data) => api.post('/admin/assets/inventory', data),
    updateInventory: (id, data) => api.put(`/admin/assets/inventory/${id}`, data),
    deleteInventory: (id) => api.delete(`/admin/assets/inventory/${id}`),

    // Category assets
    getCategoryAssets: () => api.get('/assets/category'),
    createCategoryAsset: (data) => api.post('/admin/assets/category', data),
    updateCategoryAsset: (id, data) => api.put(`/admin/assets/category/${id}`, data),
    deleteCategoryAsset: (id) => api.delete(`/admin/assets/category/${id}`),

    // Stock items
    getStockItems: (section) => api.get('/assets/stock', { params: { section } }),
    createStockItem: (data) => api.post('/admin/assets/stock', data),
    updateStockItem: (id, data) => api.put(`/admin/assets/stock/${id}`, data),
    deleteStockItem: (id) => api.delete(`/admin/assets/stock/${id}`),

    // Maintenance schedules & checklists
    getSchedules: () => api.get('/assets/maintenance/schedules'),
    createSchedule: (data) => api.post('/admin/assets/maintenance/schedules', data),
    updateSchedule: (id, data) => api.put(`/admin/assets/maintenance/schedules/${id}`, data),
    deleteSchedule: (id) => api.delete(`/admin/assets/maintenance/schedules/${id}`),

    getChecklists: () => api.get('/assets/maintenance/checklists'),
    createChecklist: (data) => api.post('/admin/assets/maintenance/checklists', data),
    updateChecklist: (id, data) => api.put(`/admin/assets/maintenance/checklists/${id}`, data),
    deleteChecklist: (id) => api.delete(`/admin/assets/maintenance/checklists/${id}`),

    // Dynamic tabs
    getDynamicData: (tabId) => api.get(`/assets/dynamic/${tabId}`),
    saveDynamicData: (data) => api.post('/admin/assets/dynamic', data),

    // Logs
    getAllLogs: () => api.get('/assets/logs'),
    getLogsByTable: (table) => api.get(`/assets/logs/table/${table}`),
    getLogsByRecordId: (id) => api.get(`/assets/logs/record/${id}`),
    addLog: (data) => api.post('/admin/assets/logs', data),
};

export const HandbookAPI = {
    getAll: () => api.get('/handbook'),
    getById: (id) => api.get(`/handbook/${id}`),
    create: (data) => api.post('/handbook', data),
    update: (id, data) => api.put(`/handbook/${id}`, data),
    delete: (id) => api.delete(`/handbook/${id}`),
};

export default api;
