import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  sendMessage    as rtdbSendMessage,
  subscribeToThread,
  subscribeToThreads,
} from '../firebase/messageService'
import styles from './Messages.module.css'

function timeAgo(ts) {
  // ts may be a ms-epoch number (RTDB) or ISO string (legacy)
  const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(typeof ts === 'number' ? ts : ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function sameDay(ts1, ts2) {
  const d1 = typeof ts1 === 'number' ? new Date(ts1) : new Date(ts1)
  const d2 = typeof ts2 === 'number' ? new Date(ts2) : new Date(ts2)
  return d1.toDateString() === d2.toDateString()
}

export default function Messages() {
  const { otherId }  = useParams()
  const navigate     = useNavigate()
  const { user, freelancers } = useApp()

  const [contacts,  setContacts]  = useState([])   // from RTDB threads
  const [thread,    setThread]    = useState([])    // messages in active thread
  const [text,      setText]      = useState('')
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // ── Real-time thread list (sidebar contacts) ──────────────────────────
  useEffect(() => {
    if (!user?.id || user.id === 'demo') return
    const unsub = subscribeToThreads(user.id, setContacts)
    return unsub
  }, [user?.id])

  // ── Real-time messages in the active thread ───────────────────────────
  useEffect(() => {
    if (!otherId || !user?.id || user.id === 'demo') {
      setThread([])
      return
    }
    const unsub = subscribeToThread(user.id, otherId, setThread)
    return unsub
  }, [otherId, user?.id])

  // ── Scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [thread.length, otherId])

  // ── Resolve active contact (from live contacts list or seed freelancers) ──
  const activeContact = otherId
    ? contacts.find(c => c.otherId === otherId)
      ? {
          id:     contacts.find(c => c.otherId === otherId).otherId,
          name:   contacts.find(c => c.otherId === otherId).otherName,
          avatar: contacts.find(c => c.otherId === otherId).otherAvatar,
          title:  '',
        }
      : freelancers.find(f => f.id === otherId)
    : null

  // ── Build display-ready contact rows from RTDB threads ───────────────
  const displayContacts = contacts.map(t => ({
    id:      t.otherId,
    name:    t.otherName   || `User ${t.otherId?.slice(0, 6)}`,
    avatar:  t.otherAvatar || t.otherId?.slice(0, 2).toUpperCase(),
    title:   '',
    lastMsg: t.lastText ? {
      senderId: t.lastSenderId,
      text:     t.lastText,
      ts:       t.lastTimestamp,
    } : null,
    unread:  t.unread || 0,
  }))

  const filteredContacts = displayContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Send ──────────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !otherId || !activeContact) return

    const toUser = {
      id:     activeContact.id,
      name:   activeContact.name,
      avatar: activeContact.avatar || activeContact.id?.slice(0, 2).toUpperCase(),
    }

    const fromUser = {
      id:     user.id,
      name:   user.name,
      avatar: user.avatar,
    }

    await rtdbSendMessage(fromUser, toUser, text.trim())
    setText('')
    inputRef.current?.focus()
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.sideHead}>
            <h2 className={styles.sideTitle}>Messages</h2>
            <button
              className={styles.newBtn}
              onClick={() => setShowNew(v => !v)}
              title="New conversation"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5"  x2="12" y2="19"/>
                <line x1="5"  y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* New conversation picker */}
          {showNew && (
            <div className={styles.newConvo}>
              <p className={styles.newConvoLabel}>Start a conversation with:</p>
              <div className={styles.newConvoList}>
                {freelancers.slice(0, 8).map(f => (
                  <button
                    key={f.id}
                    className={styles.newConvoItem}
                    onClick={() => { navigate(`/messages/${f.id}`); setShowNew(false) }}
                  >
                    <div className={styles.contactAvatar}>{f.avatar}</div>
                    <div>
                      <p className={styles.contactName}>{f.name}</p>
                      <p className={styles.contactTitle}>{f.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className={styles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Contact list */}
          <div className={styles.contactList}>
            {filteredContacts.length === 0 && !showNew && (
              <div className={styles.noContacts}>
                <p>No conversations yet.</p>
                <button className={styles.startBtn} onClick={() => setShowNew(true)}>
                  Start one →
                </button>
              </div>
            )}
            {filteredContacts.map(c => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`${styles.contactRow} ${otherId === c.id ? styles.contactActive : ''}`}
              >
                <div className={styles.contactAvatar}>{c.avatar}</div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactTop}>
                    <span className={styles.contactName}>{c.name}</span>
                    <span className={styles.contactTime}>
                      {c.lastMsg ? timeAgo(c.lastMsg.ts) : ''}
                    </span>
                  </div>
                  <p className={styles.contactPreview}>
                    {c.lastMsg
                      ? (c.lastMsg.senderId === user.id ? 'You: ' : '') + c.lastMsg.text
                      : ''}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className={styles.unreadBadge}>{c.unread}</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Thread panel ── */}
        <div className={styles.thread}>
          {!activeContact ? (
            <div className={styles.emptyThread}>
              <div className={styles.emptyIcon}>✉</div>
              <h3 className={styles.emptyTitle}>Your messages</h3>
              <p className={styles.emptySub}>
                Select a conversation or start a new one with a student.
              </p>
              <button className={styles.emptyBtn} onClick={() => setShowNew(true)}>
                New conversation →
              </button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className={styles.threadHead}>
                <div className={styles.threadAvatar}>{activeContact.avatar}</div>
                <div className={styles.threadMeta}>
                  <p className={styles.threadName}>{activeContact.name}</p>
                  {activeContact.title && (
                    <p className={styles.threadTitle}>{activeContact.title}</p>
                  )}
                </div>
                <Link to={`/freelancer/${activeContact.id}`} className={styles.viewProfile}>
                  View profile →
                </Link>
              </div>

              {/* Messages */}
              <div className={styles.messages}>
                {thread.length === 0 && (
                  <div className={styles.noMessages}>
                    <p>No messages yet. Say hello!</p>
                  </div>
                )}
                {thread.map((msg, i) => {
                  const isMe     = msg.senderId === user.id
                  const showDate = i === 0 || !sameDay(msg.ts, thread[i - 1].ts)
                  return (
                    <div key={msg.id || i}>
                      {showDate && (
                        <p className={styles.dateDivider}>
                          {new Date(typeof msg.ts === 'number' ? msg.ts : msg.ts).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric',
                          })}
                        </p>
                      )}
                      <div className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ''}`}>
                        {!isMe && (
                          <div className={styles.msgAvatar}>{activeContact.avatar}</div>
                        )}
                        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                          <p className={styles.bubbleText}>{msg.text}</p>
                          <p className={styles.bubbleTime}>{timeAgo(msg.ts)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose bar */}
              <form className={styles.compose} onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  className={styles.composeInput}
                  placeholder={`Message ${activeContact.name}…`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                  autoComplete="off"
                />
                <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
