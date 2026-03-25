const TOKEN_KEY = 'ems_access_token';
const REFRESH_TOKEN_KEY = 'ems_refresh_token';
const USER_KEY = 'ems_user_data';

export const tokenManager = {
    setTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem(TOKEN_KEY, accessToken);
        }
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    },

    getAccessToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setUserData(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUserData() {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    getUserRole() {
        const user = this.getUserData();
        return user ? user.role : null;
    },

    clearAll() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
};
