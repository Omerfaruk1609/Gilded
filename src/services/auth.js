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

export const getAchievements = (stats) => {
    const given = stats?.given || 0;
    const received = stats?.received || 0;
    
    return [
        {
            id: 'new_soul',
            label: 'Yeni Ruh',
            description: 'Kintsugi sığınağına katıldın ve yolculuğuna başladın.',
            icon: '🌑',
            color: '#94a3b8',
            unlocked: true
        },
        {
            id: 'healer',
            label: 'Şifa Dağıtıcı',
            description: '10 ya da daha fazla dert hikayesine altın dikiş attın.',
            icon: '🌱',
            color: '#4ADE80',
            unlocked: given >= 10
        },
        {
            id: 'gold_hands',
            label: 'Altın Eller',
            description: '20 veya üzeri altın dikiş desteği verdin.',
            icon: '✨',
            color: '#D4AF37',
            unlocked: given >= 20
        },
        {
            id: 'kintsugi_master',
            label: 'Kintsugi Ustası',
            description: 'Hikayen 10 veya üzeri altın dikiş ile tamamen onarıldı.',
            icon: '🏺',
            color: '#fb923c',
            unlocked: received >= 10
        }
    ];
};
