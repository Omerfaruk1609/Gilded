import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Help as HelpOutlineIcon
} from '@mui/icons-material'
import useDocumentTitle from '../hooks/useDocumentTitle'

const FAQ_LIST = [
  {
    id: 'faq-1',
    question: 'Kintsugi felsefesi nedir ve Gilded platformunda nasıl uygulanır?',
    answer: 'Kintsugi, kırılan seramik eşyaların altın tozu ve reçine ile onarılarak eskisinden daha değerli hale getirildiği kadim bir Japon sanatıdır. Gilded topluluğunda bu felsefeyi insan ruhuna ve yaşam deneyimlerine uyguluyoruz; yaşadığımız zorlukları, kırılma anlarını gizlemek yerine paylaşarak altın dikişlerle onarıyor ve güçleniyoruz.'
  },
  {
    id: 'faq-2',
    question: 'Altın Dikiş (Kintsugi Points) ve Işıltı sistemi nasıl çalışır?',
    answer: 'Toplulukta paylaştığınız ilham verici hikayeler, diğer üyelere verdiğiniz destekleyici yorumlar ve günlük meditasyon/farkındalık aktiviteleriniz size "Altın Dikiş" puanları kazandırır. Bu puanlar profilinizde Kintsugi Ustalık seviyenizi artırır ve Galeri (Hall of Fame) vitrininde yer almanızı sağlar.'
  },
  {
    id: 'faq-3',
    question: 'Paylaştığım hikayeler ve verilerim ne kadar gizli ve güvende?',
    answer: 'Gilded olarak kullanıcı gizliliğine en yüksek önceliği veriyoruz. Parolalarınız tek yönlü bcrypt ile şifrelenir, oturumlar JWT güvencesiyle korunur ve isterseniz paylaşımlarınızı takma adla (anonim) yaparak sadece duygunuzu topluluğa aktarabilirsiniz.'
  },
  {
    id: 'faq-4',
    question: 'Halkalar (Circles) nedir ve nasıl katılabilirim?',
    answer: 'Halkalar, benzer yaşam deneyimlerine sahip kullanıcıların (örneğin Kariyer Dönüşümü, Kayıp & Yas, Öz-Şefkat, Yeni Başlangıçlar) bir araya geldiği tematik mikro topluluklardır. Circles sayfasından ilginizi çeken bir halkaya katılabilir veya kendi halkanızı kurabilirsiniz.'
  },
  {
    id: 'faq-5',
    question: 'Meditasyon ve Bilgelik (Wisdom) odası nedir?',
    answer: 'Platformumuzda zihninizi sakinleştirmek için dahili bir Meditasyon Modalı ve felsefi alıntıların yer aldığı Wisdom alanı bulunur. Günlük stresli anlarda nefes egzersizi yapabilir ve kadim bilgelerden altın değerinde sözlerle odaklanabilirsiniz.'
  },
  {
    id: 'faq-6',
    question: 'Topluluk kurallarına aykırı bir içerik gördüğümde ne yapmalıyım?',
    answer: 'Gilded, yargılamadan uzak, şefkatli ve destekleyici bir ortamdır. Nefret söylemi, zorbalık veya taciz içeren gönderileri her kartın sağ üst köşesindeki menüden raporlayabilir veya yöneticilerimize doğrudan iletebilirsiniz.'
  }
]

export default function FaqPage() {
  useDocumentTitle('Sıkça Sorulan Sorular (SSS)', 'Gilded platformu, Kintsugi felsefesi, altın dikişler ve kullanım hakkında en çok merak edilen sorular.')
  const [expanded, setExpanded] = useState('faq-1')
  const [search, setSearch] = useState('')

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  const filteredFaqs = FAQ_LIST.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: '#D4AF37', mb: 1 }}>
          <HelpOutlineIcon />
          <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 700 }}>
            Rehber & Destek
          </Typography>
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #AA7C11 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Sıkça Sorulan Sorular
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, mx: 'auto' }}>
          Gilded ve Kintsugi yolculuğunuz hakkında en çok merak edilen konuları sizin için derledik.
        </Typography>

        <Box sx={{ mt: 4, maxWidth: 500, mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Sorularda ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#D4AF37' }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 3,
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(212,175,55,0.3)' },
                  '&:hover fieldset': { borderColor: '#D4AF37' },
                  '&.Mui-focused fieldset': { borderColor: '#D4AF37' }
                }
              }
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredFaqs.map((faq) => (
          <Accordion
            key={faq.id}
            expanded={expanded === faq.id}
            onChange={handleChange(faq.id)}
            sx={{
              background: 'rgba(20, 20, 20, 0.85)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '12px !important',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                borderColor: '#D4AF37',
                boxShadow: '0 4px 20px rgba(212,175,55,0.15)'
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#D4AF37' }} />}
              aria-controls={`${faq.id}-content`}
              id={`${faq.id}-header`}
              sx={{ py: 1 }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#FFF6D6' }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 2.5, px: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        {filteredFaqs.length === 0 && (
          <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', mt: 4 }}>
            Aradığınız kritere uygun bir soru bulunamadı.
          </Typography>
        )}
      </Box>
    </Container>
  )
}
