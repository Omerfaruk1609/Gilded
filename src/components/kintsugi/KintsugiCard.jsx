import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Collapse, Button, Tooltip, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import toast from 'react-hot-toast';
import '../../css/kintsugi.css';

const CommentItem = ({ 
  comment, 
  currentUser, 
  isAuthor, 
  replyingTo, 
  setReplyingTo, 
  newComment, 
  setNewComment, 
  handleComment, 
  handleDeleteComment, 
  isAnonComment, 
  setIsAnonComment 
}) => {
  const theme = useTheme();
  const authorLabel = (comment.post_type === 'wisdom') 
    ? (comment.author_name || comment.author_id.split('@')[0]) 
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
          
          {(comment.author_id === currentUser.email || isAuthor) && (
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
            isAuthor={isAuthor}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            newComment={newComment}
            setNewComment={setNewComment}
            handleComment={handleComment}
            handleDeleteComment={handleDeleteComment}
            isAnonComment={isAnonComment}
            setIsAnonComment={setIsAnonComment}
          />
        ))}
      </div>
    )}
  </div>
  );
};

const KintsugiCard = ({ id, content, image_url, post_type = 'normal', author_id, author_name, is_anonymous, initialSupport = 0, initialHasSupported = 0, onDelete }) => {
  const theme = useTheme();
  const [supportCount, setSupportCount] = useState(initialSupport);
  const [hasSupported, setHasSupported] = useState(initialHasSupported === 1);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthor = currentUser.email === author_id;

  const handleDeletePost = async () => {
    if (!window.confirm('Bu parçayı sonsuza dek silmek istiyor musun?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedRes = await fetch(`http://localhost:5000/api/posts/${id}/comments`);
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
        const res = await fetch(`http://localhost:5000/api/posts/${id}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (err) {
        console.error('Yorum yükleme hatası:', err);
      }
    };
    fetchComments();
  }, [id]);

  const handleStitch = async () => {
    if (hasSupported || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSupportCount(data.support_count);
      setHasSupported(true);
      toast.success('Altın dikiş başarıyla atıldı!', { icon: '✨' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (e, parentId = null) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}/comments`, {
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


  return (
    <div className={`kintsugi-card stage-${stage} ${isFullyRepaired ? 'fully-repaired' : ''}`}>
      <svg className="crack-svg" viewBox="0 0 400 200">
        <path className="crack-path" d="M0,50 Q100,45 150,100 T300,80 T400,120" />
        <path className="crack-path" d="M50,0 Q60,100 20,200" />
        <path className="crack-path" d="M350,0 Q330,80 380,200" />
        {stage >= 3 && (
          <path className="crack-path" d="M150,100 L200,150 L250,120" />
        )}
      </svg>

      <div className="kintsugi-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="kintsugi-author">
            {post_type === 'wisdom' ? (author_name || author_id.split('@')[0]) : 'Bir Ruh'}
            {isAuthor && <span className="author-badge">Senin Parçan</span>}
            {post_type === 'wisdom' && <span className="author-badge" style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}>Bilgelik</span>}
          </div>
          
          {isAuthor && (
            <IconButton onClick={handleDeletePost} sx={{ color: 'rgba(255,77,77,0.3)', '&:hover': { color: '#ff4d4d' } }}>
              <span style={{ fontSize: '1.2rem' }}>×</span>
            </IconButton>
          )}
        </Box>
        <p className="kintsugi-text">{content}</p>
        
        {image_url && (
          <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
            <img 
              src={`http://localhost:5000${image_url}`} 
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
                isAuthor={isAuthor}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                newComment={newComment}
                setNewComment={setNewComment}
                handleComment={handleComment}
                handleDeleteComment={handleDeleteComment}
                isAnonComment={isAnonComment}
                setIsAnonComment={setIsAnonComment}
              />
            ))}
          </Box>
        </Collapse>
      </div>
    </div>
  );
};

export default KintsugiCard;
