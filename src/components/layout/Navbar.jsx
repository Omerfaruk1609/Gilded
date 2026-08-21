import { AppBar, Box, Button, Toolbar, Typography, Avatar, IconButton, TextField, Paper, List, ListItem } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { clearStoredUser, getStoredUser, isAdminUser, logoutUser } from '../../services/auth'
import NotificationsMenu from './NotificationsMenu'
import PostModal from '../feed/PostModal'
import apiClient from '../../services/apiClient'
import toast from 'react-hot-toast'

function Navbar() {
    const navigate = useNavigate()
    const user = getStoredUser()
    const { mode, toggleTheme } = useContext(ThemeContext)
    const [postModalOpen, setPostModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchOpen, setSearchOpen] = useState(false)

    useEffect(() => {
        const query = searchQuery.trim();
        const timer = setTimeout(async () => {
            if (!query) {
                setSearchResults([]);
                setSearchOpen(false);
                return;
            }
            try {
                const res = await apiClient.get('/users/search', {
                    params: { q: query, currentUserId: user?.email }
                });
                setSearchResults(res.data);
                setSearchOpen(true);
            } catch (err) {
                console.error(err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user?.email]);

    const handleFollowToggle = async (targetEmail, isFollowing) => {
        try {
            await apiClient.post('/users/follow', { followingEmail: targetEmail });
            toast.success(isFollowing ? 'Takipten çıkıldı' : 'Takip edildi ✨');
            setSearchResults((prev) =>
                prev.map((u) => (u.email === targetEmail ? { ...u, is_following: !isFollowing } : u))
            );
        } catch {
            toast.error('Takip işlemi başarısız');
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser()
        } catch {
            // Backend logout cevap vermezse bile frontend oturumunu temizlemek yeterli.
        } finally {
            clearStoredUser()
            navigate('/login')
        }
    }

    return (
        <AppBar
            position="static"
            sx={{
                bgcolor: '#0a0a0a', // Daha derin siyah
                boxShadow: 'none',
                borderBottom: '1px solid rgba(212, 175, 55, 0.15)' // Altın tonlu çok ince bir sınır
            }}
        >
            <Toolbar variant="dense" sx={{ gap: 1, px: { xs: 1, md: 2 }, minHeight: '48px' }}>

                {/* LOGO VE İSİM ALANI - Kintsugi Space Teması */}
                <Box
                    component={RouterLink}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        mr: 'auto'
                    }}
                >
                    <Box
                        component="img"
                        src="/Gildedlogo.png"
                        alt="Gilded"
                        sx={{
                            height: 45,
                            width: 'auto'
                        }}
                    />
                </Box>

                {/* MENÜ BUTONLARI */}
                {user ? (
                    <>
                        {/* KULLANICI ARAMA (USER SEARCH BAR) */}
                        <Box sx={{ position: 'relative', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                            <TextField
                                size="small"
                                placeholder="Kullanıcı Ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                                slotProps={{
                                    input: {
                                        startAdornment: <SearchIcon sx={{ color: '#D4AF37', fontSize: '1.1rem', mr: 0.5 }} />
                                    }
                                }}
                                sx={{
                                    width: { sm: 160, md: 220 },
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        height: '32px',
                                        '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.2)' },
                                        '&:hover fieldset': { borderColor: '#D4AF37' },
                                        '&.Mui-focused fieldset': { borderColor: '#D4AF37' }
                                    }
                                }}
                            />

                            {/* Arama Açılır Menüsü */}
                            {searchOpen && (
                                <Paper
                                    sx={{
                                        position: 'absolute',
                                        top: '38px',
                                        left: 0,
                                        right: 0,
                                        minWidth: 260,
                                        bgcolor: '#111',
                                        border: '1px solid rgba(212, 175, 55, 0.3)',
                                        borderRadius: '12px',
                                        zIndex: 1300,
                                        maxHeight: 300,
                                        overflowY: 'auto',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.7)'
                                    }}
                                >
                                    {searchResults.length > 0 ? (
                                        <List size="small" disablePadding>
                                            {searchResults.map((searchedUser) => (
                                                <ListItem
                                                    key={searchedUser.email}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        py: 1,
                                                        px: 1.5,
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                >
                                                    <Box
                                                        onClick={() => {
                                                            navigate(`/profile?email=${searchedUser.email}`);
                                                            setSearchOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flex: 1 }}
                                                    >
                                                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#fb923c', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {searchedUser.ad?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                                                                {searchedUser.ad}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                                                                {searchedUser.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Button
                                                        size="small"
                                                        onClick={() => handleFollowToggle(searchedUser.email, searchedUser.is_following)}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            color: searchedUser.is_following ? '#aaa' : '#D4AF37',
                                                            borderColor: searchedUser.is_following ? 'rgba(255,255,255,0.2)' : 'rgba(212,175,55,0.4)',
                                                            textTransform: 'none',
                                                            minWidth: 'auto',
                                                            px: 1
                                                        }}
                                                        variant="outlined"
                                                    >
                                                        {searchedUser.is_following ? 'Takipten Çık' : 'Takip Et'}
                                                    </Button>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                                            Kullanıcı bulunamadı 🔍
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </Box>

                        {isAdminUser(user) && (
                            <Button
                                component={RouterLink}
                                to="/admin"
                                sx={{ color: '#FCD34D', fontWeight: 700, opacity: 0.8, '&:hover': { opacity: 1 } }}
                            >
                                Admin
                            </Button>
                        )}

                        {/* ONAR BUTONU */}
                        <Button
                            onClick={() => setPostModalOpen(true)}
                            variant="outlined"
                            size="small"
                            sx={{
                                color: '#D4AF37',
                                borderColor: 'rgba(212, 175, 55, 0.4)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                letterSpacing: '0.5px',
                                textTransform: 'none',
                                px: 1.8,
                                py: 0.4,
                                borderRadius: '16px',
                                background: 'linear-gradient(45deg, rgba(212,175,55,0.1), rgba(249,224,118,0.05))',
                                boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
                                '&:hover': {
                                    borderColor: '#D4AF37',
                                    background: 'linear-gradient(45deg, rgba(212,175,55,0.2), rgba(249,224,118,0.15))',
                                    boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
                                    color: '#FFF6D6'
                                }
                            }}
                        >
                            Onar ✨
                        </Button>

                        <Button
                            component={RouterLink}
                            to="/wisdom"
                            sx={{
                                color: '#D4AF37',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                '&:hover': {
                                    color: '#F9E076',
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            Bilgelik Panosu
                        </Button>

                        <Button
                            component={RouterLink}
                            to="/circles"
                            sx={{
                                color: '#94a3b8',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                '&:hover': {
                                    color: '#D4AF37',
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            Çemberler ⭕
                        </Button>

                        <Button
                            component={RouterLink}
                            to="/messages"
                            sx={{
                                color: '#94a3b8',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                '&:hover': {
                                    color: '#D4AF37',
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            Mesajlar
                        </Button>

                        {/* PROFİL KISMI */}
                        <Box
                            component={RouterLink}
                            to="/profile"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.2,
                                px: 2,
                                ml: 1,
                                borderLeft: '1px solid rgba(255,255,255,0.1)',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 24,
                                    height: 24,
                                    bgcolor: '#fb923c', // Pastel turuncu
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: '#0f172a', // Arka planla aynı lacivert (kontrast için)
                                    opacity: 0.9
                                }}
                            >
                                {user.ad?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{
                                color: '#94a3b8',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                display: { xs: 'none', md: 'block' }
                            }}>
                                {user.ad}
                            </Typography>
                        </Box>

                        <NotificationsMenu />

                        <IconButton onClick={toggleTheme} sx={{ ml: 1, fontSize: '1rem' }}>
                            {mode === 'dark' ? '☀️' : '🌙'}
                        </IconButton>

                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            size="small"
                            sx={{
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                fontWeight: 'bold',
                                ml: 1,
                                fontSize: '0.75rem',
                                '&:hover': {
                                    borderColor: '#ef4444',
                                    bgcolor: 'rgba(239, 68, 68, 0.05)'
                                }
                            }}
                        >
                            Çıkış
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            component={RouterLink}
                            to="/login"
                            sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem', '&:hover': { color: '#e2e8f0' } }}
                        >
                            Giriş Yap
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            size="small"
                            sx={{
                                bgcolor: '#D4AF37',
                                color: '#000',
                                fontWeight: 700,
                                borderRadius: '6px',
                                px: 2,
                                fontSize: '0.8rem',
                                textTransform: 'none',
                                opacity: 0.9,
                                '&:hover': { bgcolor: '#F9E076', opacity: 1 }
                            }}
                        >
                            Kayıt Ol
                        </Button>
                    </>
                )}
            </Toolbar>
            <PostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
        </AppBar>
    )
}

export default Navbar
