import api from './api';

export const handbookService = {
    // Admin (HR) Methods
    uploadPolicy: (data) => {
        return api.post('/admin/handbook/policy', data);
    },

    updatePolicy: (id, data) => {
        return api.put(`/admin/handbook/policy/${id}`, data);
    },

    archivePolicy: (id) => {
        return api.delete(`/admin/handbook/policy/${id}`);
    },

    createCategory: (data) => {
        return api.post('/admin/handbook/category', data);
    },

    updateCategory: (id, data) => {
        return api.put(`/admin/handbook/category/${id}`, data);
    },
    
    deleteCategory: (id) => {
        return api.delete(`/admin/handbook/category/${id}`);
    },

    // Employee Methods (Read-Only)
    getAllPolicies: () => {
        return api.get('/handbook');
    },

    getPolicyById: (id) => {
        return api.get(`/handbook/${id}`);
    }
};
