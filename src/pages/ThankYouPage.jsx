import { Box, Button, Container, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import {
  CheckCircle as CheckCircleOutlineIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ThankYouPage() {
  useDocumentTitle('Teşekkürler ✨', 'Gilded topluluğuna katkınız ve Kintsugi yolculuğunuz için teşekkür ederiz.')

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(15,15,15,0.98))',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.2)'
        }}
      >
        <CheckCircleOutlineIcon
          sx={{
            fontSize: 70,
            color: '#D4AF37',
            mb: 2,
            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.5))'
          }}
        />

        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #AA7C11 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Teşekkür Ederiz ✨
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            mb: 4,
            lineHeight: 1.8
          }}
        >
          Hikayeniz veya geri bildiriminiz başarıyla alındı. Paylaştığınız her kırılma ve onarım anı, topluluğumuzdaki diğer yolcular için birer altın ışığa dönüşüyor.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': { bgcolor: '#b89428' }
            }}
          >
            Akışa Dön
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
              py: 1,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#FFF6D6',
                backgroundColor: 'rgba(212,175,55,0.1)'
              }
            }}
          >
            Galeriyi Gez
          </Button>
        </Box>
      </Box>
    </Container>
  )
}
