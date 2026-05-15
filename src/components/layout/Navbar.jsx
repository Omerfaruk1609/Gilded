import { AppBar, Box, Button, Toolbar, Typography, Avatar, IconButton } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { clearStoredUser, getStoredUser, isAdminUser, logoutUser } from '../../services/auth'
import NotificationsMenu from './NotificationsMenu'

function Navbar() {
    const navigate = useNavigate()
    const user = getStoredUser()
    const { mode, toggleTheme } = useContext(ThemeContext)

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
                        alt="Kintsugi Space"
                        sx={{
                            height: 45,
                            width: 'auto'
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            lineHeight: 1,
                            background: 'linear-gradient(45deg, #ffd700, #ff8c00)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.1rem' // Boyut küçültüldü
                        }}
                    >
                    </Typography>
                </Box>

                {/* MENÜ BUTONLARI - Soluk Gri Tonları */}
                {user ? (
                    <>



                        <Button
                            component={RouterLink}
                            to="/hall-of-fame"
                            sx={{ color: '#D4AF37', fontWeight: 600, opacity: 0.9, '&:hover': { opacity: 1, textShadow: '0 0 8px rgba(212,175,55,0.5)' } }}
                        >
                            Galeri
                        </Button>

                        {isAdminUser(user) && (
                            <Button
                                component={RouterLink}
                                to="/admin"
                                sx={{ color: '#FCD34D', fontWeight: 700, opacity: 0.8, '&:hover': { opacity: 1 } }}
                            >
                                Admin
                            </Button>
                        )}

                        <Button
                            component={RouterLink}
                            to="/galeri"
                            sx={{
                                color: '#94a3b8',
                                fontWeight: 500,
                                fontSize: '0.95rem',
                                letterSpacing: '0.5px',
                                position: 'relative',
                                '&:hover': {
                                    color: '#D4AF37',
                                    backgroundColor: 'transparent',
                                    '&::after': { width: '100%' }
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: 2,
                                    left: 0,
                                    width: '0%',
                                    height: '2px',
                                    backgroundColor: '#D4AF37',
                                    transition: 'width 0.3s ease'
                                }
                            }}
                        >
                            Galeri
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
        </AppBar>
    )
}

export default Navbar
