import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, useTheme, FormControlLabel, Checkbox } from '@mui/material';
import toast from 'react-hot-toast';
import { isAdminUser, isBilgeUser, getStoredUser } from '../../services/auth';

const PostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWisdom, setIsWisdom] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [image, setImage] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isBilge = isBilgeUser(getStoredUser());

  React.useEffect(() => {
    if (isBilge || isAdminUser(getStoredUser())) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      fetch(`http://localhost:5000/api/wisdom/categories?userId=${currentUser.email}`)
        .then(res => res.json())
        .then(data => setCategories(data));
    }
  }, [isBilge]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    setLoading(true);
    try {
      let finalCategoryId = selectedCategory;

      // Eğer yeni kategori oluşturuluyorsa
      if (isWisdom && isCreatingCategory && newCategoryName.trim()) {
        const catRes = await fetch('http://localhost:5000/api/wisdom/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName.trim(), userId: currentUser.email })
        });
        const catData = await catRes.json();
        if (!catRes.ok) throw new Error(catData.error || 'Kategori oluşturulamadı');
        finalCategoryId = catData.id;
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('author_id', currentUser.email);
      formData.append('post_type', isWisdom ? 'wisdom' : 'normal');
      formData.append('is_anonymous', true);
      if (isWisdom && finalCategoryId) {
        formData.append('category_id', finalCategoryId);
      }
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Paylaşım yapılamadı');

      setContent('');
      setImage(null);
      if (onPostCreated) onPostCreated(data);
      toast.success('Yeni bir kırık parça paylaşıldı.');
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 4, 
        bgcolor: isDark ? 'rgba(26, 26, 26, 0.5)' : 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.3)'
      }}
    >
      <Typography variant="h6" sx={{ color: '#D4AF37', mb: 2, fontFamily: "'Playfair Display', serif" }}>
        Bir Kırık Parça Paylaş
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Bugün neyin kırıldığını hissediyorsun?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: theme.palette.text.primary,
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.5)' },
            }
          }}
        />
        {image && (
          <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
            <img src={URL.createObjectURL(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)' }} />
            <Button 
              size="small" 
              onClick={() => setImage(null)}
              sx={{ position: 'absolute', top: 4, right: 4, minWidth: 'auto', p: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'red' } }}
            >
              ✕
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            component="label"
            sx={{
              color: theme.palette.text.secondary,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
              '&:hover': { borderColor: '#D4AF37', color: '#D4AF37' }
            }}
          >
            Resim Ekle
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) setImage(e.target.files[0]);
              }}
            />
          </Button>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isBilge && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={isWisdom} 
                      onChange={(e) => setIsWisdom(e.target.checked)} 
                      sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }} 
                    />
                  }
                  label={<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>Bilgelik Sözü Olarak Paylaş</Typography>}
                />
                {isWisdom && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {!isCreatingCategory ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <select 
                          value={selectedCategory} 
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            color: '#D4AF37', 
                            border: '1px solid rgba(212,175,55,0.3)', 
                            borderRadius: '4px',
                            padding: '4px',
                            flex: 1
                          }}
                        >
                          <option value="">Kategori Seç (Opsiyonel)</option>
                          {categories
                            .filter(cat => isAdminUser(getStoredUser()) || cat.is_owner)
                            .map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.follower_count || 0} Takipçi)
                              </option>
                            ))}
                        </select>
                        {(isAdminUser(getStoredUser()) || isBilge) && (
                          <Button 
                            size="small" 
                            onClick={() => setIsCreatingCategory(true)}
                            sx={{ color: '#D4AF37', minWidth: 'auto', p: 0.5, fontSize: '0.7rem' }}
                          >
                            + Yeni
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          placeholder="Yeni Kategori Adı"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { 
                              color: '#D4AF37', 
                              height: '32px',
                              fontSize: '0.8rem',
                              '& fieldset': { borderColor: 'rgba(212,175,55,0.3)' }
                            } 
                          }}
                        />
                        <Button 
                          size="small" 
                          onClick={() => setIsCreatingCategory(false)}
                          sx={{ color: '#888', minWidth: 'auto', p: 0.5, fontSize: '0.7rem' }}
                        >
                          Vazgeç
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ 
                bgcolor: '#D4AF37', 
                color: '#000',
                fontWeight: 700,
                px: 4,
                '&:hover': { bgcolor: '#F9E076' }
              }}
            >
              {loading ? 'Paylaşılıyor...' : 'Paylaş'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default PostForm;
