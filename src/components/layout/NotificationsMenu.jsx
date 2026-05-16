import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../services/auth';

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = getStoredUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${user.email}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notif) => {
    try {
      if (!notif.is_read) {
        await fetch(`http://localhost:5000/api/notifications/${notif.id}/read`, { method: 'PUT' });
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      }
      handleClose();
      navigate(`/post/${notif.post_id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
            bgcolor: 'background.paper',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
            Bildirimler
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <MenuItem disabled>Bildiriminiz yok.</MenuItem>
        ) : (
          notifications.map(notif => (
            <MenuItem 
              key={notif.id} 
              onClick={() => markAsRead(notif)}
              sx={{ 
                opacity: notif.is_read ? 0.6 : 1,
                bgcolor: notif.is_read ? 'transparent' : 'rgba(212, 175, 55, 0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                whiteSpace: 'normal',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                {notif.type === 'support' && 'Biri parçanızı altınla dikti! ✨'}
                {notif.type === 'post_comment' && 'Parçanıza bir yorum geldi.'}
                {notif.type === 'comment_reply' && 'Yorumunuza cevap geldi.'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                "{notif.post_content?.substring(0, 40)}..."
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationsMenu;
