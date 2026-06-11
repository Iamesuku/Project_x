// ── Message Service ────────────────────────────────────────────────────────
// Uses Firebase Realtime Database for low-latency chat.
// Supports plain text messages AND file/document attachments via Storage.
import {
  ref as dbRef,
  push,
  set,
  onValue,
  serverTimestamp,
} from 'firebase/database'
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { rtdb, storage } from './config'

/** Returns the canonical thread ID (alphabetically sorted) */
function getThreadId(idA, idB) {
  return [idA, idB].sort().join('_')
}

/**
 * uploadMessageFile — uploads a file to Firebase Storage and returns its URL.
 *
 * @param {File}     file
 * @param {string}   threadId
 * @param {function(number):void} [onProgress]  — called with 0-100 percent
 * @returns {Promise<{url:string, name:string, size:number, type:string}>}
 */
export function uploadMessageFile(file, threadId, onProgress) {
  return new Promise((resolve, reject) => {
    const path    = `message-attachments/${threadId}/${Date.now()}_${file.name}`
    const sRef    = storageRef(storage, path)
    const task    = uploadBytesResumable(sRef, file)

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        onProgress?.(pct)
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({ url, name: file.name, size: file.size, type: file.type })
      }
    )
  })
}

/**
 * sendMessage — pushes a message to RTDB and updates both users' thread summaries.
 *
 * @param {{ id: string, name: string, avatar: string }} fromUser
 * @param {{ id: string, name: string, avatar: string }} toUser
 * @param {string}  text
 * @param {{ url: string, name: string, size: number, type: string } | null} [attachment]
 */
export async function sendMessage(fromUser, toUser, text, attachment = null) {
  const threadId = getThreadId(fromUser.id, toUser.id)
  const now      = Date.now()

  // ── 1. Push the message to the shared transcript ─────────────────────────
  const msgRef    = dbRef(rtdb, `messages/${threadId}`)
  const newMsgRef = push(msgRef)
  await set(newMsgRef, {
    id:         newMsgRef.key,
    senderId:   fromUser.id,
    text:       text || '',
    attachment: attachment || null,
    ts:         now,
  })

  // ── 2. Build thread summary preview text ─────────────────────────────────
  const previewText = attachment
    ? `📎 ${attachment.name}`
    : text

  const summary = {
    lastText:      previewText,
    lastTimestamp: now,
    lastSenderId:  fromUser.id,
  }

  // ── 3. Update sender's thread entry ──────────────────────────────────────
  await set(dbRef(rtdb, `threads/${fromUser.id}/${toUser.id}`), {
    ...summary,
    otherId:     toUser.id,
    otherName:   toUser.name,
    otherAvatar: toUser.avatar,
    unread: 0,
  })

  // ── 4. Update recipient's thread entry (increment unread) ─────────────────
  const recipRef = dbRef(rtdb, `threads/${toUser.id}/${fromUser.id}`)
  await new Promise((resolve) => {
    onValue(
      recipRef,
      (snap) => {
        const existing = snap.val() || {}
        set(recipRef, {
          ...summary,
          otherId:     fromUser.id,
          otherName:   fromUser.name,
          otherAvatar: fromUser.avatar,
          unread: (existing.unread || 0) + 1,
        }).then(resolve)
      },
      { onlyOnce: true }
    )
  })
}

/**
 * subscribeToThread — real-time listener for messages in a thread.
 *
 * @param {string} userId
 * @param {string} otherId
 * @param {(messages: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToThread(userId, otherId, callback) {
  const threadId = getThreadId(userId, otherId)
  const msgRef   = dbRef(rtdb, `messages/${threadId}`)

  const unsub = onValue(msgRef, (snap) => {
    if (!snap.exists()) { callback([]); return }
    const raw  = snap.val()
    const msgs = Object.values(raw).sort((a, b) => a.ts - b.ts)
    callback(msgs)
  })

  return unsub
}

/**
 * subscribeToThreads — real-time listener for a user's conversation list.
 *
 * @param {string} userId
 * @param {(threads: Array) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToThreads(userId, callback) {
  const threadsRef = dbRef(rtdb, `threads/${userId}`)

  const unsub = onValue(threadsRef, (snap) => {
    if (!snap.exists()) { callback([]); return }
    const raw     = snap.val()
    const threads = Object.values(raw).sort(
      (a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0)
    )
    callback(threads)
  })

  return unsub
}

/**
 * markThreadRead — resets the unread counter for the current user's view of a thread.
 *
 * @param {string} userId    — the current user's ID
 * @param {string} otherId   — the other participant's ID
 */
export async function markThreadRead(userId, otherId) {
  const threadRef = dbRef(rtdb, `threads/${userId}/${otherId}`)
  await new Promise((resolve) => {
    onValue(
      threadRef,
      (snap) => {
        const existing = snap.val()
        if (!existing || (existing.unread || 0) === 0) { resolve(); return }
        set(threadRef, { ...existing, unread: 0 }).then(resolve)
      },
      { onlyOnce: true }
    )
  })
}
