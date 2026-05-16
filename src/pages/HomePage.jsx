import React, { useEffect, useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import PostForm from '../components/feed/PostForm';
import { API_URL } from '../services/apiConfig';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mevcut kullanıcıyı al
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts?userId=${currentUser.email}`);
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(45deg, #ffd700, #ff8c00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Kırıklardan Doğan Güç
        </Typography>
        <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400 }}>
          Başarısızlıklarını paylaş, topluluğun desteğiyle onları altına dönüştür.
        </Typography>
      </Box>

      {/* Global Mood / Topluluk Ruhu */}
      {!loading && posts.length > 0 && (
        <Box sx={{ 
          mb: 4, 
          p: 2, 
          bgcolor: 'rgba(212,175,55,0.05)', 
          borderRadius: 4, 
          border: '1px solid rgba(212,175,55,0.1)',
          textAlign: 'center'
        }}>
          <Typography variant="caption" sx={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
            Topluluk Ruhu
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant="h5" sx={{ color: '#fff' }}>
              Bugün çoğunlukla <strong>{
                Object.entries(posts.reduce((acc, p) => {
                  if (p.mood) acc[p.mood] = (acc[p.mood] || 0) + 1;
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Durağan'
              }</strong> hissediyoruz.
            </Typography>
            <span style={{ fontSize: '2rem' }}>
              {
                (() => {
                  const moodStats = posts.reduce((acc, p) => {
                    if (p.mood) acc[p.mood] = (acc[p.mood] || 0) + 1;
                    return acc;
                  }, {});
                  const topMood = Object.entries(moodStats).sort((a, b) => b[1] - a[1])[0]?.[0];
                  
                  const emojiMap = {
                    'Kırgın': '💔',
                    'Yorgun': '😴',
                    'Üzgün': '😢',
                    'Öfkeli': '🔥',
                    'Umutlu': '🌱',
                    'Huzurlu': '🧘'
                  };
                  return emojiMap[topMood] || '🏺';
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
          <Typography sx={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</Typography>
        ) : (
          Array.isArray(posts) && posts.map(post => (
            <KintsugiCard 
              key={post.id}
              id={post.id}
              content={post.content}
              image_url={post.image_url}
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
  );
}

export default HomePage;
