import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Container, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CaseStudiesSection from '../components/home/CaseStudiesSection';
import TestimonialsSection from '../components/home/TestimonialsSection';

function RegisterPage() {
  useDocumentTitle('Kayıt Ol', 'Gilded Kintsugi topluluğuna katılın, kırıklarınızı altınla onarmaya başlayın.');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ad, setAd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !ad) return toast.error('Tüm alanlar zorunludur');
    
    setLoading(true);
    try {
      await registerUser(email, password, ad);
      toast.success('Kayıt başarılı! Şimdi giriş yapabilirsin.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#050505', overflowX: 'hidden' }}>
      {/* 1. ÜST HERO & KAYIT FORMU BÖLÜMÜ */}
      <Box 
        sx={{ 
          minHeight: '88vh', 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          py: { xs: 6, md: 8 },
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, rgba(5,5,5,1) 70%)'
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/register_bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.35)',
            zIndex: 1
          }}
        />

        <Container maxWidth="lg" sx={{ zIndex: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: { xs: 4, md: 6 } }}>
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontFamily: "'Playfair Display', serif", 
                  fontWeight: 800,
                  color: '#fff',
                  fontSize: { xs: '2.8rem', sm: '3.5rem', md: '4.2rem' },
                  mb: 2,
                  background: 'linear-gradient(45deg, #D4AF37, #F9E076)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.15
                }}
              >
                Yolculuğa Başla ✨
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 300, maxWidth: '520px', lineHeight: 1.6, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                Topluluğumuza katıl, kırıklarını altın dikişlerle sanat eserine dönüştür ve benzer yollardan geçen ruhlarla bağ kur.
              </Typography>
            </Box>

            <Paper 
              elevation={0}
              component="form"
              onSubmit={handleRegister}
              sx={{ 
                p: { xs: 3, sm: 4 }, 
                width: '100%', 
                maxWidth: 420,
                bgcolor: 'rgba(20, 20, 20, 0.85)',
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.1)'
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#FFF6D6', textAlign: 'center', fontFamily: "'Playfair Display', serif" }}>
                Yeni Hesap Oluştur
              </Typography>
              
              <TextField 
                fullWidth label="Ad Soyad" margin="normal" variant="outlined"
                value={ad} onChange={(e) => setAd(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' } }}
              />
              <TextField 
                fullWidth label="E-posta" margin="normal" variant="outlined"
                value={email} onChange={(e) => setEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' } }}
              />
              <TextField 
                fullWidth label="Şifre" type="password" margin="normal" variant="outlined"
                value={password} onChange={(e) => setPassword(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' } }}
              />
              
              <Button 
                fullWidth variant="contained" type="submit" disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#D4AF37', color: '#000', fontWeight: 800, borderRadius: '12px', fontSize: '1rem', '&:hover': { bgcolor: '#F9E076' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Aramıza Katıl ✨'}
              </Button>

              <Divider sx={{ my: 2.5, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.1)' } }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: 1 }}>ZATEN HESABIN VAR MI?</Typography>
              </Divider>

              <Button 
                fullWidth variant="outlined" onClick={() => navigate('/login')}
                sx={{ color: '#D4AF37', borderColor: 'rgba(212, 175, 55, 0.35)', fontWeight: 600, borderRadius: '12px', py: 1.2, textTransform: 'none', '&:hover': { borderColor: '#D4AF37', bgcolor: 'rgba(212, 175, 55, 0.08)' } }}
              >
                Giriş Yap
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* 2. VAKA ÇALIŞMALARI & DÖNÜŞÜM HİKAYELERİ */}
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 2 }}>
        <CaseStudiesSection />
      </Container>

      {/* 3. TOPLULUK DENEYİMLERİ & YORUMLAR */}
      <Container maxWidth="lg" sx={{ pb: 10, position: 'relative', zIndex: 2 }}>
        <TestimonialsSection />
      </Container>
    </Box>
  );
}

export default RegisterPage;
