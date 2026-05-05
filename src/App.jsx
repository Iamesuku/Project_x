import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar        from './components/Navbar'
import Footer        from './components/Footer'
import ToastContainer from './components/Toast'

// ── Eager-loaded (above-the-fold critical paths) ──────────────────────────
import Home              from './pages/Home'
import Auth              from './pages/Auth'
import Browse            from './pages/Browse'
import Jobs              from './pages/Jobs'
import JobDetail         from './pages/JobDetail'
import FreelancerProfile from './pages/FreelancerProfile'

// ── Lazy-loaded (heavy pages, only fetch when needed) ─────────────────────
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Messages       = lazy(() => import('./pages/Messages'))
const Contracts      = lazy(() => import('./pages/Contracts'))
const PostJob        = lazy(() => import('./pages/PostJob'))
const Wallet         = lazy(() => import('./pages/Wallet'))
const Profile        = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Support        = lazy(() => import('./pages/Support'))
const Notifications  = lazy(() => import('./pages/Notifications'))

// ── Full-page spinner for Suspense fallback ──────────────────────────────
function PageSpinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid #e5e5e5', borderTopColor: '#000',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

// ── Layout wrapper — navbar + footer ─────────────────────────────────────
const WithLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
)

// ── Route guards ──────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isLoggedIn, isLoading } = useApp()
  if (isLoading) return null     // hold while Firebase resolves auth state
  return isLoggedIn ? children : <Navigate to="/auth" replace />
}

function PublicRoute({ children }) {
  const { isLoggedIn, isLoading } = useApp()
  if (isLoading) return null
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children
}

// ── Loading screen (shown while Firebase restores auth) ───────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: '#fff',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{
        fontFamily: 'var(--font-display, serif)', fontSize: 28,
        fontWeight: 700, letterSpacing: '-0.5px', color: '#000',
      }}>
        NEXUS
      </p>
      <div style={{
        width: 28, height: 28,
        border: '2px solid #e5e5e5', borderTopColor: '#000',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

// ── 404 page ──────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 66,
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 100, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>
        404
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, color: 'var(--mid)' }}>
        Page not found
      </p>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 300, lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        style={{
          fontSize: 14, fontWeight: 500, color: '#fff',
          background: '#000', padding: '11px 24px',
          borderRadius: '999px', marginTop: 8, textDecoration: 'none',
        }}
      >
        Go home →
      </a>
    </div>
  )
}

// ── All routes ────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isLoading } = useApp()

  if (isLoading) return <LoadingScreen />

  return (
    // Each lazy-loaded page gets its own ErrorBoundary so one broken page
    // doesn't crash the entire application
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Auth — no navbar, redirect logged-in users away */}
        <Route path="/auth" element={
          <PublicRoute><Auth /></PublicRoute>
        } />

        {/* Messages — full height, no footer */}
        <Route path="/messages" element={
          <PrivateRoute><><Navbar /><Messages /></></PrivateRoute>
        } />
        <Route path="/messages/:otherId" element={
          <PrivateRoute><><Navbar /><Messages /></></PrivateRoute>
        } />

        {/* Public pages */}
        <Route path="/"              element={<WithLayout><Home /></WithLayout>} />
        <Route path="/browse"        element={<WithLayout><Browse /></WithLayout>} />
        <Route path="/freelancer/:id" element={<WithLayout><FreelancerProfile /></WithLayout>} />
        <Route path="/jobs"          element={<WithLayout><Jobs /></WithLayout>} />
        <Route path="/job/:id"       element={<WithLayout><JobDetail /></WithLayout>} />

        {/* Protected pages */}
        <Route path="/post-job" element={
          <PrivateRoute><WithLayout><PostJob /></WithLayout></PrivateRoute>
        } />
        <Route path="/wallet" element={
          <PrivateRoute><WithLayout><Wallet /></WithLayout></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute><WithLayout><Dashboard /></WithLayout></PrivateRoute>
        } />
        <Route path="/contracts" element={
          <PrivateRoute><WithLayout><Contracts /></WithLayout></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><WithLayout><Profile /></WithLayout></PrivateRoute>
        } />
        <Route path="/support" element={
          <PrivateRoute><WithLayout><Support /></WithLayout></PrivateRoute>
        } />
        <Route path="/notifications" element={
          <PrivateRoute><WithLayout><Notifications /></WithLayout></PrivateRoute>
        } />

        {/* Admin — protected by being hidden from nav, not by auth guard */}
        <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />

        {/* 404 catch-all */}
        <Route path="*" element={<WithLayout><NotFound /></WithLayout>} />
      </Routes>
      <ToastContainer />
    </Suspense>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    // Top-level ErrorBoundary catches any crash that escapes individual pages
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}
