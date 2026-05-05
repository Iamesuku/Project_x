import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import styles from './Navbar.module.css'

// ── Notification dropdown ─────────────────────────────────────────────────
function NotifPanel({ onClose }) {
  const { notifications, markNotifsRead, clearNotif } = useApp()

  // Mark all read when panel opens
  useEffect(() => { markNotifsRead() }, []) // eslint-disable-line

  return (
    <div className={styles.dropdown} role="menu" aria-label="Notifications">
      <div className={styles.dropdownHead}>
        <span className={styles.dropdownTitle}>Notifications</span>
        {notifications.length > 0 && (
          <button
            className={styles.dropdownClear}
            onClick={() => notifications.forEach(n => clearNotif(n.id))}
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className={styles.dropdownEmpty}>You're all caught up ✓</p>
      ) : (
        notifications.slice(0, 6).map(n => (
          <Link
            key={n.id}
            to={n.link || '/dashboard'}
            className={`${styles.notifRow} ${n.read ? styles.notifRead : ''}`}
            onClick={onClose}
            role="menuitem"
          >
            <div className={`${styles.notifDot} ${n.read ? styles.notifDotRead : ''}`} />
            <div className={styles.notifInfo}>
              <p className={styles.notifText}>{n.text}</p>
              <p className={styles.notifTime}>
                {n.ts
                  ? new Date(n.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''}
              </p>
            </div>
          </Link>
        ))
      )}

      <Link to="/notifications" className={styles.notifSeeAll} onClick={onClose}>
        View all notifications →
      </Link>
    </div>
  )
}

// ── Profile dropdown ──────────────────────────────────────────────────────
function ProfileMenu({ user, onClose }) {
  const { logout } = useApp()
  const navigate   = useNavigate()

  async function handleLogout() {
    onClose()
    await logout()
    navigate('/auth')
  }

  const links = [
    ['/dashboard', 'Dashboard'],
    ['/contracts', 'My Contracts'],
    ['/wallet',    'Wallet'],
    ['/messages',  'Messages'],
    ['/profile',   'Settings'],
  ]

  return (
    <div className={styles.dropdown} role="menu" aria-label="Account menu">
      <div className={styles.profileMenuHead}>
        <div className={styles.pmAvatar} aria-hidden="true">{user.avatar}</div>
        <div>
          <p className={styles.pmName}>{user.name}</p>
          <p className={styles.pmRole}>{user.role === 'client' ? 'Client' : 'Freelancer'}</p>
        </div>
      </div>
      <div className={styles.dropdownDivider} />
      {links.map(([to, label]) => (
        <Link key={to} to={to} className={styles.menuRow} onClick={onClose} role="menuitem">
          {label}
        </Link>
      ))}
      <div className={styles.dropdownDivider} />
      <button className={styles.menuRowDanger} onClick={handleLogout} role="menuitem">
        Log out
      </button>
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, wallet, isLoggedIn, unreadNotifCount, getContacts } = useApp()
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const location    = useLocation()
  const isHome      = location.pathname === '/'
  const notifRef    = useRef(null)
  const profileRef  = useRef(null)

  // Unread message count from live contacts
  const unreadMessages = isLoggedIn
    ? getContacts().reduce((s, c) => s + (c.unread || 0), 0)
    : 0

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
    setProfileOpen(false)
  }, [location])

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const solid = !isHome || scrolled
  const currency = wallet?.currency || 'NGN'
  const balance  = wallet?.balance  ?? 0

  return (
    <header className={`${styles.header} ${solid ? styles.scrolled : ''}`} role="banner">
      <div className={`container ${styles.inner}`}>

        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="NEXUS home">
          NEXUS
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/browse"    className={styles.navLink}>Browse Talent</Link>
          <Link to="/jobs"      className={styles.navLink}>Find Work</Link>
          {isLoggedIn && (
            <>
              <Link to="/post-job"  className={styles.navLink}>Post a Job</Link>
              <Link to="/contracts" className={styles.navLink}>Contracts</Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {isLoggedIn ? (
            <>
              {/* Wallet balance */}
              <Link to="/wallet" className={styles.walletBtn} aria-label={`Wallet: ${formatCurrency(balance, currency)}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
                {formatCurrency(balance, currency, { compact: true })}
              </Link>

              {/* Messages */}
              <Link to="/messages" className={styles.iconBtn} title="Messages" aria-label="Messages">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {unreadMessages > 0 && (
                  <span className={styles.badge} aria-label={`${unreadMessages} unread messages`}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <div className={styles.iconWrap} ref={notifRef}>
                <button
                  className={styles.iconBtn}
                  onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
                  aria-label={`Notifications${unreadNotifCount > 0 ? `, ${unreadNotifCount} unread` : ''}`}
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadNotifCount > 0 && (
                    <span className={styles.badge}>
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>
                {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
              </div>

              {/* Profile menu */}
              <div className={styles.iconWrap} ref={profileRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <div className={styles.avatar} aria-hidden="true">{user.avatar}</div>
                </button>
                {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)} />}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className={styles.signInLink}>Log in</Link>
              <Link to="/auth" className={styles.signUpBtn}>Get started</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileOpen : ''}`} aria-hidden={!menuOpen}>
        <Link to="/browse"    className={styles.mobileLink}>Browse Talent</Link>
        <Link to="/jobs"      className={styles.mobileLink}>Find Work</Link>
        {isLoggedIn ? (
          <>
            <Link to="/post-job"   className={styles.mobileLink}>Post a Job</Link>
            <Link to="/contracts"  className={styles.mobileLink}>Contracts</Link>
            <Link to="/messages"   className={styles.mobileLink}>
              Messages
              {unreadMessages > 0 && <span className={styles.mobileBadge}>{unreadMessages}</span>}
            </Link>
            <Link to="/wallet"     className={styles.mobileLink}>
              Wallet · {formatCurrency(balance, currency)}
            </Link>
            <div className={styles.mobileDivider} />
            <Link to="/dashboard"  className={styles.mobileLink}>Dashboard</Link>
            <Link to="/profile"    className={styles.mobileLink}>Settings</Link>
            <div className={styles.mobileDivider} />
            <Link to="/notifications" className={styles.mobileLink}>
              Notifications
              {unreadNotifCount > 0 && <span className={styles.mobileBadge}>{unreadNotifCount}</span>}
            </Link>
          </>
        ) : (
          <>
            <div className={styles.mobileDivider} />
            <Link to="/auth" className={styles.mobileLink}>Log in</Link>
            <Link to="/auth" className={`${styles.mobileLink} ${styles.mobileLinkPrimary}`}>Get started</Link>
          </>
        )}
      </div>
    </header>
  )
}
