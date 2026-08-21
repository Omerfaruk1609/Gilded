import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Button } from '@mui/material';
import toast from 'react-hot-toast';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import BreadcrumbsNav from '../components/layout/BreadcrumbsNav';
import apiClient from '../services/apiClient';
import { getStoredUser } from '../services/auth';
import useDocumentTitle from '../hooks/useDocumentTitle';

const WisdomPage = () => {
  useDocumentTitle('Bilgelik Panosu (Wisdom)', 'Topluluk yöneticilerimizden altın değerinde sözler, tavsiyeler ve bilgelik damlaları.')
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTrigger, setCategoryTrigger] = useState(0);
  
  const currentUser = getStoredUser() || {};

  useEffect(() => {
    let isCancelled = false;
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/wisdom/categories', { params: { userId: currentUser.email } });
        if (!isCancelled) setCategories(res.data);
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err);
      }
    };
    loadCategories();
    return () => { isCancelled = true; };
  }, [currentUser.email, categoryTrigger]);

  useEffect(() => {
    let isCancelled = false;
    const loadPosts = async () => {
      try {
        const params = { postType: 'wisdom', userId: currentUser.email };
        if (selectedCategory) {
          params.categoryId = selectedCategory;
        }
        const res = await apiClient.get('/posts', { params });
        if (!isCancelled) setPosts(res.data);
      } catch (error) {
        console.error('Gönderiler yüklenemedi:', error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadPosts();
    return () => { isCancelled = true; };
  }, [currentUser.email, selectedCategory]);

  const handleFollow = async (categoryId) => {
    try {
      await apiClient.post('/wisdom/follow', { userId: currentUser.email, categoryId });
      setCategoryTrigger(prev => prev + 1);
      toast.success('Takip durumu güncellendi.');
    } catch {
      toast.error('Takip işlemi başarısız.');
    }
  };

  const handlePostDelete = (id) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <BreadcrumbsNav items={[{ label: 'Bilgelik Panosu' }]} />
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ 
          fontFamily: "'Playfair Display', serif",
          color: '#D4AF37',
          mb: 2,
          fontWeight: 700
        }}>
          Bilgelik Panosu
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', maxWidth: '600px', mx: 'auto', mb: 4 }}>
          Topluluk yöneticilerimizden altın değerinde sözler ve tavsiyeler.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
          <Button 
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'contained' : 'outlined'}
            sx={{ 
              borderRadius: '20px', 
              textTransform: 'none',
              bgcolor: selectedCategory === null ? '#D4AF37' : 'transparent',
              color: selectedCategory === null ? '#000' : '#D4AF37',
              borderColor: '#D4AF37'
            }}
          >
            Tümü
          </Button>
          {categories.map(cat => (
            <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', pr: 1 }}>
              <Button 
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                sx={{ 
                  borderRadius: '20px 0 0 20px', 
                  textTransform: 'none',
                  bgcolor: selectedCategory === cat.id ? 'rgba(212,175,55,0.2)' : 'transparent',
                  color: '#D4AF37',
                  minWidth: 'auto',
                  px: 2
                }}
              >
                {cat.name} ({cat.follower_count || 0})
              </Button>
              <Button 
                size="small"
                onClick={() => handleFollow(cat.id)}
                sx={{ 
                  minWidth: 'auto', 
                  p: '2px 8px', 
                  fontSize: '0.65rem',
                  color: cat.is_followed ? '#888' : '#D4AF37',
                  bgcolor: cat.is_followed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.1)',
                  borderRadius: '10px'
                }}
              >
                {cat.is_followed ? 'Takipten Çık' : 'Takip Et'}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!Array.isArray(posts) || posts.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
              Bu kategoride henüz bilgelik sözü paylaşılmamış.
            </Typography>
          ) : (
            posts.map(post => (
              <Box key={post.id} sx={{ position: 'relative' }}>
                {post.category_name && (
                  <Typography sx={{ 
                    position: 'absolute', 
                    top: -10, 
                    right: 20, 
                    zIndex: 10, 
                    bgcolor: '#1a1a1a', 
                    color: '#D4AF37', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    border: '1px solid rgba(212,175,55,0.3)',
                    fontWeight: 700
                  }}>
                    {post.category_name}
                  </Typography>
                )}
                <KintsugiCard 
                  id={post.id}
                  content={post.content}
                  image_url={post.image_url}
                  mood={post.mood}
                  post_type={post.post_type}
                  author_id={post.author_id}
                  author_name={post.author_name}
                  author_role={post.author_role}
                  is_anonymous={post.is_anonymous}
                  initialSupport={post.support_count}
                  initialHasSupported={post.has_supported}
                  onDelete={handlePostDelete}
                />
              </Box>
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

export default WisdomPage;
