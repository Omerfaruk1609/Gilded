import { Avatar, Box, Button, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import {
  AutoAwesome as AutoAwesomeIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Security as SecurityIcon,
  Groups as GroupsIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

const TEAM_MEMBERS = [
  {
    name: 'Ömer Faruk Kara',
    role: 'Kurucu & Baş Geliştirici (Lead Developer)',
    bio: 'Modern web teknolojileri ve Kintsugi felsefesini dijital topluluk deneyiminde birleştiren mimar.',
    avatar: '/Gildedlogo.png',
    github: 'https://github.com/Omerfaruk1609'
  },
  {
    name: 'Gilded Bilgelik Konseyi',
    role: 'Topluluk Moderasyonu & Rehberlik',
    bio: 'Topluluğun şefkat, saygı ve güven dolu kalmasını sağlayan gönüllü Kintsugi yolcuları.',
    avatar: '/Gildedlogo.png',
    github: 'https://github.com/Omerfaruk1609/Gilded'
  }
]

const VALUES = [
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 36, color: '#D4AF37' }} />,
    title: 'Kusurları Kucaklamak',
    description: 'Yara izlerimiz zayıflık değil; yaşadığımızın, atlattığımızın ve büyüdüğümüzün kanıtıdır.'
  },
  {
    icon: <FavoriteBorderIcon sx={{ fontSize: 36, color: '#D4AF37' }} />,
    title: 'Koşulsuz Şefkat',
    description: 'Yargılamadan dinlemek ve paylaşılan her acıya altın değerinde bir ilgiyle yaklaşmak.'
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 36, color: '#D4AF37' }} />,
    title: 'Güvenli & Mahrem Alan',
    description: 'Verileriniz ve hisleriniz bizimle güvende. Dilediğinizde anonim ve tamamen özgürsünüz.'
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 36, color: '#D4AF37' }} />,
    title: 'Kolektif İyileşme',
    description: 'Birimizin onarımı, diğerimizin ışığı olur. Birlikte daha güçlüyüz.'
  }
]

export default function AboutPage() {
  useDocumentTitle('Hakkımızda & Ekibimiz', 'Gilded nedir, Kintsugi felsefesiyle nasıl ortaya çıktı ve arkasındaki ekip kimdir?')

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography
          variant="overline"
          sx={{ color: '#D4AF37', letterSpacing: 3, fontWeight: 700, display: 'block', mb: 1 }}
        >
          HİKAYEMİZ & VİZYONUMUZ
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #AA7C11 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3
          }}
        >
          Kırıklardan Doğan Zarafet: Gilded
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 750,
            mx: 'auto',
            fontSize: '1.1rem',
            lineHeight: 1.8
          }}
        >
          Gilded; 15. yüzyıl Japon sanatı <strong>Kintsugi</strong> (altınla birleştirme) anlayışını modern çağın dijital insanına taşıyan özgün bir farkındalık ve paylaşım alanıdır. Hayatın getirdiği kırılmaları gizlemek yerine, onları altın tozlarıyla işleyip hikayemizin en parıltılı parçası yapmayı hedefliyoruz.
        </Typography>
      </Box>

      {/* Values Grid */}
      <Box sx={{ mb: 10 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: '#D4AF37',
            textAlign: 'center',
            mb: 4,
            fontWeight: 700
          }}
        >
          Değerlerimiz
        </Typography>
        <Grid container spacing={3}>
          {VALUES.map((val, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Card
                sx={{
                  background: 'rgba(25, 25, 25, 0.7)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 3,
                  height: '100%',
                  p: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(212,175,55,0.2)',
                    borderColor: '#D4AF37'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{val.icon}</Box>
                  <Typography variant="h6" sx={{ color: '#FFF6D6', fontWeight: 600, mb: 1 }}>
                    {val.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                    {val.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Team Section */}
      <Box sx={{ mb: 8 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: '#D4AF37',
            textAlign: 'center',
            mb: 4,
            fontWeight: 700
          }}
        >
          Ekibimiz & Geliştiriciler
        </Typography>
        <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
          {TEAM_MEMBERS.map((member, idx) => (
            <Grid size={{ xs: 12, md: 5 }} key={idx}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(30,30,30,0.8), rgba(20,20,20,0.9))',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: 4,
                  p: 3,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Avatar
                  src={member.avatar}
                  alt={member.name}
                  sx={{
                    width: 90,
                    height: 90,
                    border: '2px solid #D4AF37',
                    boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                    bgcolor: '#111'
                  }}
                />
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h6" sx={{ color: '#FFF6D6', fontWeight: 700 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, lineHeight: 1.5 }}>
                    {member.bio}
                  </Typography>
                  {member.github && (
                    <Button
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      startIcon={<GitHubIcon />}
                      sx={{ color: '#D4AF37', textTransform: 'none', px: 0, '&:hover': { color: '#fff' } }}
                    >
                      GitHub Profili
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA Box */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(20,20,20,0.9) 100%)',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" sx={{ color: '#FFF6D6', fontWeight: 700, mb: 1 }}>
          Siz de Kendi Altın Dikişinizi Atmaya Hazır mısınız?
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 3, maxWidth: 500, mx: 'auto' }}>
          Topluluğumuza katılın, hikayenizi paylaşın veya bir başkasının kırılan parçalarına ışık olun.
        </Typography>
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          sx={{
            bgcolor: '#D4AF37',
            color: '#000',
            fontWeight: 700,
            px: 4,
            py: 1.2,
            borderRadius: 2,
            '&:hover': { bgcolor: '#b89428' }
          }}
        >
          Hemen Katıl ✨
        </Button>
      </Box>
    </Container>
  )
}
