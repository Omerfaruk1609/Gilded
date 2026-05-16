import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Collapse, Button, Tooltip, useTheme } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { isAdminUser } from '../../services/auth';
import { API_URL, API_BASE_URL } from '../../services/apiConfig';
import '../../css/kintsugi.css';

const CommentItem = ({ 
  comment, 
  currentUser, 
  isPostAuthor, // Post sahibi mi?
  replyingTo, 
  setReplyingTo, 
  newComment, 
  setNewComment, 
  handleComment, 
  handleDeleteComment,
  handleGoldLeaf,
  isAdmin
}) => {
  const theme = useTheme();
  const authorLabel = (comment.post_type === 'wisdom') 
    ? 'Bilge Bir Ruh' 
    : 'Bir Ruh';

  return (
    <div className="comment-item">
      <div className="comment-main">
        <div style={{ flex: 1 }}>
          <div className="comment-header">
            <Typography className="comment-author">{authorLabel}</Typography>
            <Typography className="comment-time">
              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('tr-TR') : ''}
            </Typography>
          </div>
          <Typography className="comment-body">{comment.content}</Typography>
        
        <div className="comment-actions">
          <Button 
            className="comment-action-btn" 
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          >
            Cevapla
          </Button>

          {isPostAuthor && (
            <Button 
              className="comment-action-btn" 
              sx={{ color: '#D4AF37 !important' }}
              onClick={() => handleGoldLeaf(comment.id)}
              startIcon={<span>✨</span>}
            >
              Altın Yaprak Ver ({comment.gold_leaves || 0})
            </Button>
          )}

          {!isPostAuthor && comment.gold_leaves > 0 && (
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                <span style={{ fontSize: '0.9rem' }}>✨</span>
                <Typography sx={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 700 }}>{comment.gold_leaves}</Typography>
             </Box>
          )}
          
          {(comment.author_id === currentUser.email || isPostAuthor || isAdmin) && (
            <Button 
              className="comment-action-btn" 
              sx={{ color: '#ff4d4d !important' }}
              onClick={() => handleDeleteComment(comment.id)}
            >
              Sil
            </Button>
          )}
        </div>
        
        {replyingTo === comment.id && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                autoFocus
                placeholder="Cevabını yaz..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: theme.palette.text.primary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', fontSize: '0.8rem' } }}
              />
              <IconButton onClick={() => handleComment(null, comment.id)} sx={{ color: '#D4AF37' }}>
                <span style={{ fontSize: '1rem' }}>➤</span>
              </IconButton>
            </Box>
          </Box>
        )}
      </div>
    </div>

    {comment.children && comment.children.length > 0 && (
      <div className="comment-thread">
        {comment.children.map(child => (
          <CommentItem 
            key={child.id} 
            comment={child} 
            currentUser={currentUser}
            isPostAuthor={isPostAuthor}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            newComment={newComment}
            setNewComment={setNewComment}
            handleComment={handleComment}
            handleDeleteComment={handleDeleteComment}
            handleGoldLeaf={handleGoldLeaf}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    )}
  </div>
  );
};

const buildCommentTree = (flatComments) => {
  if (!Array.isArray(flatComments)) return [];
  const map = {};
  flatComments.forEach(c => map[c.id] = { ...c, children: [] });
  const roots = [];
  flatComments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
};

const KintsugiCard = ({ id, content, image_url, mood, post_type = 'normal', author_id, author_name, author_role, is_anonymous, initialSupport = 0, initialHasSupported = 0, onDelete }) => {
  const theme = useTheme();
  const [supportCount, setSupportCount] = useState(initialSupport);
  const [hasSupported, setHasSupported] = useState(initialHasSupported === 1);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = isAdminUser(currentUser);
  const isAuthor = currentUser.email === author_id;

  const handleDeletePost = async () => {
    if (!window.confirm('Bu parçayı sonsuza dek silmek istiyor musun?')) return;
    try {
      const res = await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Parça silindi.');
        if (onDelete) onDelete(id);
      }
    } catch (err) {
      toast.error('Silme hatası.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bu mesajı silmek istiyor musun?')) return;
    try {
      const res = await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedRes = await fetch(`${API_URL}/posts/${id}/comments`);
        const updatedData = await updatedRes.json();
        setComments(updatedData);
        toast.success('Mesaj silindi.');
      }
    } catch (err) {
      toast.error('Silme hatası.');
    }
  };

  const stage = Math.min(supportCount, 5);
  const isFullyRepaired = supportCount >= 5;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_URL}/posts/${id}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error('Yorum yükleme hatası:', err);
      }
    };
    fetchComments();
  }, [id]);

  const triggerGoldConfetti = (isMassive = false) => {
    const scalar = isMassive ? 2 : 1;
    const defaults = {
      spread: 360,
      ticks: isMassive ? 100 : 50,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: isMassive ? 30 : 20,
      shapes: ['circle'],
      colors: ['#D4AF37', '#F9E076', '#B8860B', '#FFD700', '#ffffff'],
    };

    if (isMassive) {
      confetti({
        ...defaults,
        particleCount: 80,
        scalar: 1.2,
      });
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 0.75,
      });
    } else {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 0.9,
      });
    }
  };

  const handleStitch = async () => {
    if (hasSupported || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      const prevCount = supportCount;
      setSupportCount(data.support_count);
      setHasSupported(true);
      
      // Efekti tetikle
      if (data.support_count >= 5 && prevCount < 5) {
        triggerGoldConfetti(true); // Büyük patlama
        toast.success('Muhteşem! Bu parça artık tamamen onarıldı.', { icon: '🏺' });
      } else {
        triggerGoldConfetti(false); // Normal dikiş efekti
        toast.success('Altın dikiş başarıyla atıldı!', { icon: '✨' });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoldLeaf = async (commentId) => {
    try {
      const res = await fetch(`${API_URL}/comments/${commentId}/gold-leaf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.email })
      });
      if (res.ok) {
        toast.success('Altın yaprak iliştirildi ✨');
        const updatedRes = await fetch(`${API_URL}/posts/${id}/comments`);
        const updatedData = await updatedRes.json();
        setComments(updatedData);
      }
    } catch (err) {
      toast.error('Hata oluştu');
    }
  };

  const handleComment = async (e, parentId = null) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/comments/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment,
          author_id: currentUser.email,
          parent_id: parentId,
          is_anonymous: true
        }),
      });
      
      const data = await response.json();
      setComments(data);
      setNewComment('');
      setReplyingTo(null);
      setShowComments(true);
      toast.success('Destek mesajın iletildi.');
    } catch (error) {
      toast.error('Mesaj gönderilemedi.');
      console.error('Yorum hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildCommentTree = (flatComments) => {
    if (!Array.isArray(flatComments)) return [];
    
    const map = {};
    const roots = [];

    flatComments.forEach(c => {
      if (c && c.id) {
        map[c.id] = { ...c, children: [] };
      }
    });

    flatComments.forEach(c => {
      const node = map[c.id];
      if (node) {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };


  const isWisdom = post_type === 'wisdom';

  return (
    <div className={`kintsugi-card ${isWisdom ? 'wisdom-card' : `stage-${stage}`} ${isFullyRepaired && !isWisdom ? 'fully-repaired' : ''}`}>
      {!isWisdom && (
        <>
          <svg className="crack-svg" viewBox="0 0 400 200">
            <path className="crack-path" d="M0,50 Q100,45 150,100 T300,80 T400,120" />
            <path className="crack-path" d="M50,0 Q60,100 20,200" />
            <path className="crack-path" d="M350,0 Q330,80 380,200" />
            {stage >= 3 && (
              <path className="crack-path" d="M150,100 L200,150 L250,120" />
            )}
          </svg>
          <div className="gold-overlay"></div>
          <div className="gold-shimmer"></div>
        </>
      )}

      <div className="kintsugi-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="kintsugi-author">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                {(is_anonymous === 0 || is_anonymous === '0') ? (author_name || 'İsimsiz Ruh') : (post_type === 'wisdom' ? 'Bilge Bir Ruh' : 'Bir Ruh')}
              </Typography>
              
              {author_role === 'ADMIN' && (
                <span className="author-badge" style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                  Yönetici
                </span>
              )}
              {author_role === 'BILGE' && (
                <span className="author-badge" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>
                  Bilge
                </span>
              )}
              {isAuthor && <span className="author-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>Sen</span>}
            </Box>
          </div>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {mood && (
              <Box sx={{ 
                px: 1, 
                py: 0.3, 
                bgcolor: 'rgba(255,255,255,0.05)', 
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>Hissiyat:</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{mood}</Typography>
              </Box>
            )}
            
            {(isAuthor || isAdmin) && (
              <IconButton onClick={handleDeletePost} sx={{ color: 'rgba(255,77,77,0.3)', '&:hover': { color: '#ff4d4d' } }}>
                <span style={{ fontSize: '1.2rem' }}>×</span>
              </IconButton>
            )}
          </Box>
        </Box>
        <p className="kintsugi-text">{content}</p>
        
        {image_url && (
          <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
            <img 
              src={`${API_BASE_URL}${image_url}`} 
              alt="Post" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                borderRadius: '8px', 
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }} 
            />
          </Box>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
          {!isWisdom && (
            <Button 
              onClick={handleStitch}
              disabled={hasSupported || loading}
              sx={{ 
                bgcolor: hasSupported ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                borderRadius: '20px',
                px: 3,
                '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.1)' },
                '&.Mui-disabled': { color: 'rgba(212, 175, 55, 0.5)', borderColor: 'rgba(212, 175, 55, 0.2)' }
              }}
            >
              {hasSupported ? '✓ Dikiş Atıldı' : 'Altınla Dik'}
            </Button>
          )}

          <Button 
            onClick={() => {
              setReplyingTo(replyingTo === 'root' ? null : 'root');
              setShowComments(true);
            }}
            sx={{ color: '#888', textTransform: 'none' }}
          >
            Yorum At
          </Button>

          {comments.length > 0 && (
            <Button 
              onClick={() => setShowComments(!showComments)}
              sx={{ color: '#666', fontSize: '0.75rem', ml: 'auto' }}
            >
              {showComments ? 'Gizle' : `${comments.length} Destek Mesajı`}
            </Button>
          )}

          {isAuthor && (
            <Tooltip title="Toplam Dikiş">
              <Typography sx={{ ml: 'auto', color: '#D4AF37', fontWeight: 800 }}>
                {supportCount}
              </Typography>
            </Tooltip>
          )}
        </Box>

        <Collapse in={replyingTo === 'root'}>
          <Box sx={{ mt: 2 }}>
            <Box component="form" onSubmit={(e) => handleComment(e, null)} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Destekleyici bir şeyler yaz..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { color: theme.palette.text.primary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' } }}
              />
              <IconButton type="submit" sx={{ color: '#D4AF37' }} disabled={!newComment.trim()}>
                <span style={{ fontSize: '1.2rem' }}>➤</span>
              </IconButton>
            </Box>
          </Box>
        </Collapse>

        <Collapse in={showComments}>
          <Box sx={{ mt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', pt: 2 }}>
            {buildCommentTree(comments).map((c) => (
              <CommentItem 
                key={c.id} 
                comment={c} 
                currentUser={currentUser}
                isPostAuthor={isAuthor}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                newComment={newComment}
                setNewComment={setNewComment}
                handleComment={handleComment}
                handleDeleteComment={handleDeleteComment}
                handleGoldLeaf={handleGoldLeaf}
                isAdmin={isAdmin}
              />
            ))}
          </Box>
        </Collapse>
      </div>
    </div>
  );
};

export default KintsugiCard;
