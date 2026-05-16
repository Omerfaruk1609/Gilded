import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import { API_URL } from '../services/apiConfig';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_URL}/posts/${id}?userId=${currentUser.email}`);
        if (!response.ok) {
          throw new Error('Post bulunamadı');
        }
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handlePostDelete = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ color: '#D4AF37', mb: 3 }}
      >
        Geri Dön
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>Aradığın parça kaybolmuş olabilir.</Typography>
        </Box>
      ) : post && (
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
      )}
    </Container>
  );
};

export default PostDetailPage;
