import { Avatar, Box, Card, CardContent, Grid, Rating, Typography } from '@mui/material'
import { FormatQuote as FormatQuoteIcon } from '@mui/icons-material'

const TESTIMONIALS = [
  {
    name: 'Elif Y.',
    role: 'Tasarımcı & Kintsugi Gezgini',
    comment: 'Tükenmişlik sendromu yaşadığım en zor dönemde Gilded ile tanıştım. Kırılganlıklarımı paylaşmak ve başkalarının da benzer yollardan geçtiğini görmek beni ayağa kaldırdı.',
    rating: 5,
    stitches: '142 Altın Dikiş'
  },
  {
    name: 'Can K.',
    role: 'Yazılım Mühendisi',
    comment: 'Sosyal medyanın mükemmeliyetçilik baskısından kaçıp buraya sığındım. Kusurları öven ve altınla birleştiren bu felsefe zihnimi inanılmaz berraklaştırdı.',
    rating: 5,
    stitches: '98 Altın Dikiş'
  },
  {
    name: 'Merve S.',
    role: 'Psikolojik Danışman',
    comment: 'Danışanlarıma da önerdiğim şefkat dolu bir alan. Günlük meditasyonlar ve bilgelik sözleri sabah rutinimin vazgeçilmez bir parçası haline geldi.',
    rating: 5,
    stitches: '230 Altın Dikiş'
  }
]

export default function TestimonialsSection() {
  return (
    <Box sx={{ my: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="overline"
          sx={{ color: '#D4AF37', letterSpacing: 2, fontWeight: 700 }}
        >
          TOPLULUK DENEYİMLERİ
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            color: '#FFF6D6',
            mt: 0.5
          }}
        >
          Altınla İyileşen Yolcularımızın Yorumları
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {TESTIMONIALS.map((item, idx) => (
          <Grid size={{ xs: 12, md: 4 }} key={idx}>
            <Card
              sx={{
                background: 'rgba(20, 20, 20, 0.75)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 3,
                height: '100%',
                p: 2,
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(212,175,55,0.2)',
                  borderColor: '#D4AF37'
                }
              }}
            >
              <FormatQuoteIcon
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: 'rgba(212,175,55,0.2)',
                  fontSize: 40
                }}
              />
              <CardContent>
                <Rating value={item.rating} readOnly size="small" sx={{ mb: 1.5, color: '#D4AF37' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.85)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    mb: 3,
                    minHeight: 70
                  }}
                >
                  &ldquo;{item.comment}&rdquo;
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#D4AF37',
                      color: '#000',
                      fontWeight: 700,
                      width: 40,
                      height: 40
                    }}
                  >
                    {item.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFF6D6', fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(212,175,55,0.8)' }}>
                      {item.role} • {item.stitches}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
