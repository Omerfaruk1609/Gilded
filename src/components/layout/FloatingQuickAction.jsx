import { useState } from 'react'
import { Box, Fab, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Divider } from '@mui/material'
import {
  AutoAwesome as AutoAwesomeIcon,
  SelfImprovement as SelfImprovementIcon,
  MenuBook as MenuBookIcon,
  HelpOutline as HelpOutlineIcon,
  EditNote as EditNoteIcon,
  WorkspacePremium as GalleryIcon,
  InfoOutlined as InfoIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../../services/auth'
import toast from 'react-hot-toast'
import MeditationModal from './MeditationModal'
import PostModal from '../feed/PostModal'

export default function FloatingQuickAction() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [meditationOpen, setMeditationOpen] = useState(false)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const navigate = useNavigate()
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (actionKey) => {
    handleClose()
    const user = getStoredUser()

    if (actionKey === 'meditation') {
      setMeditationOpen(true)
    } else if (actionKey === 'post') {
      if (!user) {
        toast('Hikaye paylaşmak için lütfen giriş yapın ✨', { icon: '🔑' })
        navigate('/login')
        return
      }
      setPostModalOpen(true)
    } else if (actionKey === 'gallery') {
      if (!user) {
        navigate('/login')
      } else {
        navigate('/profile?tab=gallery')
      }
    } else if (actionKey === 'wisdom') {
      if (!user) {
        navigate('/login')
      } else {
        navigate('/wisdom')
      }
    } else if (actionKey === 'faq') {
      navigate('/faq')
    } else if (actionKey === 'about') {
      navigate('/about')
    } else if (actionKey === 'scroll_top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 20, md: 28 },
          right: { xs: 20, md: 28 },
          zIndex: 1300
        }}
      >
        <Tooltip title="Hızlı Kintsugi Menüsü" placement="left">
          <Fab
            onClick={open ? handleClose : handleClick}
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              fontWeight: 800,
              width: { xs: 52, md: 56 },
              height: { xs: 52, md: 56 },
              boxShadow: '0 6px 22px rgba(212,175,55,0.45)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#b89428',
                transform: 'scale(1.06)',
                boxShadow: '0 8px 28px rgba(212,175,55,0.65)'
              }
            }}
          >
            {open ? <CloseIcon /> : <AutoAwesomeIcon />}
          </Fab>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(18, 18, 18, 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 3,
              boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
              mb: 1.5,
              minWidth: 230,
              color: '#fff',
              overflow: 'hidden'
            }
          }}
        >
          <MenuItem
            onClick={() => handleAction('post')}
            sx={{ py: 1.2, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <EditNoteIcon sx={{ color: '#D4AF37' }} />
            </ListItemIcon>
            <ListItemText primary="Hikaye Paylaş" primaryTypographyProps={{ fontSize: '0.9rem', color: '#FFF6D6', fontWeight: 600 }} />
          </MenuItem>

          <MenuItem
            onClick={() => handleAction('meditation')}
            sx={{ py: 1.2, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <SelfImprovementIcon sx={{ color: '#D4AF37' }} />
            </ListItemIcon>
            <ListItemText primary="Meditasyon & Nefes" primaryTypographyProps={{ fontSize: '0.9rem', color: '#FFF6D6' }} />
          </MenuItem>

          <MenuItem
            onClick={() => handleAction('gallery')}
            sx={{ py: 1.2, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <GalleryIcon sx={{ color: '#D4AF37' }} />
            </ListItemIcon>
            <ListItemText primary="Ruhlar Galerisi" primaryTypographyProps={{ fontSize: '0.9rem', color: '#FFF6D6' }} />
          </MenuItem>

          <MenuItem
            onClick={() => handleAction('wisdom')}
            sx={{ py: 1.2, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <MenuBookIcon sx={{ color: '#D4AF37' }} />
            </ListItemIcon>
            <ListItemText primary="Günün Bilgeliği" primaryTypographyProps={{ fontSize: '0.9rem', color: '#FFF6D6' }} />
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: 'rgba(212,175,55,0.15)' }} />

          <MenuItem
            onClick={() => handleAction('faq')}
            sx={{ py: 1.1, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <HelpOutlineIcon sx={{ color: '#aaa' }} />
            </ListItemIcon>
            <ListItemText primary="Sıkça Sorulan Sorular" primaryTypographyProps={{ fontSize: '0.85rem', color: '#ddd' }} />
          </MenuItem>

          <MenuItem
            onClick={() => handleAction('about')}
            sx={{ py: 1.1, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <InfoIcon sx={{ color: '#aaa' }} />
            </ListItemIcon>
            <ListItemText primary="Hakkımızda & Ekip" primaryTypographyProps={{ fontSize: '0.85rem', color: '#ddd' }} />
          </MenuItem>

          <MenuItem
            onClick={() => handleAction('scroll_top')}
            sx={{ py: 1.1, '&:hover': { bgcolor: 'rgba(212,175,55,0.12)' } }}
          >
            <ListItemIcon>
              <ArrowUpIcon sx={{ color: '#aaa' }} />
            </ListItemIcon>
            <ListItemText primary="En Başa Dön" primaryTypographyProps={{ fontSize: '0.85rem', color: '#ddd' }} />
          </MenuItem>
        </Menu>
      </Box>

      <MeditationModal open={meditationOpen} onClose={() => setMeditationOpen(false)} />
      <PostModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
    </>
  )
}
