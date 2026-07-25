import apiClient from './apiClient';

const triggerAuthChange = () => {
    window.dispatchEvent(new Event('auth-change'));
};

export const getStoredUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const clearStoredUser = () => {
    localStorage.removeItem('user');
    triggerAuthChange();
};

export const isAdminUser = (user) => {
    return user && user.role === 'ADMIN';
};

export const isBilgeUser = (user) => {
    return user && (user.role === 'BILGE' || user.role === 'ADMIN');
};

export const loginUser = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        const data = response.data;
        localStorage.setItem('user', JSON.stringify(data));
        triggerAuthChange();
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.message || 'Giriş yapılamadı', { cause: error });
    }
};

export const registerUser = async (email, password, ad) => {
    try {
        const response = await apiClient.post('/auth/register', { email, password, ad });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.message || 'Kayıt yapılamadı', { cause: error });
    }
};

export const logoutUser = async () => {
    return Promise.resolve();
};

export const getBadge = (stats) => {
    if (!stats) return null;
    const { received, given } = stats;
    
    if (given >= 20) return { label: 'Altın Eller', icon: '✨', color: '#D4AF37' };
    if (given >= 10) return { label: 'Şifa Dağıtıcı', icon: '🌱', color: '#4ADE80' };
    if (received >= 10) return { label: 'Kintsugi Ustası', icon: '🏺', color: '#fb923c' };
    if (given >= 1) return { label: 'Yeni Ruh', icon: '🌑', color: '#94a3b8' };
    
    return null;
};
