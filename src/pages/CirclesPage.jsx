import { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, TextField, Button, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio 
} from '@mui/material';
import { Send as SendIcon, Forum as ForumIcon, People as PeopleIcon, Add as AddIcon } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { getStoredUser, isBilgeUser, isAdminUser } from '../services/auth';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import BreadcrumbsNav from '../components/layout/BreadcrumbsNav';
import useDocumentTitle from '../hooks/useDocumentTitle';

const DEFAULT_CIRCLES = [
  {
    id: 'night_talk',
    title: 'Gece Dertleşmesi Çemberi 🌙',
    subtitle: 'Kırılan parçalarını paylaş, altın dikişlerle ruhunu hafiflet.',
    color: '#D4AF37'
  },
  {
    id: 'meditation',
    title: 'Sessiz Meditasyon Odası 🧘',
    subtitle: 'Derin nefes al, zihnini dinginleştir ve iç huzurunu yakala.',
    color: '#4ADE80'
  },
  {
    id: 'stoic_wisdom',
    title: 'Stoacı Bilgelik Odası 🏛️',
    subtitle: 'Marcus Aurelius ve kadim filozofların izinde içsel direnç sohbeti.',
    color: '#fb923c'
  }
];

export default function CirclesPage() {
  useDocumentTitle('Halkalar (Circles) - Canlı Çemberler', 'Benzer duyguları yaşayan yolcularla anlık dertleşme ve meditasyon çemberleri.');
  const [circles, setCircles] = useState(DEFAULT_CIRCLES);
  const [selectedCircle, setSelectedCircle] = useState(DEFAULT_CIRCLES[0]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState(1);
  const [presenceMap, setPresenceMap] = useState({});
  const messagesEndRef = useRef(null);

  // Yeni Çember Oluşturma Modalı State'leri
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newColor, setNewColor] = useState('#D4AF37');
  const [creating, setCreating] = useState(false);

  const socket = useSocket();
  const currentUser = getStoredUser() || {};
  const canCreateCircle = isBilgeUser(currentUser) || isAdminUser(currentUser);

  // Çemberleri Backend'den Çek
  useEffect(() => {
    let isCancelled = false;
    const loadCircles = async () => {
      try {
        const res = await apiClient.get('/circles');
        if (!isCancelled && Array.isArray(res.data) && res.data.length > 0) {
          setCircles(res.data);
        }
      } catch {
        // Backend yüklenemezse varsayılanlar kullanılır
      }
    };
    loadCircles();
    return () => { isCancelled = true; };
  }, []);

  const handleSelectCircle = (circle) => {
    if (socket && selectedCircle) {
      socket.emit('leave_circle', selectedCircle.id);
    }
    setSelectedCircle(circle);
    setMessages([]);
  };

  useEffect(() => {
    if (!socket || !selectedCircle) return;

    socket.emit('join_circle', selectedCircle.id);

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handlePresenceUpdate = (data) => {
      if (data && data.circleId) {
        setPresenceMap((prev) => ({ ...prev, [data.circleId]: data.count }));
        if (data.circleId === selectedCircle.id || `circle_${selectedCircle.id}` === data.circleId) {
          setActiveUsers(data.count);
        }
      }
    };

    const handleNewCircle = (newCircle) => {
      setCircles((prev) => {
        if (prev.some(c => c.id === newCircle.id)) return prev;
        return [...prev, newCircle];
      });
    };

    socket.on('new_circle_message', handleNewMessage);
    socket.on('circle_presence_update', handlePresenceUpdate);
    socket.on('new_circle_created', handleNewCircle);

    return () => {
      socket.emit('leave_circle', selectedCircle.id);
      socket.off('new_circle_message', handleNewMessage);
      socket.off('circle_presence_update', handlePresenceUpdate);
      socket.off('new_circle_created', handleNewCircle);
    };
  }, [socket, selectedCircle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send_circle_message', {
      circleId: selectedCircle.id,
      text: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error('Çember başlığı zorunludur.');

    setCreating(true);
    try {
      const res = await apiClient.post('/circles', {
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        color: newColor
      });
      toast.success('Yeni çember başarıyla açıldı! ⭕', { icon: '✨' });
      setCreateOpen(false);
      setNewTitle('');
      setNewSubtitle('');
      setCircles((prev) => {
        if (prev.some(c => c.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setSelectedCircle(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Çember açılamadı.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <BreadcrumbsNav items={[{ label: 'Topluluk Çemberleri' }]} />
      <Box sx={{ mb: { xs: 2.5, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37', fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', sm: '2.3rem', md: '3rem' } }}>
          Topluluk Çemberleri ⭕
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', mb: 2, fontSize: { xs: '0.9rem', md: '1rem' } }}>
          Gerçek zamanlı anonim dertleşme ve meditasyon odalarına katıl, benzer yollardan geçen ruhlarla anlık bağ kur.
        </Typography>

        {canCreateCircle && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              fontWeight: 700,
              borderRadius: '20px',
              px: 3,
              py: 1,
              '&:hover': { bgcolor: '#F9E076' }
            }}
          >
            Yeni Çember Aç (Bilge Alanı) ⭕
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Çember Seçim Listesi */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {circles.map((circle) => {
              const isSelected = selectedCircle.id === circle.id;
              const liveCount = presenceMap[circle.id] || circle.active_users || (isSelected ? activeUsers : 0);
              return (
                <Paper
                  key={circle.id}
                  onClick={() => handleSelectCircle(circle)}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? `1.5px solid ${circle.color || '#D4AF37'}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.08)',
                      borderColor: circle.color || '#D4AF37'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: circle.color || '#D4AF37', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                      {circle.title}
                    </Typography>
                    <Chip 
                      label={`${liveCount} Canlı`}
                      size="small"
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: '20px', 
                        bgcolor: liveCount > 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: liveCount > 0 ? '#4ade80' : '#888',
                        border: liveCount > 0 ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    {circle.subtitle}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Grid>

        {/* Canlı Mesajlaşma Odası */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: { xs: '440px', md: '520px' },
              bgcolor: 'rgba(15, 15, 15, 0.95)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              overflow: 'hidden'
            }}
          >
            {/* Oda Başlığı */}
            <Box
              sx={{
                p: 2,
                px: 3,
                bgcolor: 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ForumIcon sx={{ color: selectedCircle.color || '#D4AF37' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {selectedCircle.title}
                </Typography>
              </Box>

              <Chip
                icon={<PeopleIcon style={{ color: selectedCircle.color || '#D4AF37', fontSize: '1rem' }} />}
                label={`${activeUsers} Aktif Ruh`}
                size="small"
                sx={{
                  bgcolor: 'rgba(212, 175, 55, 0.08)',
                  color: selectedCircle.color || '#D4AF37',
                  border: `1px solid ${selectedCircle.color || '#D4AF37'}`
                }}
              />
            </Box>

            {/* Mesaj Akışı */}
            <Box sx={{ flex: 1, p: 2.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ m: 'auto', textAlign: 'center', opacity: 0.6 }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#aaa' }}>
                    Bu çember şu an dingin ve sessiz. İlk dikişi at ve sohbeti başlat... ✨
                  </Typography>
                </Box>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_email === currentUser?.email;
                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'rgba(212,175,55,0.8)', mb: 0.3, px: 0.5 }}>
                        {msg.sender_name}
                      </Typography>
                      <Paper
                        sx={{
                          p: 1.5,
                          px: 2,
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          bgcolor: isMine ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: isMine ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                          color: '#fff'
                        }}
                      >
                        <Typography variant="body2">{msg.text}</Typography>
                      </Paper>
                    </Box>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Mesaj Gönderme Formu */}
            <Box
              component="form"
              onSubmit={handleSendMessage}
              sx={{
                p: 2,
                bgcolor: 'rgba(0,0,0,0.4)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                gap: 1.5
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Düşüncelerini çemberle paylaş..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.3)' },
                    '&:hover fieldset': { borderColor: '#D4AF37' }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: selectedCircle.color || '#D4AF37',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 3,
                  '&:hover': { bgcolor: '#fff' }
                }}
              >
                <SendIcon fontSize="small" />
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bilge / Admin Çember Oluşturma Modalı */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#141414',
            color: '#fff',
            borderRadius: 3,
            border: '1px solid rgba(212,175,55,0.3)',
            maxWidth: 480,
            width: '100%',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37', fontWeight: 700 }}>
          Yeni Topluluk Çemberi Aç ⭕
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
            Bir Bilge olarak topluluğun dertleşebileceği, meditasyon yapabileceği veya felsefi paylaşımlarda bulunabileceği yeni bir canlı çember açın.
          </Typography>

          <TextField
            fullWidth
            label="Çember Başlığı"
            placeholder="Örn: İçsel Dinginlik Çemberi 🌿"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
            }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Çember Açıklaması / Felsefesi"
            placeholder="Bu çemberde ne amaçla toplanıyoruz?"
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
            }}
          />

          <Typography variant="subtitle2" sx={{ color: '#D4AF37', mt: 2, mb: 1 }}>
            Tema Rengi:
          </Typography>
          <RadioGroup
            row
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          >
            {[
              { label: 'Altın', value: '#D4AF37' },
              { label: 'Zümrüt', value: '#4ADE80' },
              { label: 'Kehribar', value: '#fb923c' },
              { label: 'Safir', value: '#38bdf8' },
              { label: 'Ametist', value: '#c084fc' }
            ].map((c) => (
              <FormControlLabel
                key={c.value}
                value={c.value}
                control={<Radio sx={{ color: c.value, '&.Mui-checked': { color: c.value } }} />}
                label={<Typography sx={{ fontSize: '0.85rem', color: c.value }}>{c.label}</Typography>}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
            Vazgeç
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCircle}
            disabled={creating}
            sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#F9E076' } }}
          >
            {creating ? 'Oluşturuluyor...' : 'Çemberi Başlat ✨'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
