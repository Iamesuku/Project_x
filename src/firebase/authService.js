// ── Auth Service — Task 2 ─────────────────────────────────────────────────
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './config'

// Derive up-to-2-character initials from a full name
function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * signUp — creates a Firebase Auth user, then attempts Firestore writes.
 * Firestore writes are best-effort: if they fail (e.g. security rules not yet
 * configured), the Auth account is still kept so the user can log in.
 * @returns {import('firebase/auth').User}
 */
export async function signUp(name, email, password, role) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const { uid } = cred.user

  // Best-effort Firestore writes — do NOT roll back auth if these fail
  try {
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      avatar:       getInitials(name),
      role,
      bio:          '',
      location:     '',
      skills:       [],
      hourlyRate:   0,
      rating:       0,
      reviewCount:  0,
      completedJobs: 0,
      memberSince:  serverTimestamp(),
    })
  } catch (err) {
    console.warn('[NEXUS] Could not write user profile to Firestore:', err.message,
      '\nThis is usually a Firestore rules issue. Auth account was still created.')
  }

  try {
    await setDoc(doc(db, 'wallets', uid), {
      balance:  600,   // seed balance so new users can explore the platform
      escrow:   200,
      earned:   0,
      currency: 'NGN',
    })
  } catch (err) {
    console.warn('[NEXUS] Could not write wallet to Firestore:', err.message)
  }

  return cred.user
}

/**
 * logIn — signs in an existing user.
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
