import { useState, useEffect } from 'react';
import { 
  Box, TextField, IconButton, Typography, Collapse, Button, Tooltip, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { isAdminUser, getStoredUser } from '../../services/auth';
import { API_BASE_URL } from '../../services/apiConfig';
import apiClient from '../../services/apiClient';
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
  handleVote,
  isAdmin
}) => {
  const theme = useTheme();
  const isAnon = (comment.is_anonymous === 1 || comment.is_anonymous === '1' || comment.is_anonymous === true || comment.is_anonymous === 'true');
  const authorLabel = isAnon 
    ? (comment.post_type === 'wisdom' ? 'Bilge Bir Ruh' : 'Bir Ruh') 
    : (comment.author_name || comment.author_id?.split('@')[0] || 'Bir Ruh');

  return (
    <div className="comment-item">
      <div className="comment-main" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Reddit-style vertical voting panel on the left */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '32px', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '6px', p: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={() => handleVote(comment.id, 'up')} 
            sx={{ 
              color: comment.user_vote === 'up' ? '#4caf50' : 'rgba(255,255,255,0.25)', 
              p: 0.2,
              '&:hover': { color: '#4caf50' }
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>▲</span>
          </IconButton>
          <Typography 
            sx={{ 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              my: 0.2, 
              color: comment.user_vote === 'up' ? '#4caf50' : (comment.user_vote === 'down' ? '#ff4d4d' : 'rgba(255,255,255,0.6)') 
            }}
          >
            {comment.score || 0}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => handleVote(comment.id, 'down')} 
            sx={{ 
              color: comment.user_vote === 'down' ? '#ff4d4d' : 'rgba(255,255,255,0.25)', 
              p: 0.2,
              '&:hover': { color: '#ff4d4d' }
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>▼</span>
          </IconButton>
        </Box>

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
              handleVote={handleVote}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const KintsugiCard = ({ id, content, image_url, audio_url, mood, post_type = 'normal', author_id, author_name, author_role, is_anonymous, initialSupport = 0, initialHasSupported = 0, onDelete }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [supportCount, setSupportCount] = useState(initialSupport);
  const [hasSupported, setHasSupported] = useState(initialHasSupported === 1);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [wisdom, setWisdom] = useState(null);
  const [wisdomLoading, setWisdomLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Nefret Söylemi veya Küfür');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleGetWisdom = async () => {
    if (wisdomLoading) return;
    setWisdomLoading(true);
    try {
      const res = await apiClient.post(`/posts/${id}/philosopher-wisdom`);
      setWisdom(res.data);
    } catch {
      toast.error('Bilgelik öğüdü alınamadı.');
    } finally {
      setWisdomLoading(false);
    }
  };

  const currentUser = getStoredUser() || {};
  const isAdmin = isAdminUser(currentUser);
  const isAuthor = currentUser.email === author_id;

  const handleReportSubmit = async () => {
    if (!currentUser.email) {
      toast.error('Şikayette bulunmak için lütfen giriş yapın.');
      return;
    }
    setSubmittingReport(true);
    try {
      await apiClient.post('/reports', {
        post_id: id,
        reported_user_email: author_id,
        reason: reportReason,
        details: reportDetails
      });
      toast.success('Şikayetiniz yöneticilere iletildi. Hassasiyetiniz için teşekkür ederiz.', { icon: '🛡️' });
      setReportOpen(false);
      setReportDetails('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Şikayet iletilemedi.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Bu parçayı sonsuza dek silmek istiyor musun?')) return;
    try {
      await apiClient.delete(`/posts/${id}`);
      toast.success('Parça silindi.');
      if (onDelete) onDelete(id);
    } catch {
      toast.error('Silme hatası.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bu mesajı silmek istiyor musun?')) return;
    try {
      await apiClient.delete(`/comments/${commentId}`);
      const updatedRes = await apiClient.get(`/posts/${id}/comments`, { params: { userId: currentUser.email } });
      setComments(updatedRes.data);
      toast.success('Mesaj silindi.');
    } catch {
      toast.error('Silme hatası.');
    }
  };

  const stage = Math.min(supportCount, 5);
  const isFullyRepaired = supportCount >= 5;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await apiClient.get(`/posts/${id}/comments`, { params: { userId: currentUser.email } });
        setComments(res.data);
      } catch (err) {
        console.error('Yorum yükleme hatası:', err);
      }
    };
    fetchComments();
  }, [id, currentUser.email]);

  const triggerGoldConfetti = (isMassive = false) => {
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
      const response = await apiClient.post(`/posts/${id}/support`, { user_id: currentUser.email });
      const data = response.data;
      
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
      toast.error(error.response?.data?.error || error.message || 'Dikiş atılamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleGoldLeaf = async (commentId) => {
    try {
      await apiClient.post(`/comments/${commentId}/gold-leaf`, { user_id: currentUser.email });
      toast.success('Altın yaprak iliştirildi ✨');
      const updatedRes = await apiClient.get(`/posts/${id}/comments`, { params: { userId: currentUser.email } });
      setComments(updatedRes.data);
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleVote = async (commentId, type) => {
    try {
      const res = await apiClient.post(`/comments/${commentId}/vote`, { type });
      setComments(res.data);
    } catch {
      toast.error('Oylama hatası.');
    }
  };

  const handleComment = async (e, parentId = null) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const response = await apiClient.post(`/posts/${id}/comments`, { 
        content: newComment,
        author_id: currentUser.email,
        parent_id: parentId,
        is_anonymous: true
      });
      
      setComments(response.data);
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
              <Typography 
                onClick={() => {
                  const isAnon = (is_anonymous === 1 || is_anonymous === '1' || is_anonymous === true || is_anonymous === 'true');
                  if (!isAnon && author_id) {
                    navigate(`/profile?email=${author_id}`);
                  }
                }}
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  color: '#fff',
                  cursor: !(is_anonymous === 1 || is_anonymous === '1' || is_anonymous === true || is_anonymous === 'true') ? 'pointer' : 'default',
                  '&:hover': {
                    textDecoration: !(is_anonymous === 1 || is_anonymous === '1' || is_anonymous === true || is_anonymous === 'true') ? 'underline' : 'none'
                  }
                }}
              >
                {(is_anonymous === 1 || is_anonymous === '1' || is_anonymous === true || is_anonymous === 'true') 
                  ? (post_type === 'wisdom' ? 'Bilge Bir Ruh' : 'Bir Ruh') 
                  : (author_name || author_id?.split('@')[0] || 'Bir Ruh')}
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
            
            {!isAuthor && (
              <Tooltip title="Bu içeriği bildir / şikayet et">
                <IconButton 
                  size="small" 
                  onClick={() => setReportOpen(true)} 
                  sx={{ color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#fb7185' } }}
                >
                  <FlagIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
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
              alt={content ? `Kintsugi Hikaye Görseli - ${content.slice(0, 50)}` : 'Kintsugi Paylaşım Görseli'} 
              loading="lazy"
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

        {audio_url && (
          <Box sx={{ mt: 2, mb: 2, p: 1.5, bgcolor: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Typography variant="caption" sx={{ color: '#D4AF37', display: 'block', mb: 0.5, fontWeight: 700 }}>
              🎙️ Sesli Dert Günlüğü
            </Typography>
            <audio controls style={{ width: '100%', borderRadius: '8px' }}>
              <source src={`${API_BASE_URL}${audio_url}`} />
              Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
          </Box>
        )}
        
        <Box sx={{ mt: { xs: 2.5, sm: 4 }, display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', flexWrap: 'wrap' }}>
          {!isWisdom && (
            <Button 
              size="small"
              onClick={handleStitch}
              disabled={hasSupported || loading}
              sx={{ 
                bgcolor: hasSupported ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                borderRadius: '20px',
                px: { xs: 1.5, sm: 2.5 },
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.1)' },
                '&.Mui-disabled': { color: 'rgba(212, 175, 55, 0.5)', borderColor: 'rgba(212, 175, 55, 0.2)' }
              }}
            >
              {hasSupported ? '✓ Dikiş Atıldı' : 'Altınla Dik'}
            </Button>
          )}

          <Button 
            size="small"
            onClick={() => {
              setReplyingTo(replyingTo === 'root' ? null : 'root');
              setShowComments(true);
            }}
            sx={{ color: '#888', textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            Yorum At
          </Button>

          {!isWisdom && (
            <Button 
              size="small"
              onClick={handleGetWisdom}
              disabled={wisdomLoading}
              sx={{ color: '#D4AF37', textTransform: 'none', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {wisdomLoading ? 'Düşünülüyor...' : 'Bilgeye Danış 🏺'}
            </Button>
          )}

          {comments.length > 0 && (
            <Button 
              size="small"
              onClick={() => setShowComments(!showComments)}
              sx={{ color: '#666', fontSize: { xs: '0.7rem', sm: '0.75rem' }, ml: { xs: 0, sm: 'auto' } }}
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

        {wisdom && (
          <Box sx={{ 
            mt: 2, 
            mb: 2,
            p: 2.5, 
            borderRadius: '16px', 
            bgcolor: 'rgba(212, 175, 55, 0.03)', 
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.05)',
            position: 'relative'
          }}>
            <Typography variant="caption" sx={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, display: 'block', mb: 1 }}>
              🔮 Kadim Bilgelik ({wisdom.philosopher})
            </Typography>
            <Typography sx={{ fontStyle: 'italic', color: '#fff', fontSize: '0.95rem', mb: 1.5, fontFamily: "'Playfair Display', serif" }}>
              {wisdom.quote}
            </Typography>
            <Typography sx={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {wisdom.advice}
            </Typography>
          </Box>
        )}

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
                handleVote={handleVote}
                isAdmin={isAdmin}
              />
            ))}
          </Box>
        </Collapse>

        {/* 🚩 Şikayet & Raporlama Modalı */}
        <Dialog 
          open={reportOpen} 
          onClose={() => setReportOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: '#141414',
              color: '#fff',
              borderRadius: 3,
              border: '1px solid rgba(251,113,133,0.3)',
              maxWidth: 450,
              width: '100%',
              p: 1
            }
          }}
        >
          <DialogTitle sx={{ fontFamily: "'Playfair Display', serif", color: '#fb7185', fontWeight: 700 }}>
            İçeriği Bildir / Şikayet Et 🚩
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              Gilded topluluk huzurunu bozan, nefret içeren veya uygunsuz olduğunu düşündüğünüz içerikleri yöneticiye iletebilirsiniz.
            </Typography>

            <RadioGroup
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              sx={{ mb: 2 }}
            >
              {[
                'Nefret Söylemi veya Küfür',
                'Taciz veya Tehdit',
                'Spam veya Yanıltıcı İçerik',
                'Zararlı / Hassas İçerik',
                'Telif veya Gizlilik İhlali',
                'Diğer'
              ].map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#fb7185' } }} />}
                  label={<Typography sx={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{reason}</Typography>}
                />
              ))}
            </RadioGroup>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Ek açıklama (isteğe bağlı)..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setReportOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>
              Vazgeç
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReportSubmit}
              disabled={submittingReport}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {submittingReport ? 'Gönderiliyor...' : 'Şikayeti İlet'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default KintsugiCard;
