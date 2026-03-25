import api from './api';
import { tokenManager } from '../utils/tokenManager';

export const authService = {
    async login(username, password) {
        const response = await api.post('/auth/login', { username, password });
        const { token, refreshToken, ...userData } = response.data;
        
        tokenManager.setTokens(token, refreshToken);
        tokenManager.setUserData(userData);
        
        return userData;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            tokenManager.clearAll();
            window.location.href = '/login';
        }
    },

    async refreshToken() {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await api.post('/auth/refresh-token', refreshToken, {
            headers: { 'Content-Type': 'text/plain' }
        });
        
        const { token, refreshToken: newRefresh, ...userData } = response.data;
        tokenManager.setTokens(token, newRefresh);
        tokenManager.setUserData(userData);
        
        return token;
    },

    isAuthenticated() {
        return !!tokenManager.getAccessToken();
    }
};
