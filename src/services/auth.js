export const getStoredUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const clearStoredUser = () => {
    localStorage.removeItem('user');
};

export const isAdminUser = (user) => {
    return user && user.role === 'ADMIN';
};

export const loginUser = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Giriş yapılamadı');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
};

export const registerUser = async (email, password, ad) => {
    const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ad })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Kayıt yapılamadı');
    return data;
};

export const logoutUser = async () => {
    // Backend logout logic would go here
    return Promise.resolve();
};
