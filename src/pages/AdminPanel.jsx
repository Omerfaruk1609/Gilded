import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Grid, Paper, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, CircularProgress, Card, CardContent
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Shield as ShieldIcon, 
  People as PeopleIcon, 
  PostAdd as PostAddIcon, 
  AutoFixHigh as AutoFixHighIcon 
} from '@mui/icons-material';
import toast from 'react-hot-toast';

function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, postsRes, catsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/stats?admin_email=${currentUser.email}`),
        fetch(`http://localhost:5000/api/admin/users?admin_email=${currentUser.email}`),
        fetch(`http://localhost:5000/api/posts`),
        fetch(`http://localhost:5000/api/wisdom/categories`)
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        toast.error('Bu alana erişim yetkiniz yok!');
        window.location.href = '/';
        return;
      }

      if (!statsRes.ok || !usersRes.ok || !postsRes.ok) {
        throw new Error('Sunucu hatası oluştu');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const postsData = await postsRes.json();
      const catsData = await catsRes.json();

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPosts(Array.isArray(postsData) ? postsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (error) {
      toast.error(error.message || 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: currentUser.email, role: newRole })
      });
      if (res.ok) {
        toast.success('Kullanıcı rolü güncellendi');
        
        // Kendi yetkisini değiştirdiyse (Admin'den başka bir şeye)
        if (currentUser.email === users.find(u => u.id === userId)?.email && newRole !== 'ADMIN') {
          const updatedUser = { ...currentUser, role: newRole };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.location.href = '/';
          return;
        }

        fetchData();
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bu içeriği silmek istediğine emin misin?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('İçerik silindi');
        fetchData();
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğine emin misin? Bu kategoriye ait tüm takip ilişkileri de silinecektir.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/wisdom/categories/${catId}?adminId=${currentUser.email}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Kategori silindi');
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Hata oluştu');
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: '#D4AF37' }} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ 
        fontFamily: "'Playfair Display', serif", 
        color: '#D4AF37', 
        mb: 4, 
        fontWeight: 700 
      }}>
        Yönetim Paneli
      </Typography>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Toplam Kullanıcı', value: stats?.totalUsers, icon: <PeopleIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Toplam Post', value: stats?.totalPosts, icon: <PostAddIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Onarılan Ruhlar', value: stats?.repairedPosts, icon: <AutoFixHighIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Toplam Dikiş', value: stats?.totalSupports, icon: <ShieldIcon sx={{ color: '#D4AF37' }} /> },
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 4 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 1 }}>{item.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>{item.value}</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(212, 175, 55, 0.2)', mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" TabIndicatorProps={{ style: { background: '#D4AF37' } }}>
          <Tab label="İçerik Yönetimi" sx={{ color: '#94a3b8', '&.Mui-selected': { color: '#D4AF37' } }} />
          <Tab label="Kullanıcı Yönetimi" sx={{ color: '#94a3b8', '&.Mui-selected': { color: '#D4AF37' } }} />
          <Tab label="Kategori Yönetimi" sx={{ color: '#94a3b8', '&.Mui-selected': { color: '#D4AF37' } }} />
        </Tabs>
      </Box>

      {/* Content Tab */}
      {tab === 0 && (
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>İçerik Özet</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Tür</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Dikiş</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#94a3b8' }}>{post.content.substring(0, 50)}...</TableCell>
                  <TableCell>
                    <Chip 
                      label={post.post_type === 'wisdom' ? 'Bilgelik' : 'Normal'} 
                      size="small" 
                      sx={{ 
                        bgcolor: post.post_type === 'wisdom' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                        color: post.post_type === 'wisdom' ? '#D4AF37' : '#94a3b8'
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#fff' }}>{post.support_count}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDeletePost(post.id)} sx={{ color: '#ff4d4d' }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Users Tab */}
      {tab === 1 && (
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Kullanıcı</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>E-posta</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Rol</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#fff' }}>{user.ad}</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role === 'ADMIN' ? 'Yönetici' : user.role === 'BILGE' ? 'Bilge' : 'Üye'} 
                      size="small" 
                      sx={{ 
                        bgcolor: user.role === 'ADMIN' ? '#D4AF37' : user.role === 'BILGE' ? '#fb923c' : 'rgba(255,255,255,0.1)',
                        color: user.role === 'ADMIN' ? '#000' : '#fff'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleUpdateRole(user.id, user.role === 'ADMIN' ? 'user' : 'ADMIN')}
                        sx={{ 
                          color: '#D4AF37', 
                          borderColor: 'rgba(212, 175, 55, 0.3)',
                          textTransform: 'none'
                        }}
                      >
                        {user.role === 'ADMIN' ? 'Yetki Al' : 'Admin Yap'}
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleUpdateRole(user.id, user.role === 'BILGE' ? 'user' : 'BILGE')}
                        sx={{ 
                          color: '#fb923c', 
                          borderColor: 'rgba(251, 146, 60, 0.3)',
                          textTransform: 'none'
                        }}
                      >
                        {user.role === 'BILGE' ? 'Bilgelik Al' : 'Bilge Yap'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Categories Tab */}
      {tab === 2 && (
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Kategori Adı</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Slug</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#fff' }}>{cat.name}</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>{cat.slug}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDeleteCategory(cat.id)} sx={{ color: '#ff4d4d' }}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default AdminPanel;
