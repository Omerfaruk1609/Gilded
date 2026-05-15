import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';

const WisdomPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Just fetch all posts and filter wisdom on frontend (or we could add a query param, but for MVP frontend filter is ok)
      const res = await fetch('http://localhost:5000/api/posts');
      const data = await res.json();
      setPosts(data.filter(p => p.post_type === 'wisdom'));
    } catch (error) {
      console.error('Gönderiler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = (id) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ 
          fontFamily: "'Playfair Display', serif",
          color: '#D4AF37',
          mb: 2,
          fontWeight: 700
        }}>
          Bilgelik Panosu
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}>
          Topluluk yöneticilerimizden altın değerinde sözler ve tavsiyeler. Kırıklarınızı onarırken size rehberlik edecek feyz dolu paylaşımlar.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {posts.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
              Henüz bilgelik sözü paylaşılmamış.
            </Typography>
          ) : (
            posts.map(post => (
              <KintsugiCard 
                key={post.id}
                id={post.id}
                content={post.content}
                image_url={post.image_url}
                post_type={post.post_type}
                author_id={post.author_id}
                author_name={post.author_name}
                is_anonymous={post.is_anonymous}
                initialSupport={post.support_count}
                initialHasSupported={post.has_supported}
                onDelete={handlePostDelete}
              />
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

export default WisdomPage;
