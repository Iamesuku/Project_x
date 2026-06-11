// ── /setup  —  One-click demo user creation (no admin / login needed) ──────
// Visit localhost:5173/setup, click the button, done.
// Delete this route when the project goes to production.

import { useState } from 'react'
import { db, auth } from '../firebase/config'
import {
  collection, getDocs, deleteDoc, doc,
  setDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { seedDemoData } from '../utils/seedFirestore'

const SEED_IDS = new Set([
  'f1','f2','f3','f4','f5','f6','f7',
  'f8','f9','f10','f11','f12','f13','f14',
  '_nexus_demo_',
])

const DEMO_ACCOUNTS = [
  {
    email:    'client@nexus.edu',
    password: 'Demo1234!',
    profile: {
      name: 'Tolu Adeyemi', avatar: 'TA', role: 'client',
      bio: 'Final-year Business Administration student at UNI. I run a small campus print and design business and hire freelancers for branding and web work.',
      location: 'Lagos (UNI)', skills: [], hourlyRate: 0,
      rating: 0, reviewCount: 0, completedJobs: 0,
      isDemoAccount: true,
    },
    wallet: { balance: 5000, escrow: 0, earned: 0, currency: 'NGN' },
  },
  {
    email:    'emeka@nexus.edu',
    password: 'Demo1234!',
    profile: {
      name: 'Emeka Nwosu', avatar: 'EN', role: 'freelancer',
      title: 'Full-Stack Developer',
      bio: 'Final-year Computer Science student at UNI. Builds production-ready web apps — 8+ campus projects delivered.',
      location: 'Lagos (UNI)',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Firebase'],
      hourlyRate: 6500, rating: 4.8, reviewCount: 189, completedJobs: 134,
      category: 'Development & IT', isDemoAccount: true,
    },
    wallet: { balance: 1200, escrow: 0, earned: 8400, currency: 'NGN' },
  },
]

export default function DemoSetup() {
  const [log,    setLog]    = useState([])
  const [status, setStatus] = useState('idle') // idle | running | done | error

  function addLog(msg, type = 'info') {
    setLog(p => [...p, { msg, type, id: Date.now() + Math.random() }])
  }

  async function runSetup() {
    setStatus('running')
    setLog([])

    // ── 1. Delete stale profiles ───────────────────────────────────────────
    addLog('🔍 Scanning Firestore for stale user profiles…')
    try {
      const snap = await getDocs(collection(db, 'users'))
      let deleted = 0
      for (const d of snap.docs) {
        if (!SEED_IDS.has(d.id) && !d.data().isDemoAccount) {
          await deleteDoc(doc(db, 'users', d.id))
          addLog(`🗑️  Deleted: ${d.data().name || d.id}`, 'warn')
          deleted++
        }
      }
      addLog(`✅ Deleted ${deleted} stale profile(s).`, 'success')
    } catch (err) {
      addLog(`⚠️  Could not purge profiles: ${err.message}`, 'warn')
    }

    // ── 2. Create demo Auth accounts ──────────────────────────────────────
    for (const account of DEMO_ACCOUNTS) {
      addLog(`⏳ Creating ${account.profile.role} → ${account.email}…`)
      try {
        const cred = await createUserWithEmailAndPassword(auth, account.email, account.password)
        const uid = cred.user.uid
        await setDoc(doc(db, 'users', uid), {
          ...account.profile,
          email: account.email,
          createdAt: serverTimestamp(),
        })
        await setDoc(doc(db, 'wallets', uid), account.wallet)
        addLog(`✅ ${account.profile.role.toUpperCase()} created! UID: ${uid.slice(0,8)}…`, 'success')
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          addLog(`ℹ️  ${account.email} already exists in Firebase Auth — skipping creation.`, 'info')
          // Try to update the Firestore doc if it exists
          try {
            const existing = await getDocs(
              query(collection(db, 'users'),
                where('isDemoAccount', '==', true),
                where('role', '==', account.profile.role)
              )
            )
            if (!existing.empty) {
              await setDoc(doc(db, 'users', existing.docs[0].id), {
                ...account.profile, email: account.email,
              }, { merge: true })
              addLog(`🔄 Firestore doc refreshed for ${account.email}`, 'info')
            }
          } catch (_) {}
        } else {
          addLog(`❌ Error: ${err.message}`, 'error')
          setStatus('error')
          return
        }
      }
    }

    addLog('🎉 All done! You can now log in with the credentials below.', 'success')
    setStatus('done')
  }

  // After Auth users created, also seed freelancers + jobs
  async function runFullSetup() {
    await runSetup()
    // runSetup sets status — seed the Firestore demo data next
    addLog('📦 Seeding 14 demo freelancers + 11 demo jobs to Firestore…')
    try {
      const result = await seedDemoData()
      if (result.alreadySeeded) {
        addLog(`ℹ️  Firestore demo data already seeded (${result.existing} jobs found).`, 'info')
      } else {
        addLog(`✅ Seeded ${result.seeded} records (freelancers + jobs) to Firestore.`, 'success')
      }
    } catch (err) {
      addLog(`⚠️  Could not seed Firestore demo data: ${err.message}`, 'warn')
    }
  }

  const colorMap = { success: '#22c55e', warn: '#f59e0b', error: '#ef4444', info: '#94a3b8' }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#111', borderRadius: 16,
        border: '1px solid #222', padding: 36,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>NEXUS · Developer Utility</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Demo User Setup</h1>
          <p style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.6 }}>
            Deletes old test profiles, creates 2 loginable demo accounts, and seeds 14 demo freelancers + 11 demo jobs to Firestore.
          </p>
        </div>

        {/* Accounts preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {DEMO_ACCOUNTS.map(a => (
            <div key={a.email} style={{
              background: '#1a1a1a', borderRadius: 10, padding: '12px 14px',
              border: '1px solid #2a2a2a',
            }}>
              <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 4 }}>{a.profile.role}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', margin: 0 }}>{a.profile.name}</p>
              <p style={{ fontSize: 11, color: '#86efac', margin: '2px 0 0' }}>{a.email}</p>
              <p style={{ fontSize: 11, color: '#fde68a' }}>pw: {a.password}</p>
            </div>
          ))}
        </div>

        {/* Run button */}
        <button
          onClick={runFullSetup}
          disabled={status === 'running' || status === 'done'}
          style={{
            width: '100%', padding: '13px 0',
            background: status === 'done' ? '#16a34a' : status === 'error' ? '#dc2626' : status === 'running' ? '#374151' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: status === 'running' || status === 'done' ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {status === 'idle'    && '⚡ Run Setup Now'}
          {status === 'running' && '⏳ Running…'}
          {status === 'done'    && '✓ Setup Complete'}
          {status === 'error'   && '✗ Error — check log below'}
        </button>

        {/* Log output */}
        {log.length > 0 && (
          <div style={{
            marginTop: 20, background: '#0d0d0d', borderRadius: 10,
            border: '1px solid #1e1e1e', padding: '12px 14px',
            maxHeight: 200, overflowY: 'auto',
          }}>
            {log.map(entry => (
              <p key={entry.id} style={{
                margin: '2px 0', fontSize: 12,
                color: colorMap[entry.type] || '#94a3b8',
                fontFamily: 'monospace',
              }}>
                {entry.msg}
              </p>
            ))}
          </div>
        )}

        {/* Success credentials summary */}
        {status === 'done' && (
          <div style={{
            marginTop: 20, background: '#0f2010', borderRadius: 10,
            border: '1px solid #166534', padding: '14px 16px',
          }}>
            <p style={{ color: '#22c55e', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              ✓ Ready to demo!
            </p>
            <p style={{ color: '#86efac', fontSize: 12, lineHeight: 2, margin: 0 }}>
              <strong>Client:</strong> client@nexus.edu / Demo1234!<br />
              <strong>Freelancer:</strong> emeka@nexus.edu / Demo1234!
            </p>
            <a
              href="/auth"
              style={{
                display: 'block', marginTop: 12, textAlign: 'center',
                background: '#16a34a', color: '#fff', textDecoration: 'none',
                padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
              }}
            >
              Go to Login →
            </a>
          </div>
        )}

        <p style={{ marginTop: 16, fontSize: 11, color: '#333', textAlign: 'center' }}>
          This page is for development only. Remove the /setup route before going to production.
        </p>
      </div>
    </div>
  )
}
