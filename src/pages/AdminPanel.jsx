import { useState, useEffect } from 'react';
import { 
  Box, Typography, Container, Grid, Paper, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, CircularProgress, Card, CardContent, Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  People as PeopleIcon, 
  PostAdd as PostAddIcon, 
  AutoFixHigh as AutoFixHighIcon,
  ReportProblem as ReportIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';
import { getStoredUser } from '../services/auth';

function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, repairedPosts: 0, totalSupports: 0 });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [showFullEmails, setShowFullEmails] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = getStoredUser() || {};

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refetch = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    let isCancelled = false;
    const loadData = async () => {
      try {
        const [statsRes, usersRes, postsRes, catsRes, reportsRes] = await Promise.all([
          apiClient.get('/admin/stats', { params: { admin_email: currentUser.email } }),
          apiClient.get('/admin/users', { params: { admin_email: currentUser.email } }),
          apiClient.get('/posts'),
          apiClient.get('/wisdom/categories'),
          apiClient.get('/admin/reports').catch(() => ({ data: [] }))
        ]);

        if (!isCancelled) {
          setStats(statsRes.data);
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
          setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
          setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          toast.error('Bu alana erişim yetkiniz yok!');
          navigate('/');
          return;
        }
        toast.error(error.response?.data?.error || error.message || 'Veriler yüklenemedi');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [currentUser.email, navigate, refreshTrigger]);

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { admin_email: currentUser.email, role: newRole });
      toast.success('Kullanıcı rolü güncellendi');
      
      if (currentUser.email === users.find(u => u.id === userId)?.email && newRole !== 'ADMIN') {
        const updatedUser = { ...currentUser, role: newRole };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        navigate('/');
        return;
      }

      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === currentUser.email) {
      toast.error('Kendi yönetici hesabınızı silemezsiniz!');
      return;
    }
    if (!window.confirm(`"${userEmail}" kullanıcısını ve tüm paylaşımlarını kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success('Kullanıcı başarıyla silindi');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Kullanıcı silinemedi');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bu içeriği silmek istediğine emin misin?')) return;
    try {
      await apiClient.delete(`/posts/${postId}`);
      toast.success('İçerik silindi');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğine emin misin? Bu kategoriye ait tüm takip ilişkileri de silinecektir.')) return;
    try {
      await apiClient.delete(`/wisdom/categories/${catId}`, { params: { adminId: currentUser.email } });
      toast.success('Kategori silindi');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      await apiClient.put(`/admin/reports/${reportId}/status`, { status });
      toast.success(`Şikayet durumu güncellendi: ${status}`);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Şikayet güncellenemedi');
    }
  };

  const handleDeleteReportedContent = async (reportId) => {
    if (!window.confirm('Şikayet edilen içeriği kalıcı olarak silmek ve şikayeti çözüldü olarak işaretlemek istiyor musunuz?')) return;
    try {
      await apiClient.delete(`/admin/reports/${reportId}/content`);
      toast.success('Şikayet edilen içerik silindi');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || 'İçerik silinemedi');
    }
  };

  const maskEmail = (email) => {
    if (showFullEmails || !email) return email;
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const name = parts[0];
    const masked = name.length > 2 ? name.substring(0, 2) + '***' : name + '***';
    return `${masked}@${parts[1]}`;
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
        Yönetim Paneli ✨
      </Typography>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Toplam Kullanıcı', value: stats?.totalUsers, icon: <PeopleIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Toplam Post', value: stats?.totalPosts, icon: <PostAddIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Onarılan Ruhlar', value: stats?.repairedPosts, icon: <AutoFixHighIcon sx={{ color: '#D4AF37' }} /> },
          { label: 'Açık Şikayetler', value: reports.filter(r => r.status === 'OPEN').length, icon: <ReportIcon sx={{ color: '#fb7185' }} /> },
        ].map((item, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
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
          <Tab 
            label={`Şikayetler (${reports.filter(r => r.status === 'OPEN').length})`} 
            sx={{ 
              color: reports.some(r => r.status === 'OPEN') ? '#fb7185' : '#94a3b8', 
              '&.Mui-selected': { color: '#D4AF37' },
              fontWeight: reports.some(r => r.status === 'OPEN') ? 700 : 400
            }} 
          />
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
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Button
              size="small"
              startIcon={showFullEmails ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setShowFullEmails(prev => !prev)}
              sx={{ color: '#D4AF37', textTransform: 'none' }}
            >
              {showFullEmails ? 'E-postaları Gizle (Maskele)' : 'E-postaların Tamamını Göster'}
            </Button>
          </Box>
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
                  <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{user.ad}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                    {maskEmail(user.email)}
                  </TableCell>
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                      {user.email !== currentUser.email && (
                        <Tooltip title="Kullanıcıyı ve tüm verilerini kalıcı olarak sil">
                          <IconButton 
                            onClick={() => handleDeleteUser(user.id, user.email)} 
                            sx={{ color: '#ff4d4d', '&:hover': { bgcolor: 'rgba(255,77,77,0.1)' } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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

      {/* Reports Tab */}
      {tab === 3 && (
        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 4 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Bildiren</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Neden & Detay</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Şikayet Edilen İçerik</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 'bold' }}>Aksiyon</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                    Henüz bildirilmiş herhangi bir şikayet bulunmuyor. Topluluk huzurlu! 🕊️
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((rep) => (
                  <TableRow key={rep.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{maskEmail(rep.reporter_email)}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{rep.reason}</Typography>
                      {rep.details && <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{rep.details}</Typography>}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontStyle: 'italic', bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 1 }}>
                        {rep.post_content || rep.comment_content || 'İçerik doğrudan belirtilmedi'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rep.status === 'OPEN' ? 'Açık' : rep.status === 'RESOLVED' ? 'Çözüldü' : 'Reddedildi'}
                        size="small"
                        sx={{
                          bgcolor: rep.status === 'OPEN' ? 'rgba(251, 113, 133, 0.2)' : rep.status === 'RESOLVED' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                          color: rep.status === 'OPEN' ? '#fb7185' : rep.status === 'RESOLVED' ? '#4ade80' : '#94a3b8',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {rep.status === 'OPEN' && (
                          <>
                            <Tooltip title="Şikayet edilen içeriği kaldır ve çözüldü yap">
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handleDeleteReportedContent(rep.id)}
                                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                              >
                                İçeriği Sil
                              </Button>
                            </Tooltip>
                            <Tooltip title="Çözüldü olarak işaretle">
                              <IconButton size="small" onClick={() => handleUpdateReportStatus(rep.id, 'RESOLVED')} sx={{ color: '#4ade80' }}>
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Geçersiz say (Reddet)">
                              <IconButton size="small" onClick={() => handleUpdateReportStatus(rep.id, 'DISMISSED')} sx={{ color: '#94a3b8' }}>
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default AdminPanel;
