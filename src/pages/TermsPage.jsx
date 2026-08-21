import { Box, Container, Divider, Typography } from '@mui/material'
import { Gavel as GavelIcon } from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function TermsPage() {
  useDocumentTitle('Kullanım Koşulları', 'Gilded platformu topluluk kuralları ve kullanım şartları.')

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box
        sx={{
          background: 'rgba(20, 20, 20, 0.85)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 4,
          p: { xs: 3, md: 6 },
          color: '#fff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <GavelIcon sx={{ color: '#D4AF37', fontSize: 32 }} />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: '#D4AF37',
              fontWeight: 700
            }}
          >
            Kullanım Koşulları
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 3 }}>
          Son Güncelleme: 21 Ağustos 2026
        </Typography>

        <Divider sx={{ borderColor: 'rgba(212,175,55,0.2)', mb: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.8 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              1. Topluluk İlkeleri ve Saygı
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Gilded, her bireyin hassas deneyimlerini paylaştığı güvenli bir alandır. Nefret söylemi, zorbalık, ayrımcılık ve aşağılayıcı yorumlar kesinlikle yasaktır ve hesapların askıya alınmasına neden olur.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              2. İçerik Sorumluluğu
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Platformda paylaşılan içeriklerin telif hakları yazara aittir. Kullanıcılar kendilerine ait olmayan veya telif hakkı ihlali oluşturan materyalleri paylaşmamayı taahhüt eder.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              3. Medikal & Psikolojik Tavsiye Beyanı
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Gilded üzerindeki içerikler ve meditasyon araçları profesyonel psikiyatrik veya tıbbi teşhis/tedavi yerine geçmez. Acil durumlarda lütfen yetkili sağlık profesyonellerine başvurunuz.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
