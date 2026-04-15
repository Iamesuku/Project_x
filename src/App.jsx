import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ToastContainer from './components/Toast'
import Home              from './pages/Home'
import Auth              from './pages/Auth'
import Browse            from './pages/Browse'
import Jobs              from './pages/Jobs'
import PostJob           from './pages/PostJob'
import Wallet            from './pages/Wallet'
import Dashboard         from './pages/Dashboard'
import JobDetail         from './pages/JobDetail'
import FreelancerProfile from './pages/FreelancerProfile'
import Messages          from './pages/Messages'
import Contracts         from './pages/Contracts'
import Profile           from './pages/Profile'
import AdminDashboard    from './pages/AdminDashboard'
import Support           from './pages/Support'
import Notifications    from './pages/Notifications'

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
  if (isLoading) return null               // wait for Firebase auth to resolve
  return isLoggedIn ? children : <Navigate to="/auth" replace />
}

function PublicRoute({ children }) {
  const { isLoggedIn, isLoading } = useApp()
  if (isLoading) return null               // wait for Firebase auth to resolve
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children
}

// ── Loading screen ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      background: 'var(--bg, #fff)',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{
        fontFamily: 'var(--font-display, sans-serif)',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        color: 'var(--black, #000)',
      }}>
        nexus
      </p>
      <div style={{
        width: 32,
        height: 32,
        border: '2px solid #e5e5e5',
        borderTopColor: '#000',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isLoading } = useApp()

  if (isLoading) return <LoadingScreen />

  return (
    <>
      <Routes>
        {/* Auth — no navbar, redirect if already logged in */}
        <Route path="/auth" element={
          <PublicRoute><Auth /></PublicRoute>
        } />

        {/* Messages — navbar only, full height */}
        <Route path="/messages" element={
          <PrivateRoute><><Navbar /><Messages /></></PrivateRoute>
        } />
        <Route path="/messages/:otherId" element={
          <PrivateRoute><><Navbar /><Messages /></></PrivateRoute>
        } />

        {/* Public pages */}
        <Route path="/"            element={<WithLayout><Home /></WithLayout>} />
        <Route path="/browse"      element={<WithLayout><Browse /></WithLayout>} />
        <Route path="/freelancer/:id" element={<WithLayout><FreelancerProfile /></WithLayout>} />
        <Route path="/jobs"        element={<WithLayout><Jobs /></WithLayout>} />
        <Route path="/job/:id"     element={<WithLayout><JobDetail /></WithLayout>} />

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

        {/* Admin */}
        <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />

        {/* 404 */}
        <Route path="*" element={<WithLayout><NotFound /></WithLayout>} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

function NotFound() {
  return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, paddingTop:66 }}>
      <p style={{ fontFamily:'var(--font-display)', fontSize:100, fontWeight:300, color:'var(--border)', lineHeight:1 }}>404</p>
      <p style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:300, color:'var(--mid)' }}>Page not found</p>
      <p style={{ fontSize:14, color:'var(--muted)', textAlign:'center', maxWidth:300, lineHeight:1.6 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" style={{ fontSize:14, fontWeight:500, color:'var(--white)', background:'var(--black)', padding:'11px 24px', borderRadius:'var(--radius-xl)', marginTop:8 }}>Go home →</a>
    </div>
  )
}

