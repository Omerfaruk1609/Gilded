import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Paper, Avatar } from '@mui/material';
import KintsugiCard from '../components/kintsugi/KintsugiCard';
import { API_URL } from '../services/apiConfig';
import { getBadge } from '../services/auth';

function ProfilePage() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ received: 0, given: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Hikayeler, 1: Yolculuk

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [postsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/users/${currentUser.email}/posts`),
          fetch(`${API_URL}/users/${currentUser.email}/stats`)
        ]);
        
        const postsData = await postsRes.json();
        const statsData = await statsRes.json();
        
        setPosts(Array.isArray(postsData) ? postsData : []);
        setStats(statsData || { received: 0, given: 0 });
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
        <Typography variant="body1" sx={{ color: '#888', mb: 2 }}>
          Kırıklarını altına dönüştüren bir ruh.
        </Typography>

        {getBadge(stats) && (
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 1, 
            px: 2, 
            py: 1, 
            mb: 4,
            bgcolor: 'rgba(212,175,55,0.1)', 
            borderRadius: '20px',
            border: `1px solid ${getBadge(stats).color}44`
          }}>
            <span style={{ fontSize: '1.2rem' }}>{getBadge(stats).icon}</span>
            <Typography sx={{ color: getBadge(stats).color, fontWeight: 700, fontSize: '0.8rem' }}>
              {getBadge(stats).label}
            </Typography>
          </Box>
        )}

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

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(212,175,55,0.2)', mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Typography 
            onClick={() => setActiveTab(0)}
            sx={{ 
              pb: 1, 
              cursor: 'pointer', 
              color: activeTab === 0 ? '#D4AF37' : '#666',
              borderBottom: activeTab === 0 ? '2px solid #D4AF37' : 'none',
              fontWeight: 600
            }}
          >
            Hikayelerim
          </Typography>
          <Typography 
            onClick={() => setActiveTab(1)}
            sx={{ 
              pb: 1, 
              cursor: 'pointer', 
              color: activeTab === 1 ? '#D4AF37' : '#666',
              borderBottom: activeTab === 1 ? '2px solid #D4AF37' : 'none',
              fontWeight: 600
            }}
          >
            İyileşme Yolculuğum
          </Typography>
        </Box>
      </Box>

      <div className="kintsugi-container" style={{ padding: 0 }}>
        {loading ? (
          <Typography sx={{ color: '#888', textAlign: 'center' }}>Yükleniyor...</Typography>
        ) : activeTab === 0 ? (
          Array.isArray(posts) && posts.length > 0 ? (
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
                initialHasSupported={0}
              />
            ))
          ) : (
            <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              <Typography sx={{ color: '#555' }}>Henüz bir hikaye paylaşmadın.</Typography>
            </Box>
          )
        ) : (
          /* Timeline View */
          <Box sx={{ position: 'relative', pl: 4, ml: 2, borderLeft: '2px solid rgba(212,175,55,0.2)' }}>
            {Array.isArray(posts) && posts.length > 0 ? (
              [...posts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((post, idx) => (
                <Box key={post.id} sx={{ mb: 6, position: 'relative' }}>
                  {/* Timeline Dot */}
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -41, 
                    top: 0, 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%', 
                    bgcolor: post.is_repaired ? '#D4AF37' : '#333',
                    border: '4px solid #0f172a',
                    zIndex: 2,
                    boxShadow: post.is_repaired ? '0 0 10px #D4AF37' : 'none'
                  }} />
                  
                  <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    {new Date(post.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    mt: 1, 
                    bgcolor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    maxWidth: 600
                  }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.9rem', mb: 1 }}>{post.content.substring(0, 100)}...</Typography>
                    {post.is_repaired ? (
                      <Typography variant="caption" sx={{ color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ✨ Bu parça topluluk sevgisiyle onarıldı.
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Dikişler atılmaya devam ediyor... ({post.support_count} dikiş)
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))
            ) : (
              <Typography sx={{ color: '#555' }}>Yolculuk henüz başlamadı.</Typography>
            )}
          </Box>
        )}
      </div>
    </Container>
  );
}

export default ProfilePage;
