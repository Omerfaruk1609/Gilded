import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import FloatingQuickAction from './components/layout/FloatingQuickAction'

// Lazy-loaded Pages for Code-Splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const HallOfFamePage = lazy(() => import('./pages/HallOfFamePage'))
const WisdomPage = lazy(() => import('./pages/WisdomPage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const CirclesPage = lazy(() => import('./pages/CirclesPage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Guards
import ProtectedRoute from './components/guards/ProtectedRoute'
import PublicOnlyRoute from './components/guards/PublicOnlyRoute'
import AdminRoute from './components/guards/AdminRoute'

import { Toaster } from 'react-hot-toast'

const PageLoader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#D4AF37', mb: 2 }} />
    <Typography variant="body2" sx={{ color: 'rgba(212,175,55,0.7)', fontStyle: 'italic', letterSpacing: 1 }}>
      Altın dikişler işleniyor... ✨
    </Typography>
  </Box>
)

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #D4AF37' } }} />
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/galeri"
            element={
              <ProtectedRoute>
                <HallOfFamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wisdom"
            element={
              <ProtectedRoute>
                <WisdomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <PostDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/circles"
            element={
              <ProtectedRoute>
                <CirclesPage />
              </ProtectedRoute>
            }
          />

          {/* Publicly Accessible Information & Legal Routes */}
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />

          {/* 404 Not Found Catch-All Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <FloatingQuickAction />
      <Footer />
    </>
  )
}

export default App