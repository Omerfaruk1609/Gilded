import React, { useEffect, useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import { API_URL } from '../services/apiConfig';

function HallOfFamePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts?userId=${currentUser.email}&repaired=true`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontFamily: "'Playfair Display', serif", 
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(45deg, #FFD700, #FFF700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}
        >
          Onarılan Ruhlar Galerisi
        </Typography>
        <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 400, opacity: 0.9 }}>
          Topluluğun sevgisiyle kırıklarından altın sızan, iyileşmiş başyapıtlar.
        </Typography>
      </Box>

      <div className="kintsugi-container">
        {loading ? (
          <Typography sx={{ color: '#888', textAlign: 'center' }}>Altın işlemeler yükleniyor...</Typography>
        ) : posts.length > 0 ? (
          posts.map(post => (
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
        ) : (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(212,175,55,0.1)' }}>
            <Typography sx={{ color: '#D4AF37', fontSize: '1.2rem', mb: 2 }}>Henüz tam onarılmış bir parça yok.</Typography>
            <Typography sx={{ color: '#888' }}>Ana sayfaya dönüp kırıklara altın dikiş atmaya başlayabilirsin.</Typography>
          </Box>
        )}
      </div>
    </Container>
  );
}

export default HallOfFamePage;
