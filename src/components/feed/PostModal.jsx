import { Dialog, DialogContent, Box, Typography, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import PostForm from './PostForm'

export default function PostModal({ open, onClose, onPostCreated }) {
  const handleCreated = (newPost) => {
    if (onPostCreated) onPostCreated(newPost)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 4,
          color: '#fff',
          p: { xs: 1, sm: 2 },
          boxShadow: '0 15px 40px rgba(0,0,0,0.8)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Playfair Display", serif',
            color: '#D4AF37',
            fontWeight: 700
          }}
        >
          Yeni Kırık Parça & Hikaye ✨
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 1 }}>
        <PostForm onPostCreated={handleCreated} />
      </DialogContent>
    </Dialog>
  )
}
