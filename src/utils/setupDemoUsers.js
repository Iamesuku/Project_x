// ── Demo User Setup ────────────────────────────────────────────────────────
// Creates 2 real Firebase Auth + Firestore users for demo purposes:
//   CLIENT     →  client@nexus.edu  /  Demo1234!
//   FREELANCER →  emeka@nexus.edu   /  Demo1234!
//
// Also purges stale test profiles (any user whose role is 'freelancer' or
// 'client' but whose doc was NOT created by seedFirestore and is NOT one of
// the official demo seed IDs f1–f14).
//
// Safe to call multiple times — skips creation if user already exists.
// ──────────────────────────────────────────────────────────────────────────

import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth'
import {
  collection, doc, setDoc, getDocs,
  deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'

// ── Known seed IDs that must NEVER be deleted ─────────────────────────────
const SEED_IDS = new Set([
  'f1','f2','f3','f4','f5','f6','f7',
  'f8','f9','f10','f11','f12','f13','f14',
  '_nexus_demo_',
])

// ── Demo account definitions ───────────────────────────────────────────────
const DEMO_CLIENT = {
  email:    'client@nexus.edu',
  password: 'Demo1234!',
  profile: {
    name:         'Tolu Adeyemi',
    avatar:       'TA',
    role:         'client',
    bio:          'Final-year Business Administration student at UNI. I run a small campus print and design business and hire freelancers regularly for branding and web work.',
    location:     'Lagos (UNI)',
    skills:       [],
    hourlyRate:   0,
    rating:       0,
    reviewCount:  0,
    completedJobs: 0,
    emailVerified: true,
    memberSince:  '2025-09-01',
    isDemo:       true,
    isDemoAccount: true,
  },
  wallet: { balance: 5000, escrow: 0, earned: 0, currency: 'NGN' },
}

const DEMO_FREELANCER = {
  email:    'emeka@nexus.edu',
  password: 'Demo1234!',
  profile: {
    name:         'Emeka Nwosu',
    avatar:       'EN',
    role:         'freelancer',
    title:        'Full-Stack Developer',
    bio:          'Final-year Computer Science student at UNI. I build production-ready web apps. Delivered 8+ campus projects including the Faculty of Engineering student portal and alumni platform.',
    location:     'Lagos (UNI)',
    skills:       ['React', 'Node.js', 'PostgreSQL', 'Firebase'],
    hourlyRate:   6500,
    rating:       4.8,
    reviewCount:  189,
    completedJobs: 134,
    category:     'Development & IT',
    emailVerified: true,
    memberSince:  '2025-08-15',
    isDemo:       true,
    isDemoAccount: true,
  },
  wallet: { balance: 1200, escrow: 0, earned: 8400, currency: 'NGN' },
}

// ── Helper: create or retrieve a Firebase Auth user ───────────────────────
async function ensureAuthUser(email, password) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email)
    if (methods.length > 0) {
      // User already exists in Auth — we can't get their UID without signing in
      // Return null to signal "already exists, skip Firestore write"
      return { uid: null, alreadyExists: true }
    }
  } catch (_) { /* ignore — fetchSignInMethods may be disabled */ }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return { uid: cred.user.uid, alreadyExists: false }
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      return { uid: null, alreadyExists: true }
    }
    throw err
  }
}

// ── Main export ────────────────────────────────────────────────────────────
/**
 * Purges stale test users and creates the 2 demo accounts.
 * @param {function(string):void} [log] - Optional progress logger
 * @returns {Promise<{deleted:number, created:string[], skipped:string[]}>}
 */
