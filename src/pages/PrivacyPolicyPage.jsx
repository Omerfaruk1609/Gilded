import { Box, Container, Divider, Typography } from '@mui/material'
import { Shield as ShieldIcon } from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function PrivacyPolicyPage() {
  useDocumentTitle('Gizlilik Politikası', 'Gilded kullanıcı verilerinin korunması, gizlilik ve güvenlik ilkeleri.')

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
          <ShieldIcon sx={{ color: '#D4AF37', fontSize: 32 }} />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: '#D4AF37',
              fontWeight: 700
            }}
          >
            Gizlilik Politikası
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 3 }}>
          Son Güncelleme: 21 Ağustos 2026
        </Typography>

        <Divider sx={{ borderColor: 'rgba(212,175,55,0.2)', mb: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.8 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              1. Toplanan Bilgiler
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Gilded platformuna kaydolurken sağladığınız kullanıcı adı, e-posta adresi ve isteğe bağlı profil bilgileriniz güvenli bir şekilde saklanır. Parolalarınız tek yönlü kriptografik algoritmalarla şifrelenir ve tarafımızca asla açık metin olarak görülemez.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              2. Bilgilerin Kullanımı ve Amacı
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Toplanan veriler yalnızca size kişiselleştirilmiş bir Kintsugi topluluk deneyimi sunmak, bildirimleri iletmek ve güvenliğinizi sağlamak amacıyla kullanılır. Bilgileriniz hiçbir üçüncü taraf reklam şirketi ile paylaşılmaz veya satılmaz.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              3. Anonim Paylaşım ve Kontrol
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Kırılma ve onarım hikayelerinizi dilediğiniz takdirde anonim modda yayınlayabilirsiniz. Kullanıcılar hesaplarını ve paylaşımlarını diledikleri zaman profil ayarları üzerinden silebilir veya güncelleyebilir.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: '#FFF6D6', mb: 1, fontWeight: 600 }}>
              4. İletişim ve Haklarınız
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Gizlilik politikamız veya kişisel verilerinizin işlenmesi ile ilgili her türlü soru ve talebiniz için destek ekibimizle iletişime geçebilirsiniz.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}
