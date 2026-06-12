import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  sendMessage      as rtdbSendMessage,
  uploadMessageFile,
  subscribeToThread,
  subscribeToThreads,
  markThreadRead,
} from '../firebase/messageService'
import Avatar from '../components/Avatar'
import styles from './Messages.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(typeof ts === 'number' ? ts : ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function sameDay(ts1, ts2) {
  const d1 = new Date(typeof ts1 === 'number' ? ts1 : ts1)
  const d2 = new Date(typeof ts2 === 'number' ? ts2 : ts2)
  return d1.toDateString() === d2.toDateString()
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type = '') {
  if (type.startsWith('image/'))       return '🖼️'
  if (type === 'application/pdf')      return '📄'
  if (type.includes('word'))           return '📝'
  if (type.includes('sheet') || type.includes('excel')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📑'
  if (type.startsWith('video/'))       return '🎬'
  if (type.startsWith('audio/'))       return '🎵'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  return '📎'
}

// ── Attachment bubble ──────────────────────────────────────────────────────
function AttachmentBubble({ attachment, isMe }) {
  const isImage = attachment.type?.startsWith('image/')
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.attachBubble} ${isMe ? styles.attachBubbleMe : ''}`}
    >
      {isImage ? (
        <img src={attachment.url} alt={attachment.name} className={styles.attachImage} />
      ) : (
        <div className={styles.attachFile}>
          <span className={styles.attachIcon}>{fileIcon(attachment.type)}</span>
          <div className={styles.attachMeta}>
            <p className={styles.attachName}>{attachment.name}</p>
            {attachment.size && (
              <p className={styles.attachSize}>{formatBytes(attachment.size)}</p>
            )}
          </div>
          <span className={styles.attachDl}>↓</span>
        </div>
      )}
    </a>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Messages() {
  const { otherId }  = useParams()
  const navigate     = useNavigate()
  const { user, freelancers } = useApp()

  const [contacts,  setContacts]  = useState([])
  const [thread,    setThread]    = useState([])
  const [text,      setText]      = useState('')
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)

  // File attachment state
  const [pendingFile,    setPendingFile]    = useState(null)   // File object
  const [uploadProgress, setUploadProgress] = useState(null)   // 0-100 | null
  const [uploading,      setUploading]      = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const fileInputRef = useRef(null)

  // ── Real-time thread list (sidebar contacts) ───────────────────────────
  useEffect(() => {
    if (!user?.id || user.id === 'demo') return
    const unsub = subscribeToThreads(user.id, setContacts)
    return unsub
  }, [user?.id])

  // ── Real-time messages in the active thread ────────────────────────────
  useEffect(() => {
    if (!otherId || !user?.id || user.id === 'demo') {
      setThread([])
      return
    }
    const unsub = subscribeToThread(user.id, otherId, setThread)
    markThreadRead(user.id, otherId).catch(() => {})
    return unsub
  }, [otherId, user?.id])

  // ── Scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [thread.length, otherId])

  // ── Resolve active contact ─────────────────────────────────────────────
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

  // ── Build display-ready contact rows ──────────────────────────────────
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

  // ── File picker handler ────────────────────────────────────────────────
  function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // 20 MB cap
    if (file.size > 20 * 1024 * 1024) {
      alert('File is too large. Maximum size is 20 MB.')
      return
    }
    setPendingFile(file)
    e.target.value = ''   // reset so same file can be re-selected
  }

  function clearPending() {
    setPendingFile(null)
    setUploadProgress(null)
  }

  // ── Send (text or file) ────────────────────────────────────────────────
  async function handleSend(e) {
    e?.preventDefault()
    if ((!text.trim() && !pendingFile) || !otherId || !activeContact) return

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

    let attachment = null

    if (pendingFile) {
      setUploading(true)
      setUploadProgress(0)
      try {
        const threadId = [user.id, otherId].sort().join('_')
        attachment = await uploadMessageFile(pendingFile, threadId, setUploadProgress)
      } catch {
        alert('File upload failed. Please try again.')
        setUploading(false)
        setUploadProgress(null)
        return
      }
      setUploading(false)
      setUploadProgress(null)
      setPendingFile(null)
    }

    await rtdbSendMessage(fromUser, toUser, text.trim(), attachment)
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
                    <Avatar src={f.avatar} name={f.name} size={36} className={styles.contactAvatar} />
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
                <Avatar src={c.avatar} name={c.name} size={40} className={styles.contactAvatar} />
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
                <Avatar src={activeContact.avatar} name={activeContact.name} size={40} className={styles.threadAvatar} />
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
                          <Avatar src={activeContact.avatar} name={activeContact.name} size={32} className={styles.msgAvatar} />
                        )}
                        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                          {/* File attachment */}
                          {msg.attachment && (
                            <AttachmentBubble attachment={msg.attachment} isMe={isMe} />
                          )}
                          {/* Text body (may be empty for file-only messages) */}
                          {msg.text && (
                            <p className={styles.bubbleText}>{msg.text}</p>
                          )}
                          <p className={styles.bubbleTime}>{timeAgo(msg.ts)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Pending file preview */}
              {pendingFile && (
                <div className={styles.pendingFile}>
                  <span className={styles.pendingIcon}>{fileIcon(pendingFile.type)}</span>
                  <div className={styles.pendingMeta}>
                    <p className={styles.pendingName}>{pendingFile.name}</p>
                    <p className={styles.pendingSize}>{formatBytes(pendingFile.size)}</p>
                  </div>
                  {uploadProgress !== null && (
                    <div className={styles.progressTrack}>
                      <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  {!uploading && (
                    <button className={styles.clearFile} onClick={clearPending} title="Remove file">✕</button>
                  )}
                </div>
              )}

              {/* Compose bar */}
              <form className={styles.compose} onSubmit={handleSend}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className={styles.hiddenInput}
                  onChange={handleFilePick}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.mp4,.mov"
                />
                {/* Attach button */}
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a file or document"
                  disabled={uploading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>

                <input
                  ref={inputRef}
                  className={styles.composeInput}
                  placeholder={`Message ${activeContact.name}…`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                  autoComplete="off"
                  disabled={uploading}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={(!text.trim() && !pendingFile) || uploading}
                >
                  {uploading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinnerIcon}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
