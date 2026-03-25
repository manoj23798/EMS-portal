import api from './api';

export const notificationService = {
    getMyNotifications: () => {
        return api.get('/notifications');
    },

    getUnreadCount: () => {
        return api.get('/notifications/unread-count');
    },

    markAsRead: (id) => {
        return api.put(`/notifications/${id}/read`);
    }
};
