import { useEffect, useState } from 'react'
import { Box, Typography, Container, Button } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import KintsugiCard from '../components/kintsugi/KintsugiCard'
import PostForm from '../components/feed/PostForm'
import apiClient from '../services/apiClient'
import { getStoredUser } from '../services/auth'
import useDocumentTitle from '../hooks/useDocumentTitle'

function HomePage() {
  useDocumentTitle('Ana Sayfa - Kusurların Altınla Onarımı', 'Kırılma anlarınızı paylaşın, Kintsugi felsefesiyle topluluğun desteğini alın.')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // Mevcut kullanıcıyı al
  const currentUser = getStoredUser() || {}

  useEffect(() => {
    let isCancelled = false
    const fetchPosts = async () => {
      try {
        const response = await apiClient.get('/posts', { params: { userId: currentUser.email } })
        if (!isCancelled) setPosts(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Yükleme hatası:', error)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchPosts()
    return () => { isCancelled = true }
  }, [currentUser.email])

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts])
  }

  const scrollToPostForm = () => {
    window.scrollTo({ top: 350, behavior: 'smooth' })
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Top CTA Hero Section */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: 800,
            mb: 2,
            background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #AA7C11 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2.4rem', md: '3.5rem' }
          }}
        >
          Kırıklardan Doğan Güç
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400, maxWidth: 650, mx: 'auto', mb: 3 }}>
          Başarısızlıklarını ve kırılma anlarını gizleme. Topluluğun şefkatiyle onları parıldayan birer altına dönüştür.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={scrollToPostForm}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              fontWeight: 700,
              px: 3.5,
              py: 1.2,
              borderRadius: 2.5,
              boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
              '&:hover': { bgcolor: '#b89428' }
            }}
          >
            Kırılmanı Altınla Onar
          </Button>
        </Box>
      </Box>

      {/* Global Mood / Topluluk Ruhu */}
      {!loading && posts.length > 0 && (
        <Box sx={{ 
          mb: 4, 
          p: 2.5, 
          bgcolor: 'rgba(212,175,55,0.06)', 
          borderRadius: 3, 
          border: '1px solid rgba(212,175,55,0.2)',
          textAlign: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <Typography variant="caption" sx={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
            ✨ TOPLULUK RUHU
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
              Bugün topluluk çoğunlukla <strong>{
                Object.entries(posts.reduce((acc, p) => {
                  if (p.mood) acc[p.mood] = (acc[p.mood] || 0) + 1
                  return acc
                }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Durağan'
              }</strong> hissediyor.
            </Typography>
            <span style={{ fontSize: '2rem' }}>
              {
                (() => {
                  const moodStats = posts.reduce((acc, p) => {
                    if (p.mood) acc[p.mood] = (acc[p.mood] || 0) + 1
                    return acc
                  }, {})
                  const topMood = Object.entries(moodStats).sort((a, b) => b[1] - a[1])[0]?.[0]
                  
                  const emojiMap = {
                    'Kırgın': '💔',
                    'Yorgun': '😴',
                    'Üzgün': '😢',
                    'Öfkeli': '🔥',
                    'Umutlu': '🌱',
                    'Huzurlu': '🧘'
                  }
                  return emojiMap[topMood] || '🏺'
                })()
              }
            </span>
          </Box>
        </Box>
      )}

      {/* Post Paylaşma Formu */}
      <PostForm onPostCreated={handlePostCreated} />

      <div className="kintsugi-container">
        {loading ? (
          <Typography sx={{ color: '#888', textAlign: 'center', my: 4 }}>Altın parçalar yükleniyor...</Typography>
        ) : (
          Array.isArray(posts) && posts.map(post => (
            <KintsugiCard 
              key={post.id}
              id={post.id}
              content={post.content}
              image_url={post.image_url}
              audio_url={post.audio_url}
              mood={post.mood}
              author_id={post.author_id}
              author_name={post.author_name}
              author_role={post.author_role}
              is_anonymous={post.is_anonymous}
              initialSupport={post.support_count}
              initialHasSupported={post.has_supported}
              onDelete={(deletedId) => setPosts(posts.filter(p => p.id !== deletedId))}
            />
          ))
        )}
      </div>
    </Container>
  )
}

export default HomePage
