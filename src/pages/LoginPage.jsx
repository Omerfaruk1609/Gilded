import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Container, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import toast from 'react-hot-toast';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('E-posta ve şifre gerekli');
    
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Giriş başarılı! Hoş geldin.');
      window.location.href = '/';
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0a'
      }}
    >
      {/* Background Image with Overlay */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/kintsugi_login.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4)',
          zIndex: 1
        }}
      />

      <Container maxWidth="lg" sx={{ zIndex: 2, position: 'relative' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 6
          }}
        >
          {/* Brand Section */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontFamily: "'Playfair Display', serif", 
                fontWeight: 800,
                color: '#fff',
                fontSize: { xs: '3rem', md: '4.5rem' },
                mb: 2,
                lineHeight: 1.1,
                background: 'linear-gradient(45deg, #D4AF37, #F9E076)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Kırıklardan Doğan Güç
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 300,
                maxWidth: '500px',
                lineHeight: 1.6,
                letterSpacing: '0.5px'
              }}
            >
              Başarısızlıklarını paylaş, topluluğun desteğiyle onları altına dönüştür.
            </Typography>
          </Box>

          {/* Login Section */}
          <Paper 
            elevation={0}
            component="form"
            onSubmit={handleLogin}
            sx={{ 
              p: 4, 
              width: '100%', 
              maxWidth: 400,
              bgcolor: 'rgba(26, 26, 26, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 700, 
                color: '#fff',
                textAlign: 'center'
              }}
            >
              Giriş Yap
            </Typography>
            
            <TextField 
              fullWidth 
              label="E-posta" 
              margin="normal" 
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.5)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
              }}
            />
            <TextField 
              fullWidth 
              label="Şifre" 
              type="password" 
              margin="normal" 
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.5)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
              }}
            />
            
            <Button 
              fullWidth 
              variant="contained" 
              type="submit"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                bgcolor: '#D4AF37',
                color: '#000',
                fontWeight: 800,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#F9E076' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Giriş Yap'}
            </Button>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.1)' } }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>HESABIN YOK MU?</Typography>
            </Divider>

            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/register')}
              sx={{ 
                color: '#D4AF37', 
                borderColor: 'rgba(212, 175, 55, 0.3)',
                fontWeight: 600,
                '&:hover': { borderColor: '#D4AF37', bgcolor: 'rgba(212, 175, 55, 0.05)' }
              }}
            >
              Kayıt Ol
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
