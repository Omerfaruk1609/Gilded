import { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, Grid, TextField, Button, Chip } from '@mui/material';
import { Send as SendIcon, Forum as ForumIcon, People as PeopleIcon } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { getStoredUser } from '../services/auth';

const CIRCLES = [
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
  const [selectedCircle, setSelectedCircle] = useState(CIRCLES[0]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState(1);
  const messagesEndRef = useRef(null);

  const socket = useSocket();
  const currentUser = getStoredUser();

  const handleSelectCircle = (circle) => {
    setSelectedCircle(circle);
    setMessages([]);
  };

  useEffect(() => {
    if (!socket || !selectedCircle) return;

    socket.emit('join_circle', selectedCircle.id);

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleUserJoined = () => {
      setActiveUsers((prev) => prev + 1);
    };

    const handleUserLeft = () => {
      setActiveUsers((prev) => Math.max(1, prev - 1));
    };

    socket.on('new_circle_message', handleNewMessage);
    socket.on('circle_user_joined', handleUserJoined);
    socket.on('circle_user_left', handleUserLeft);

    return () => {
      socket.emit('leave_circle', selectedCircle.id);
      socket.off('new_circle_message', handleNewMessage);
      socket.off('circle_user_joined', handleUserJoined);
      socket.off('circle_user_left', handleUserLeft);
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
      text: inputMessage.trim(),
      userName: currentUser?.ad || currentUser?.email?.split('@')[0] || 'Bir Ruh'
    });

    setInputMessage('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#D4AF37', fontWeight: 800, mb: 1 }}>
          Topluluk Çemberleri ⭕
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          Gerçek zamanlı anonim dertleşme odalarına katıl, diğer ruhlarla etkileşime geç ve ortak farkındalık oluştur.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Çember Seçim Listesi */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CIRCLES.map((circle) => {
              const isSelected = selectedCircle.id === circle.id;
              return (
                <Paper
                  key={circle.id}
                  onClick={() => handleSelectCircle(circle)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? `1.5px solid ${circle.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.08)',
                      borderColor: circle.color
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: circle.color, mb: 0.5 }}>
                    {circle.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    {circle.subtitle}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Grid>

        {/* Canlı Mesajlaşma Odası */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '520px',
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
                <ForumIcon sx={{ color: selectedCircle.color }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                  {selectedCircle.title}
                </Typography>
              </Box>

              <Chip
                icon={<PeopleIcon style={{ color: selectedCircle.color, fontSize: '1rem' }} />}
                label={`${activeUsers} Aktif Ruh`}
                size="small"
                sx={{
                  bgcolor: 'rgba(212, 175, 55, 0.08)',
                  color: selectedCircle.color,
                  border: `1px solid ${selectedCircle.color}`
                }}
              />
            </Box>

            {/* Mesaj Akışı */}
            <Box sx={{ flex: 1, p: 2.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ m: 'auto', textAlign: 'center', opacity: 0.5 }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#aaa' }}>
                    Bu çember henüz sessiz. İlk dikişi at ve sohbeti başlat...
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
                  bgcolor: selectedCircle.color,
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
    </Container>
  );
}
