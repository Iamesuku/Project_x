import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Navbar.module.css'

function NotifPanel({ onClose }) {
  const { notifications, markNotifsRead, clearNotif } = useApp()
  useEffect(() => { markNotifsRead() }, [])
  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdownHead}>
        <span className={styles.dropdownTitle}>Notifications</span>
        <button className={styles.dropdownClear} onClick={() => notifications.forEach(n => clearNotif(n.id))}>Clear all</button>
      </div>
      {notifications.length === 0
        ? <p className={styles.dropdownEmpty}>You're all caught up ✓</p>
        : notifications.slice(0,6).map(n => (
          <Link key={n.id} to={n.link} className={styles.notifRow} onClick={onClose}>
            <div className={`${styles.notifDot} ${n.read ? styles.notifRead : ''}`} />
            <div className={styles.notifInfo}>
              <p className={styles.notifText}>{n.text}</p>
              <p className={styles.notifTime}>{new Date(n.ts).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
            </div>
          </Link>
        ))
      }
      <Link to="/notifications" className={styles.notifSeeAll} onClick={onClose}>
        View all notifications →
      </Link>
    </div>
  )
}

function ProfileMenu({ user, onClose }) {
  const { logout } = useApp()
  const navigate = useNavigate()
  return (
    <div className={styles.dropdown}>
      <div className={styles.profileMenuHead}>
        <div className={styles.pmAvatar}>{user.avatar}</div>
        <div>
          <p className={styles.pmName}>{user.name}</p>
          <p className={styles.pmRole}>{user.role === 'client' ? 'Client' : 'Freelancer'}</p>
        </div>
      </div>
      <div className={styles.dropdownDivider}/>
      {[['/dashboard','Dashboard'],['/contracts','My Contracts'],['/wallet','Wallet'],['/messages','Messages'],['/profile','Settings']].map(([to,label])=>(
        <Link key={to} to={to} className={styles.menuRow} onClick={onClose}>{label}</Link>
      ))}
      <div className={styles.dropdownDivider}/>
      <button className={styles.menuRowDanger} onClick={()=>{ logout(); navigate('/auth'); onClose() }}>Log out</button>
    </div>
  )
}

export default function Navbar() {
  const { user, wallet, unreadNotifCount, getContacts } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const contacts = getContacts()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMenuOpen(false); setNotifOpen(false); setProfileOpen(false) }, [location])
  useEffect(() => {
    function h(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const solid = !isHome || scrolled
  return (
    <header className={`${styles.header} ${solid ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>NEXUS</Link>
        <nav className={styles.nav}>
          <Link to="/browse"    className={styles.navLink}>Browse Talent</Link>
          <Link to="/jobs"      className={styles.navLink}>Find Work</Link>
          <Link to="/post-job"  className={styles.navLink}>Post a Job</Link>
          <Link to="/contracts" className={styles.navLink}>Contracts</Link>
        </nav>
        <div className={styles.actions}>
          <Link to="/wallet" className={styles.walletBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>
            ${wallet.balance.toFixed(2)}
          </Link>
          <Link to="/messages" className={styles.iconBtn} title="Messages">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {contacts.length > 0 && <span className={styles.badge}/>}
          </Link>
          <div className={styles.iconWrap} ref={notifRef}>
            <button className={styles.iconBtn} onClick={() => { setNotifOpen(v=>!v); setProfileOpen(false) }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadNotifCount > 0 && <span className={styles.badge}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>}
            </button>
            {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)}/>}
          </div>
          <div className={styles.iconWrap} ref={profileRef}>
            <button className={styles.avatarBtn} onClick={() => { setProfileOpen(v=>!v); setNotifOpen(false) }}>
              <div className={styles.avatar}>{user.avatar}</div>
            </button>
            {profileOpen && <ProfileMenu user={user} onClose={() => setProfileOpen(false)}/>}
          </div>
        </div>
        <button className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`} onClick={() => setMenuOpen(v=>!v)}>
          <span/><span/><span/>
        </button>
      </div>
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileOpen : ''}`}>
        <Link to="/browse"    className={styles.mobileLink}>Browse Talent</Link>
        <Link to="/jobs"      className={styles.mobileLink}>Find Work</Link>
        <Link to="/post-job"  className={styles.mobileLink}>Post a Job</Link>
        <Link to="/contracts" className={styles.mobileLink}>Contracts</Link>
        <Link to="/messages"  className={styles.mobileLink}>Messages</Link>
        <Link to="/wallet"    className={styles.mobileLink}>Wallet · ${wallet.balance.toFixed(2)}</Link>
        <div className={styles.mobileDivider}/>
        <Link to="/dashboard" className={styles.mobileLink}>Dashboard</Link>
        <Link to="/profile"   className={styles.mobileLink}>Settings</Link>
      </div>
    </header>
  )
}
