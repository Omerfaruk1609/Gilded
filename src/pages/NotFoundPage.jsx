import { Box, Button, Container, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import {
  Home as HomeIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('404 - Sayfa Bulunamadı', 'Aradığınız sayfa kırılmış veya taşınmış olabilir. Kintsugi felsefesiyle her kırık altınla onarılabilir.')

  return (
    <Container maxWidth="md" sx={{ py: 12, textAlign: 'center' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(15,15,15,0.98))',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 4,
          p: { xs: 4, md: 8 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 900,
            fontSize: { xs: '5rem', md: '8rem' },
            background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #AA7C11 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 2,
            mb: 1
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: '#D4AF37',
            mb: 2,
            fontWeight: 600
          }}
        >
          Kırık Bir Bağlantı...
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.75)',
            maxWidth: 600,
            mx: 'auto',
            mb: 5,
            lineHeight: 1.8,
            fontSize: '1.05rem'
          }}
        >
          Aradığınız sayfa kaybolmuş veya kırılmış olabilir. Kintsugi felsefesinde kırılan hiçbir şey değersizleşmez; aksine altınla birleştiğinde daha eşsiz hale gelir. Yolunuzu yeniden bulmak için aşağıdaki altın yollardan birini seçebilirsiniz.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            startIcon={<HomeIcon />}
            sx={{
              backgroundColor: '#D4AF37',
              color: '#000',
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#b89428',
                boxShadow: '0 0 15px rgba(212,175,55,0.4)'
              }
            }}
          >
            Ana Sayfaya Dön
          </Button>

          <Button
            component={RouterLink}
            to="/galeri"
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            sx={{
              borderColor: '#D4AF37',
              color: '#D4AF37',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#FFF6D6',
                backgroundColor: 'rgba(212,175,55,0.1)'
              }
            }}
          >
            Altın Galeriyi Keşfet
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