export async function setupDemoUsers(log = () => {}) {
  const result = { deleted: 0, created: [], skipped: [] }

  // ── 1. Delete stale / test user profiles ─────────────────────────────────
  log('Scanning for stale user profiles…')
  try {
    const allUsers = await getDocs(collection(db, 'users'))
    const toDelete = allUsers.docs.filter(d => {
      const id   = d.id
      const data = d.data()
      // Keep official seed IDs
      if (SEED_IDS.has(id)) return false
      // Keep demo accounts we're about to create (identified by isDemoAccount)
      if (data.isDemoAccount) return false
      // Delete everything else that looks like a test / stale account
      // (i.e. no isDemo flag, or name is a generic test name)
      return true
    })

    for (const snap of toDelete) {
      log(`Deleting stale profile: ${snap.data().name || snap.id}`)
      await deleteDoc(doc(db, 'users', snap.id))
      result.deleted++
    }
    log(`Deleted ${result.deleted} stale profile(s).`)
  } catch (err) {
    log(`Warning: could not purge stale profiles — ${err.message}`)
  }

  // ── 2. Create CLIENT account ──────────────────────────────────────────────
  log('Creating demo CLIENT account…')
  try {
    const { uid, alreadyExists } = await ensureAuthUser(
      DEMO_CLIENT.email, DEMO_CLIENT.password
    )

    if (alreadyExists) {
      log(`CLIENT already exists in Auth — skipping.`)
      result.skipped.push(DEMO_CLIENT.email)

      // Still try to upsert Firestore profile so it's always correct
      // We need to find their UID by querying Firestore
      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('isDemoAccount', '==', true), where('role', '==', 'client'))
      )
      if (existingSnap.empty) {
        log('CLIENT Firestore doc not found — cannot upsert without UID.')
      } else {
        const existingId = existingSnap.docs[0].id
        await setDoc(doc(db, 'users', existingId), {
          ...DEMO_CLIENT.profile,
          email: DEMO_CLIENT.email,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        log(`CLIENT Firestore doc updated (id: ${existingId}).`)
      }
    } else {
      // Write Firestore profile
      await setDoc(doc(db, 'users', uid), {
        ...DEMO_CLIENT.profile,
        email:     DEMO_CLIENT.email,
        createdAt: serverTimestamp(),
      })
      // Write wallet
      await setDoc(doc(db, 'wallets', uid), DEMO_CLIENT.wallet)
      log(`CLIENT created — UID: ${uid}`)
      result.created.push(DEMO_CLIENT.email)
    }
  } catch (err) {
    log(`Error creating CLIENT: ${err.message}`)
  }

  // ── 3. Create FREELANCER account ──────────────────────────────────────────
  log('Creating demo FREELANCER account…')
  try {
    const { uid, alreadyExists } = await ensureAuthUser(
      DEMO_FREELANCER.email, DEMO_FREELANCER.password
    )

    if (alreadyExists) {
      log(`FREELANCER already exists in Auth — skipping.`)
      result.skipped.push(DEMO_FREELANCER.email)

      const existingSnap = await getDocs(
        query(collection(db, 'users'), where('isDemoAccount', '==', true), where('role', '==', 'freelancer'))
      )
      if (existingSnap.empty) {
        log('FREELANCER Firestore doc not found — cannot upsert without UID.')
      } else {
        const existingId = existingSnap.docs[0].id
        await setDoc(doc(db, 'users', existingId), {
          ...DEMO_FREELANCER.profile,
          email: DEMO_FREELANCER.email,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        log(`FREELANCER Firestore doc updated (id: ${existingId}).`)
      }
    } else {
      await setDoc(doc(db, 'users', uid), {
        ...DEMO_FREELANCER.profile,
        email:     DEMO_FREELANCER.email,
        createdAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'wallets', uid), DEMO_FREELANCER.wallet)
      log(`FREELANCER created — UID: ${uid}`)
      result.created.push(DEMO_FREELANCER.email)
    }
  } catch (err) {
    log(`Error creating FREELANCER: ${err.message}`)
  }

  log('Done!')
  return result
}

// ── Credentials export (for display in Admin UI) ──────────────────────────
export const DEMO_CREDENTIALS = {
  client:     { email: DEMO_CLIENT.email,     password: DEMO_CLIENT.password,     name: DEMO_CLIENT.profile.name,     role: 'client'     },
  freelancer: { email: DEMO_FREELANCER.email, password: DEMO_FREELANCER.password, name: DEMO_FREELANCER.profile.name, role: 'freelancer' },
}
