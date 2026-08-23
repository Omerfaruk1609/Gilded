import { 
  AppBar, Box, Button, Toolbar, Typography, Avatar, IconButton, TextField, Paper, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer, Divider 
} from '@mui/material'
import { 
  Search as SearchIcon, 
  Menu as MenuIcon, 
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  SelfImprovement as MeditationIcon,
  Forum as ForumIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon
} from '@mui/icons-material'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { clearStoredUser, getStoredUser, isAdminUser, logoutUser } from '../../services/auth'
import NotificationsMenu from './NotificationsMenu'
import PostModal from '../feed/PostModal'
import MeditationModal from './MeditationModal'
import apiClient from '../../services/apiClient'
import toast from 'react-hot-toast'

function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const user = getStoredUser()
    const { mode, toggleTheme } = useContext(ThemeContext)
    const [postModalOpen, setPostModalOpen] = useState(false)
    const [meditationOpen, setMeditationOpen] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchOpen, setSearchOpen] = useState(false)

    // Sayfa değiştiğinde Drawer'ı otomatik kapat
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

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
            position="sticky"
            sx={{
                bgcolor: '#0a0a0a',
                boxShadow: 'none',
                borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                top: 0,
                zIndex: 1100,
                width: '100%'
            }}
        >
            <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 2, md: 3 }, minHeight: { xs: '54px', sm: '60px' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* LOGO ALANI */}
                <Box
                    component={RouterLink}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none'
                    }}
                >
                    <Box
                        component="img"
                        src="/Gildedlogo.png"
                        alt="Gilded"
                        sx={{
                            height: { xs: 36, sm: 42 },
                            width: 'auto'
                        }}
                    />
                </Box>

                {/* MASAÜSTÜ MENÜ (md ve üzeri) */}
                {user ? (
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                        {/* KULLANICI ARAMA */}
                        <Box sx={{ position: 'relative', mr: 1 }}>
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
                                    width: { md: 170, lg: 220 },
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        height: '34px',
                                        '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.2)' },
                                        '&:hover fieldset': { borderColor: '#D4AF37' },
                                        '&.Mui-focused fieldset': { borderColor: '#D4AF37' }
                                    }
                                }}
                            />

                            {searchOpen && (
                                <Paper
                                    sx={{
                                        position: 'absolute',
                                        top: '40px',
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

                        <Button component={RouterLink} to="/wisdom" sx={{ color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem', textTransform: 'none', '&:hover': { color: '#F9E076', bgcolor: 'transparent' } }}>
                            Bilgelik
                        </Button>

                        <Button component={RouterLink} to="/circles" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem', textTransform: 'none', '&:hover': { color: '#D4AF37', bgcolor: 'transparent' } }}>
                            Çemberler ⭕
                        </Button>

                        <Button onClick={() => setMeditationOpen(true)} sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem', textTransform: 'none', '&:hover': { color: '#4ADE80', bgcolor: 'transparent' } }}>
                            Meditasyon 🧘
                        </Button>

                        <Button component={RouterLink} to="/messages" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem', textTransform: 'none', '&:hover': { color: '#D4AF37', bgcolor: 'transparent' } }}>
                            Mesajlar
                        </Button>

                        {isAdminUser(user) && (
                            <Button component={RouterLink} to="/admin" sx={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.85rem', textTransform: 'none', opacity: 0.9, '&:hover': { opacity: 1 } }}>
                                Admin
                            </Button>
                        )}

                        {/* PROFİL */}
                        <Box component={RouterLink} to="/profile" sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, borderLeft: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                            <Avatar sx={{ width: 26, height: 26, bgcolor: '#fb923c', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f172a' }}>
                                {user.ad?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                                {user.ad?.split(' ')[0]}
                            </Typography>
                        </Box>

                        <NotificationsMenu />

                        <IconButton onClick={toggleTheme} size="small" sx={{ ml: 0.5, color: '#D4AF37' }}>
                            {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
                        </IconButton>

                        <Button variant="outlined" onClick={handleLogout} size="small" sx={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 'bold', ml: 1, fontSize: '0.75rem', textTransform: 'none', '&:hover': { borderColor: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}>
                            Çıkış
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                        <Button component={RouterLink} to="/login" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem', '&:hover': { color: '#e2e8f0' } }}>
                            Giriş Yap
                        </Button>
                        <Button component={RouterLink} to="/register" variant="contained" size="small" sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 700, borderRadius: '8px', px: 2, fontSize: '0.85rem', textTransform: 'none', '&:hover': { bgcolor: '#F9E076' } }}>
                            Kayıt Ol
                        </Button>
                    </Box>
                )}

                {/* MOBİL SAĞ MENÜ BUTONLARI (xs & sm) */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
                    {user ? (
                        <>
                            <Button
                                onClick={() => setPostModalOpen(true)}
                                variant="contained"
                                size="small"
                                sx={{
                                    bgcolor: '#D4AF37',
                                    color: '#000',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    py: 0.3,
                                    px: 1.2,
                                    borderRadius: '12px',
                                    textTransform: 'none'
                                }}
                            >
                                Onar ✨
                            </Button>
                            <NotificationsMenu />
                            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#D4AF37', p: 0.8 }}>
                                <MenuIcon />
                            </IconButton>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button component={RouterLink} to="/login" size="small" sx={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'none' }}>
                                Giriş
                            </Button>
                            <Button component={RouterLink} to="/register" size="small" variant="contained" sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}>
                                Kayıt Ol
                            </Button>
                        </Box>
                    )}
                </Box>
            </Toolbar>

            {/* MOBİL YAN AÇILIR ÇEKMECE (DRAWER) */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        bgcolor: '#0f0f0f',
                        color: '#fff',
                        borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }
                }}
            >
                <Box>
                    {/* Çekmece Üst Başlık & Kapat Butonu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#fb923c', color: '#000', fontWeight: 'bold' }}>
                                {user?.ad?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                                    {user?.ad}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                                    {user?.role === 'ADMIN' ? 'Yönetici' : user?.role === 'BILGE' ? 'Bilge' : 'Topluluk Üyesi'}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#888' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                    {/* Menü Linkleri */}
                    <List sx={{ p: 0 }}>
                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton component={RouterLink} to="/wisdom" sx={{ borderRadius: '12px' }}>
                                <ListItemIcon sx={{ color: '#D4AF37', minWidth: 38 }}><AutoAwesomeIcon /></ListItemIcon>
                                <ListItemText primary="Bilgelik Panosu" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton component={RouterLink} to="/circles" sx={{ borderRadius: '12px' }}>
                                <ListItemIcon sx={{ color: '#D4AF37', minWidth: 38 }}><ForumIcon /></ListItemIcon>
                                <ListItemText primary="Canlı Çemberler ⭕" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton onClick={() => { setMeditationOpen(true); setDrawerOpen(false); }} sx={{ borderRadius: '12px' }}>
                                <ListItemIcon sx={{ color: '#4ADE80', minWidth: 38 }}><MeditationIcon /></ListItemIcon>
                                <ListItemText primary="Meditasyon & Nefes 🧘" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton component={RouterLink} to="/messages" sx={{ borderRadius: '12px' }}>
                                <ListItemIcon sx={{ color: '#D4AF37', minWidth: 38 }}><ChatIcon /></ListItemIcon>
                                <ListItemText primary="Mesajlar" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding sx={{ mb: 1 }}>
                            <ListItemButton component={RouterLink} to="/profile" sx={{ borderRadius: '12px' }}>
                                <ListItemIcon sx={{ color: '#fb923c', minWidth: 38 }}><PersonIcon /></ListItemIcon>
                                <ListItemText primary="Profilim" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>

                        {isAdminUser(user) && (
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <ListItemButton component={RouterLink} to="/admin" sx={{ borderRadius: '12px', bgcolor: 'rgba(212,175,55,0.08)' }}>
                                    <ListItemIcon sx={{ color: '#FCD34D', minWidth: 38 }}><ShieldIcon /></ListItemIcon>
                                    <ListItemText primary="Yönetim Paneli" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 700, color: '#FCD34D' }} />
                                </ListItemButton>
                            </ListItem>
                        )}
                    </List>
                </Box>

                {/* Çekmece Alt Kısım: Tema & Çıkış */}
                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button
                        fullWidth
                        startIcon={mode === 'dark' ? <LightIcon /> : <DarkIcon />}
                        onClick={toggleTheme}
                        sx={{ color: '#94a3b8', justifyContent: 'flex-start', mb: 1.5, textTransform: 'none' }}
                    >
                        {mode === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
                    >
                        Güvenli Çıkış Yap
                    </Button>
                </Box>
            </Drawer>

            <PostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
            <MeditationModal open={meditationOpen} onClose={() => setMeditationOpen(false)} />
        </AppBar>
    )
}

export default Navbar
