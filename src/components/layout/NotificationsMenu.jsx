import { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../services/auth';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = getStoredUser();
  const socket = useSocket();
  const navigate = useNavigate();

  // Bildirimleri ilk yükleme
  useEffect(() => {
    if (!user?.email) return;
    let isCancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get(`/notifications/${user.email}`);
        if (!isCancelled) setNotifications(res.data);
      } catch (err) {
        console.error('Bildirim çekme hatası:', err);
      }
    };

    fetchNotifications();
    return () => { isCancelled = true; };
  }, [user?.email]);

  // Socket.io Real-time Yeni Bildirim Dinleyicisi
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [
        {
          id: Date.now() + Math.random(),
          user_id: user?.email,
          type: newNotif.type,
          actor_id: newNotif.actor_id,
          actor_name: newNotif.sender_name,
          message: newNotif.message,
          post_id: newNotif.post_id,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);

      toast.success(newNotif.message || 'Yeni bir bildiriminiz var ✨', {
        duration: 4000,
        position: 'top-right'
      });
    };

    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, [socket, user?.email]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notif) => {
    try {
      if (!notif.is_read && notif.id && typeof notif.id === 'number') {
        await apiClient.put(`/notifications/${notif.id}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      handleClose();

      if (notif.type === 'message' && notif.actor_id) {
        navigate(`/messages?chat=${encodeURIComponent(notif.actor_id)}`);
      } else if (notif.post_id) {
        navigate(`/post/${notif.post_id}`);
      }
    } catch (err) {
      console.error('Bildirim okundu hatası:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} sx={{ ml: 1, color: '#D4AF37' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            bgcolor: 'rgba(18, 18, 18, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '16px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
            color: '#fff'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
            Bildirimler 🔔
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <MenuItem disabled sx={{ py: 2, textAlign: 'center', color: '#888' }}>
            Henüz bildiriminiz yok.
          </MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem 
              key={notif.id} 
              onClick={() => markAsRead(notif)}
              sx={{ 
                opacity: notif.is_read ? 0.6 : 1,
                bgcolor: notif.is_read ? 'transparent' : 'rgba(212, 175, 55, 0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                whiteSpace: 'normal',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                py: 1.2,
                px: 2,
                '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.15)' }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold', color: '#FFF6D6' }}>
                {notif.type === 'message' && `💬 ${notif.actor_name || notif.actor_id?.split('@')[0] || 'Birisi'} size mesaj gönderdi`}
                {notif.type === 'support' && '✨ Biri yaranızı altınla dikti!'}
                {notif.type === 'post_comment' && '💬 Yaranıza bir destek mesajı geldi.'}
                {notif.type === 'comment_reply' && '↩️ Destek mesajınıza yanıt geldi.'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                {notif.type === 'message'
                  ? (notif.message ? `"${notif.message.substring(0, 45)}..."` : 'Sohbete gitmek için tıklayın.')
                  : (notif.post_content ? `"${notif.post_content.substring(0, 45)}..."` : 'Gönderiyi görmek için tıklayın.')}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;
