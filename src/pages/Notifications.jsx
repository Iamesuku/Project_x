import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Notifications.module.css'

// ── Icon map by notification category ─────────────────────────────────────
function getNotifMeta(text = '') {
  const t = text.toLowerCase()
  if (t.includes('proposal'))    return { icon: '📋', type: 'proposal',  label: 'Proposal' }
  if (t.includes('contract'))    return { icon: '📄', type: 'contract',  label: 'Contract' }
  if (t.includes('payment') || t.includes('released') || t.includes('₦') || t.includes('wallet') || t.includes('funded'))
                                  return { icon: '💰', type: 'payment',   label: 'Payment' }
  if (t.includes('message'))     return { icon: '💬', type: 'message',   label: 'Message' }
  if (t.includes('dispute') || t.includes('ticket'))
                                  return { icon: '⚠️', type: 'dispute',   label: 'Dispute' }
  if (t.includes('job') || t.includes('posted') || t.includes('live'))
                                  return { icon: '💼', type: 'job',       label: 'Job' }
  if (t.includes('complete') || t.includes('approved'))
                                  return { icon: '✅', type: 'complete',  label: 'Completed' }
  return                                 { icon: '🔔', type: 'general',  label: 'Notification' }
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'Just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'payment',  label: 'Payments' },
  { value: 'contract', label: 'Contracts' },
  { value: 'message',  label: 'Messages' },
  { value: 'dispute',  label: 'Disputes' },
]

// Rich demo data to supplement live notifications for screenshots
const RICH_SEED = [
  { id:'sn1', text:"Your proposal was accepted by Alex J. for \"Build a SaaS Dashboard\"", read:false, ts: new Date(Date.now() - 1000*60*8).toISOString(),  link:'/contracts' },
  { id:'sn2', text:"Payment of ₦5,000 released for \"Academic Tutoring – Calculus\"",   read:false, ts: new Date(Date.now() - 1000*60*47).toISOString(), link:'/wallet' },
  { id:'sn3', text:"New message from Chidi A. — \"Hi, can we schedule the first session?\"", read:false, ts: new Date(Date.now() - 1000*60*120).toISOString(), link:'/messages' },
  { id:'sn4', text:"Contract marked complete — \"Event Photography for CS Dinner\"",    read:false, ts: new Date(Date.now() - 1000*60*60*5).toISOString(),  link:'/contracts' },
  { id:'sn5', text:"Dispute ticket NXS-001 is under review. Response expected in 24 hrs.", read:true,  ts: new Date(Date.now() - 1000*60*60*12).toISOString(), link:'/support' },
  { id:'sn6', text:"Amara O. submitted a proposal on \"Brand Identity for Student Union\"", read:true, ts: new Date(Date.now() - 1000*60*60*24).toISOString(), link:'/dashboard' },
  { id:'sn7', text:"Your job \"Manage Instagram for Faculty Association\" is now live",    read:true,  ts: new Date(Date.now() - 1000*60*60*36).toISOString(), link:'/jobs' },
  { id:'sn8', text:"₦300 added to your wallet successfully",                              read:true,  ts: new Date(Date.now() - 1000*60*60*48).toISOString(), link:'/wallet' },
]

export default function Notifications() {
  const { notifications, markNotifsRead, clearNotif } = useApp()
  const [filter,      setFilter]      = useState('all')
  const [localRead,   setLocalRead]   = useState({})   // track individual "mark as read" per id

  // Merge live notifications + rich seed (deduplicated by id)
  const liveIds = new Set(notifications.map(n => n.id))
  const merged  = [
    ...notifications,
    ...RICH_SEED.filter(sn => !liveIds.has(sn.id)),
  ]

  // Apply localRead overrides
  const allNotifs = merged.map(n => ({
    ...n,
    read: localRead[n.id] !== undefined ? localRead[n.id] : n.read,
  }))

  const unreadCount = allNotifs.filter(n => !n.read).length

  // Filter by type
  const displayed = filter === 'all'
    ? allNotifs
    : allNotifs.filter(n => getNotifMeta(n.text).type === filter)

  function handleMarkAllRead() {
    markNotifsRead()                          // updates context
    const overrides = {}
    allNotifs.forEach(n => { overrides[n.id] = true })
    setLocalRead(overrides)
  }

  function handleMarkOne(id) {
    setLocalRead(p => ({ ...p, [id]: true }))
  }

  function handleClear(id) {
    clearNotif(id)
    setLocalRead(p => { const c = { ...p }; delete c[id]; return c })
  }

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── Page header ── */}
        <div className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Activity feed</p>
            <h1 className={styles.title}>
              Notifications
              {unreadCount > 0 && (
                <span className={styles.titleBadge}>{unreadCount} new</span>
              )}
            </h1>
          </div>
          <div className={styles.headActions}>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                ✓ Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* ── Summary strip ── */}
        <div className={styles.summaryStrip}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>{allNotifs.length}</span>
            <span className={styles.summarySub}>Total</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryNum} ${styles.summaryUnread}`}>{unreadCount}</span>
            <span className={styles.summarySub}>Unread</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>{allNotifs.length - unreadCount}</span>
            <span className={styles.summarySub}>Read</span>
          </div>
        </div>

        {/* ── Category filter pills ── */}
        <div className={styles.filterRow}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className={styles.filterCount}>
                  {allNotifs.filter(n => getNotifMeta(n.text).type === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Notification list ── */}
        {displayed.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <p className={styles.emptyTitle}>All caught up</p>
            <p className={styles.emptySub}>
              No {filter !== 'all' ? filter : ''} notifications yet. We'll let you know when something happens.
            </p>
            <Link to="/dashboard" className={styles.emptyBtn}>Go to Dashboard →</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {displayed.map((n, idx) => {
              const meta    = getNotifMeta(n.text)
              const isUnread = !n.read
              return (
                <div
                  key={n.id}
                  className={`${styles.card} ${isUnread ? styles.cardUnread : ''}`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Unread stripe */}
                  {isUnread && <div className={styles.unreadStripe} />}

                  {/* Icon bubble */}
                  <div className={`${styles.iconBubble} ${styles[`icon_${meta.type}`]}`}>
                    <span className={styles.iconEmoji}>{meta.icon}</span>
                  </div>

                  {/* Content */}
                  <div className={styles.content}>
                    <div className={styles.contentTop}>
                      <span className={`${styles.typePill} ${styles[`pill_${meta.type}`]}`}>
                        {meta.label}
                      </span>
                      {isUnread && <span className={styles.newDot} />}
                    </div>
                    <p className={`${styles.text} ${isUnread ? styles.textUnread : ''}`}>
                      {n.text}
                    </p>
                    <div className={styles.meta}>
                      <span className={styles.timestamp}>
                        🕐 {timeAgo(n.ts)}
                      </span>
                      <span className={styles.metaDot}>·</span>
                      <Link to={n.link || '/dashboard'} className={styles.metaLink}>
                        View →
                      </Link>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.actions}>
                    {isUnread && (
                      <button
                        className={styles.readBtn}
                        onClick={() => handleMarkOne(n.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className={styles.clearBtn}
                      onClick={() => handleClear(n.id)}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer ── */}
        {displayed.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Showing {displayed.length} notification{displayed.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
