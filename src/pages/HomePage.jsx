import React, { useEffect, useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import PostForm from '../components/feed/PostForm';

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mevcut kullanıcıyı al
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts?userId=${currentUser.email}`);
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
              author_id={post.author_id}
              author_name={post.author_name}
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
