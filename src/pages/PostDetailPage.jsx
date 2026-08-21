import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Box, Typography, Button, CircularProgress } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import KintsugiCard from '../components/kintsugi/KintsugiCard'
import BreadcrumbsNav from '../components/layout/BreadcrumbsNav'
import apiClient from '../services/apiClient'
import { getStoredUser } from '../services/auth'
import useDocumentTitle from '../hooks/useDocumentTitle'

const PostDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentUser = getStoredUser() || {}

  useDocumentTitle(
    post ? `${post.author_name || 'Kintsugi'} Paylaşımı` : 'Gönderi Detayı',
    post ? post.content?.slice(0, 150) : 'Gilded gönderi ve altın dikiş detayı.'
  )

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await apiClient.get(`/posts/${id}`, { params: { userId: currentUser.email } })
        setPost(response.data)
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Post bulunamadı')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id, currentUser.email])

  const handlePostDelete = () => {
    navigate('/')
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Breadcrumbs Navigation (Item 5) */}
      <BreadcrumbsNav
        items={[
          { label: 'Akış', to: '/' },
          { label: post ? `${post.author_name || 'İsimsiz'} Hikayesi` : `Gönderi #${id}` }
        ]}
      />

      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate(-1)}
        sx={{ color: '#D4AF37', mb: 3 }}
      >
        Geri Dön
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>Aradığın parça kaybolmuş olabilir.</Typography>
        </Box>
      ) : post && (
        <KintsugiCard 
          id={post.id}
          content={post.content}
          image_url={post.image_url}
          audio_url={post.audio_url}
          mood={post.mood}
          author_id={post.author_id}
          author_name={post.author_name}
          author_role={post.author_role}
          is_anonymous={post.is_anonymous}
          initialSupport={post.support_count}
          initialHasSupported={post.has_supported}
          onDelete={handlePostDelete}
        />
      )}
    </Container>
  )
}

export default PostDetailPage
