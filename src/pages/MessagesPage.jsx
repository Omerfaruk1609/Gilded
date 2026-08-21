import { useState, useEffect, useRef } from 'react';
import { Box, Container, Paper, Typography, Avatar, TextField, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { Send as SendIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { getStoredUser } from '../services/auth';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

function MessagesPage() {
  const currentUser = getStoredUser() || {};
  const socket = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [contactsTrigger, setContactsTrigger] = useState(0);
  
  const messagesEndRef = useRef(null);

  // URL'deki query parametresinden sohbet edilecek kişiyi al (?chat=someone@gold.com)
  const initialChatEmail = searchParams.get('chat');

  // Kişi listesini yükle (Takip edilen ve takip edenler)
  useEffect(() => {
    let isCancelled = false;
    const loadContacts = async () => {
      try {
        const res = await apiClient.get(`/users/${currentUser.email}/network`);
        const data = res.data;
        
        const allUsers = [...data.followers, ...data.following];
        const uniqueContacts = Array.from(new Map(allUsers.map(item => [item.email, item])).values());
        const filteredContacts = uniqueContacts.filter(c => c.email !== currentUser.email);
        
        if (!isCancelled) {
          setContacts(filteredContacts);

          if (initialChatEmail) {
            const contact = filteredContacts.find(c => c.email === initialChatEmail);
            if (contact) {
              setSelectedContact(contact);
            } else {
              setSelectedContact({ email: initialChatEmail, ad: initialChatEmail.split('@')[0], role: 'user' });
            }
          }
        }
      } catch (err) {
        console.error('Kişiler yüklenirken hata oluştu:', err);
      }
    };

    loadContacts();
    return () => { isCancelled = true; };
  }, [currentUser.email, initialChatEmail, contactsTrigger]);

  // Mesaj geçmişini yükle
  useEffect(() => {
    if (!selectedContact) return;
    let isCancelled = false;
    const loadMessages = async () => {
      try {
        const res = await apiClient.get(`/messages/${selectedContact.email}`);
        if (!isCancelled) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Mesajlar yüklenirken hata oluştu:', err);
      }
    };

    loadMessages();
    setSearchParams({ chat: selectedContact.email });
    return () => { isCancelled = true; };
  }, [selectedContact, setSearchParams]);

  // Her yeni mesajda alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket.io ile yeni mesaj dinleme
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        if (selectedContact && (msg.sender_id === selectedContact.email || msg.receiver_id === selectedContact.email)) {
          setMessages(prev => [...prev, msg]);
        } else {
          toast.success(`${msg.sender_name || 'Bir Ruh'} size yeni bir mesaj gönderdi ✨`, {
            duration: 3000,
            position: 'top-right'
          });
          setContactsTrigger(prev => prev + 1);
        }
      };

      socket.on('new_message', handleNewMessage);
      return () => socket.off('new_message', handleNewMessage);
    }
  }, [socket, selectedContact]);

  // Mesaj Gönder
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedContact || loading) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/messages', {
        receiverEmail: selectedContact.email,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Mesaj gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={0}
        sx={{ 
          display: 'flex', 
          flex: 1, 
          bgcolor: 'rgba(26, 26, 26, 0.4)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* SOL PANEL: KİŞİLER LİSTESİ */}
        <Box sx={{ width: { xs: '100%', sm: 320 }, borderRight: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 700 }}>
              Ruh Bağlantıları
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Takip ettiğin ve seni takip eden kişiler
            </Typography>
          </Box>
          <List sx={{ overflowY: 'auto', flex: 1, p: 0 }}>
            {contacts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: '#555' }}>
                <Typography variant="body2">Henüz bağlantı kurduğun kimse yok.</Typography>
                <Typography variant="caption">Diğer kullanıcıları takip ederek sohbet başlatabilirsin.</Typography>
              </Box>
            ) : (
              contacts.map(c => (
                <ListItem 
                  button 
                  key={c.email}
                  onClick={() => setSelectedContact(c)}
                  sx={{ 
                    bgcolor: selectedContact?.email === c.email ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                    borderLeft: selectedContact?.email === c.email ? '3px solid #D4AF37' : 'none',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: c.role === 'ADMIN' ? '#ffd700' : c.role === 'BILGE' ? '#fb923c' : '#94a3b8', color: '#000', fontWeight: 'bold' }}>
                      {c.ad?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                        {c.ad}
                      </Typography>
                    } 
                    secondary={
                      <Typography variant="caption" sx={{ color: '#555' }}>
                        {c.email}
                      </Typography>
                    } 
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        {/* SAĞ PANEL: SOHBET EKRANI */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'rgba(10, 10, 10, 0.2)' }}>
          {selectedContact ? (
            <>
              {/* Sohbet Başlığı */}
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
                <Avatar sx={{ bgcolor: selectedContact.role === 'ADMIN' ? '#ffd700' : selectedContact.role === 'BILGE' ? '#fb923c' : '#94a3b8', color: '#000', fontWeight: 'bold' }}>
                  {selectedContact.ad?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 700 }}>{selectedContact.ad}</Typography>
                  <Typography variant="caption" sx={{ color: '#D4AF37' }}>
                    {selectedContact.role === 'ADMIN' ? 'Yönetici' : selectedContact.role === 'BILGE' ? 'Bilge' : 'Ruh Yoldaşı'}
                  </Typography>
                </Box>
              </Box>

              {/* Mesaj Listesi */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.map((msg) => {
                  const isSentByMe = msg.sender_id === currentUser.email;
                  return (
                    <Box 
                      key={msg.id}
                      sx={{ 
                        alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 1.5, 
                          px: 2,
                          bgcolor: isSentByMe ? '#D4AF37' : 'rgba(255,255,255,0.05)', 
                          color: isSentByMe ? '#000' : '#fff',
                          borderRadius: isSentByMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                          border: isSentByMe ? 'none' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', fontWeight: isSentByMe ? 600 : 400 }}>
                          {msg.content}
                        </Typography>
                      </Paper>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#444', 
                          mt: 0.5, 
                          alignSelf: isSentByMe ? 'flex-end' : 'flex-start',
                          fontSize: '0.65rem'
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              {/* Mesaj Gönderme Paneli */}
              <Box 
                component="form" 
                onSubmit={handleSendMessage} 
                sx={{ p: 2, borderTop: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'rgba(0,0,0,0.1)' }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Mesajını altın dikişle yaz..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      color: '#fff', 
                      bgcolor: 'rgba(255,255,255,0.02)',
                      '& fieldset': { borderColor: 'rgba(212,175,55,0.15)' },
                      '&:hover fieldset': { borderColor: '#D4AF37' },
                      '&.Mui-focused fieldset': { borderColor: '#D4AF37' }
                    } 
                  }}
                />
                <IconButton type="submit" sx={{ color: '#D4AF37' }} disabled={!newMessage.trim() || loading}>
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', gap: 2 }}>
              <ChatIcon sx={{ fontSize: '4rem', color: 'rgba(212, 175, 55, 0.2)' }} />
              <Typography variant="body1" sx={{ color: '#D4AF37', fontWeight: 600 }}>
                Kintsugi İletişim Merkezi
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Yaralarımızı paylaşmak ve konuşmak için soldan bir yoldaş seç.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default MessagesPage;
