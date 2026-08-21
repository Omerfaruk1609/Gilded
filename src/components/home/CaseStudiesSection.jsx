import { Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material'
import {
  AutoAwesome as AutoAwesomeIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'

const CASE_STUDIES = [
  {
    title: 'Kariyer Kaybından Yeni Bir Atölyeye',
    tag: 'Dönüşüm Hikayesi',
    summary: '10 yıllık kurumsal kariyerinin ani bitişiyle sarsılan Ahmet, kırılma anını nasıl kendi seramik stüdyosuna ve altın dikişlerine dönüştürdü?',
    impact: '%100 Yeniden İnşa',
    link: '/galeri'
  },
  {
    title: 'Zorlu Bir Ayrılıktan Öz-Şefkate',
    tag: 'Duygusal İyileşme',
    summary: 'Uzun süreli bir ilişkinin ardından yaşanan boşluk hissi, Gilded halkalarında paylaşılan deneyimler ve meditasyon rutiniyle şefkate evrildi.',
    impact: 'İçsel Barış',
    link: '/galeri'
  }
]

export default function CaseStudiesSection() {
  return (
    <Box sx={{ my: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#D4AF37', letterSpacing: 2, fontWeight: 700 }}>
            VAKA ÇALIŞMALARI & DÖNÜŞÜMLER
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              color: '#FFF6D6'
            }}
          >
            Kintsugi Başarı Hikayeleri
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/galeri"
          endIcon={<ArrowForwardIcon />}
          sx={{ color: '#D4AF37', fontWeight: 600, '&:hover': { color: '#FFF6D6' } }}
        >
          Tüm Hikayeleri Gör
        </Button>
      </Box>

      <Grid container spacing={3}>
        {CASE_STUDIES.map((item, idx) => (
          <Grid size={{ xs: 12, md: 6 }} key={idx}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(25,25,25,0.9), rgba(18,18,18,0.95))',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 2.5,
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#D4AF37',
                  boxShadow: '0 8px 25px rgba(212,175,55,0.2)',
                  transform: 'translateY(-3px)'
                }
              }}
            >
              <CardContent sx={{ p: 0, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={item.tag}
                    size="small"
                    icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#D4AF37' }} />}
                    sx={{
                      bgcolor: 'rgba(212,175,55,0.15)',
                      color: '#FFF6D6',
                      borderColor: 'rgba(212,175,55,0.4)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      fontWeight: 600
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    {item.impact}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: '#FFF6D6', fontWeight: 700, mb: 1 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {item.summary}
                </Typography>
              </CardContent>
              <Box>
                <Button
                  component={RouterLink}
                  to={item.link}
                  size="small"
                  sx={{ color: '#D4AF37', p: 0, fontWeight: 600, textTransform: 'none' }}
                >
                  Hikayenin Tamamını Oku →
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
