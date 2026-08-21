import { Breadcrumbs, Link, Typography, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon
} from '@mui/icons-material'

export default function BreadcrumbsNav({ items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(212,175,55,0.6)' }} />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.9rem',
            '&:hover': { color: '#D4AF37' }
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem', color: '#D4AF37' }} />
          Ana Sayfa
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          if (isLast || !item.to) {
            return (
              <Typography
                key={index}
                sx={{
                  color: '#D4AF37',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                {item.label}
              </Typography>
            )
          }
          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.to}
              underline="hover"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                '&:hover': { color: '#D4AF37' }
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </Breadcrumbs>
    </Box>
  )
}
