import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Paper, Avatar } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';

function ProfilePage() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ received: 0, given: 0 });
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [postsRes, statsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/${currentUser.email}/posts`),
          fetch(`http://localhost:5000/api/users/${currentUser.email}/stats`)
        ]);
        
        const postsData = await postsRes.json();
        const statsData = await statsRes.json();
        
        setPosts(postsData);
        setStats(statsData);
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser.email) {
      fetchProfileData();
    }
  }, [currentUser.email]);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Profil Başlığı */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 100, 
            height: 100, 
            mb: 2, 
            bgcolor: '#D4AF37',
            fontSize: '2.5rem',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
          }}
        >
          {currentUser.email?.[0].toUpperCase()}
        </Avatar>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
          {currentUser.email?.split('@')[0]}
        </Typography>
        <Typography variant="body1" sx={{ color: '#888', mb: 4 }}>
          Kırıklarını altına dönüştüren bir ruh.
        </Typography>

        <Grid container spacing={3} sx={{ maxWidth: 500 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 800 }}>{stats.received}</Typography>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase' }}>Alınan Destek</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 800 }}>{stats.given}</Typography>
              <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase' }}>Verilen Destek</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="h5" sx={{ color: '#fff', mb: 4, fontFamily: "'Playfair Display', serif" }}>
        Senin Hikayelerin
      </Typography>

      <div className="kintsugi-container" style={{ padding: 0 }}>
        {loading ? (
          <Typography sx={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</Typography>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <KintsugiCard 
              key={post.id}
              id={post.id}
              content={post.content}
              image_url={post.image_url}
              author_id={post.author_id}
              initialSupport={post.support_count}
              initialHasSupported={0} // Kendi postuna zaten destek atamaz
            />
          ))
        ) : (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
            <Typography sx={{ color: '#555' }}>Henüz bir hikaye paylaşmadın.</Typography>
          </Box>
        )}
      </div>
    </Container>
  );
}

export default ProfilePage;
