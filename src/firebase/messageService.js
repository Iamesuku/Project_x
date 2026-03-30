// ── Message Service — Task 6 ──────────────────────────────────────────────
// Uses Firebase Realtime Database for low-latency chat.
import {
  ref,
  push,
  set,
  onValue,
  serverTimestamp,
} from 'firebase/database'
import { rtdb } from './config'

/** Returns the canonical thread ID (alphabetically sorted) */
function getThreadId(idA, idB) {
  return [idA, idB].sort().join('_')
}

/**
 * sendMessage — pushes a message to RTDB and updates both users' thread summaries.
 *
 * @param {{ id: string, name: string, avatar: string }} fromUser
 * @param {{ id: string, name: string, avatar: string }} toUser
 * @param {string} text
 */
export async function sendMessage(fromUser, toUser, text) {
  const threadId = getThreadId(fromUser.id, toUser.id)
  const now      = Date.now()

  // 1. Push the message to the shared transcript
  const msgRef  = ref(rtdb, `messages/${threadId}`)
  const newMsgRef = push(msgRef)
  await set(newMsgRef, {
    id:       newMsgRef.key,
    senderId: fromUser.id,
    text,
    ts:       now,
  })

  const summary = {
    lastText:      text,
    lastTimestamp: now,
    lastSenderId:  fromUser.id,
  }

  // 2. Update sender's thread entry (no unread for them)
  await set(ref(rtdb, `threads/${fromUser.id}/${toUser.id}`), {
    ...summary,
    otherId:    toUser.id,
    otherName:  toUser.name,
    otherAvatar: toUser.avatar,
    unread: 0,
  })

  // 3. Update recipient's thread entry (increment unread)
  const recipRef = ref(rtdb, `threads/${toUser.id}/${fromUser.id}`)
  // Read current unread count then write updated value
  await new Promise((resolve) => {
    onValue(
      recipRef,
      (snap) => {
        const existing = snap.val() || {}
        set(recipRef, {
          ...summary,
          otherId:    fromUser.id,
          otherName:  fromUser.name,
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
  const msgRef   = ref(rtdb, `messages/${threadId}`)

  const unsub = onValue(msgRef, (snap) => {
    if (!snap.exists()) { callback([]); return }
    const raw = snap.val()
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
  const threadsRef = ref(rtdb, `threads/${userId}`)

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
