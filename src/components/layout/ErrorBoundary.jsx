import { Component } from 'react'
import { Box, Typography, Button, Container } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kintsugi Error Boundary yakaladı:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: '#0a0a0a',
            color: '#fff',
            p: 3
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
              🏺✨
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Playfair Display", serif',
                color: '#D4AF37',
                fontWeight: 700,
                mb: 2
              }}
            >
              Kırık Bir Parça Fark Edildi
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.6 }}>
              Kintsugi felsefesinde her kırık onarılabilir. Bu sayfada beklenmeyen bir durum oluştu, lütfen sayfayı yenileyiniz.
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                bgcolor: '#D4AF37',
                color: '#000',
                fontWeight: 700,
                px: 4,
                py: 1.2,
                borderRadius: 3,
                '&:hover': { bgcolor: '#b89428' }
              }}
            >
              Yeniden Başlat & Onar
            </Button>
          </Container>
        </Box>
      )
    }

    return this.props.children
  }
}
