// ── Auth Service ──────────────────────────────────────────────────────────
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './config'

// Derive up-to-2-character initials from a name or email
function getInitials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Write a new user doc + wallet (used on first-time sign-in) ────────────
async function createUserDoc(uid, { name, email, avatar, role = 'client' }) {
  try {
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      avatar,
      role,
      bio:          '',
      location:     '',
      skills:       [],
      hourlyRate:   0,
      rating:       0,
      reviewCount:  0,
      completedJobs: 0,
      memberSince:  serverTimestamp(),
    }, { merge: true })   // merge so re-logins don't wipe existing data
  } catch (err) {
    console.warn('[NEXUS] Could not write user profile to Firestore:', err.message)
  }

  try {
    // Only seed wallet if it doesn't already exist
    const walletRef = doc(db, 'wallets', uid)
    const existing  = await getDoc(walletRef)
    if (!existing.exists()) {
      await setDoc(walletRef, {
        balance:  600,
        escrow:   0,
        earned:   0,
        currency: 'NGN',
      })
    }
  } catch (err) {
    console.warn('[NEXUS] Could not write wallet to Firestore:', err.message)
  }
}

/**
 * signInWithGoogle — opens a Google auth popup, then upserts the Firestore
 * user doc so data is always available after login.
 * @returns {import('firebase/auth').User}
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  const { uid, displayName, email, photoURL } = cred.user

  await createUserDoc(uid, {
    name:   displayName || email?.split('@')[0] || 'User',
    email:  email || '',
    avatar: photoURL || getInitials(displayName || email || 'U'),
  })

  return cred.user
}

/**
 * signUp — creates an Email/Password Firebase Auth user, then writes
 * Firestore docs.  Auth is kept even if Firestore writes fail.
 * @returns {import('firebase/auth').User}
 */
export async function signUp(name, email, password, role) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const { uid } = cred.user

  await createUserDoc(uid, {
    name,
    email,
    avatar: getInitials(name),
    role,
  })

  return cred.user
}

/**
 * logIn — signs in an existing email/password user.
 * @returns {import('firebase/auth').User}
 */
export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

/**
 * logOut — signs the current user out.
 */
export async function logOut() {
  await signOut(auth)
}

/**
 * resetPassword — sends a Firebase password-reset email.
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

/**
 * onAuthChange — subscribes to auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
