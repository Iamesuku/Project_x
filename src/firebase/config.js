// ── Firebase config — Task 1 ──────────────────────────────────────────────
// All values come from Vite environment variables (.env.local)
// Create a .env.local file in the project root with these keys:
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_DATABASE_URL
//   VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Prevent duplicate app initialisation during HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export const rtdb = getDatabase(app)

export default app
