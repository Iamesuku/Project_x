import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUp, logIn, resetPassword, signInWithGoogle } from '../firebase/authService'
import { useParticleCanvas } from '../hooks/useScrollReveal'
import styles from './Auth.module.css'

// ── Map Firebase / network error codes → friendly messages ────────────────
const AUTH_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. (If you signed up with Google, use "Continue with Google").',
  'auth/invalid-credential': 'Incorrect email or password. (If you signed up with Google, use "Continue with Google").',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes then try again.',
  'auth/network-request-failed': 'Network error — check your internet connection and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact the admin.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
  'auth/cancelled-popup-request': 'Another sign-in is in progress.',
  'auth/requires-recent-login': 'Please log in again to continue.',
  'auth/invalid-login-credentials': 'Incorrect email or password. (If you signed up with Google, use "Continue with Google").',
  'auth/missing-password': 'Please enter your password.',
  'auth/missing-email': 'Please enter your email address.',
}

function friendlyError(err) {
  return AUTH_ERRORS[err.code]
    || (err.message?.includes('network') ? AUTH_ERRORS['auth/network-request-failed'] : null)
    || 'Something went wrong. Please check your details and try again.'
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function Auth() {
  const { toast } = useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('client')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [forgotPw, setForgotPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '', general: '' }))
  }

  // ── Password strength ────────────────────────────────────────────────────
  function getPwdStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
    return { score, label: labels[score], color: colors[score] }
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const e = {}
    if (mode === 'signup' && !form.name.trim()) {
      e.name = 'Full name is required'
    }
    if (!form.email.includes('@')) {
      e.email = 'Enter a valid email address'
    }
    if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }
    return e
  }

  // ── Email/Password Submit ─────────────────────────────────────────────────
  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await logIn(form.email, form.password)
        toast('Welcome back!')
      } else {
        await signUp(form.name.trim(), form.email, form.password, role)
        toast(`Welcome to NEXUS, ${form.name.split(' ')[0]}!`)
      }
      navigate(role === 'freelancer' ? '/jobs' : '/dashboard')
    } catch (err) {
      console.error('[NEXUS Auth]', err.code, err.message)
      setErrors({ general: friendlyError(err) })
    } finally {
      setLoading(false)
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoad(true)
    setErrors({})
    try {
      await signInWithGoogle(role, mode)
      toast('Signed in with Google!')
      navigate('/dashboard')
    } catch (err) {
      console.error('[NEXUS Google]', err.code, err.message)
      if (err.code === 'auth/user-not-found-google') {
        setErrors({ general: err.message })
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setErrors({ general: friendlyError(err) })
      }
    } finally {
      setGoogleLoad(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setForgotPw(false)
    setResetSent(false)
  }

  // ── Reset password ────────────────────────────────────────────────────────
  async function handleReset(ev) {
    ev.preventDefault()
    if (!resetEmail.includes('@')) {
      setErrors({ resetEmail: 'Enter a valid email address' })
      return
    }
    setLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      setErrors({ general: AUTH_ERRORS[err.code] || 'Could not send reset email. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const anyLoading = loading || googleLoad
  const canvasRef = useParticleCanvas(true)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Animated particle canvas background */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      {/* Back home link */}
      <Link to="/" className={styles.backHome}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        NEXUS
      </Link>

      {/* Frosted glass form card */}
      <div className={styles.formCard} role="main">

        <div className={styles.modeSwitcher}>
          <button className={`${styles.modeTab} ${mode === 'login' ? styles.modeActive : ''}`} onClick={() => switchMode('login')}>Log in</button>
          <button className={`${styles.modeTab} ${mode === 'signup' ? styles.modeActive : ''}`} onClick={() => switchMode('signup')}>Sign up</button>
        </div>



        {/* ── Role selector (signup only) ── */}
        {mode === 'signup' && !forgotPw && (
          <div className={styles.roleSelect}>
            <p className={styles.roleLabel}>I am a…</p>
            <div className={styles.roleCards}>
              {[
                { value: 'client', icon: '⊞', title: 'Service Seeker', sub: 'I need help with something' },
                { value: 'freelancer', icon: '◈', title: 'Service Provider', sub: 'I want to offer my skills' },
              ].map(r => (
                <button key={r.value} type="button"
                  className={`${styles.roleCard} ${role === r.value ? styles.roleCardActive : ''}`}
                  onClick={() => setRole(r.value)}>
                  <span className={styles.roleIcon}>{r.icon}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Email / Password form ── */}
        {!forgotPw ? (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div className={styles.field}>
                <label className={styles.label}>Full name</label>
                <input className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                  placeholder="Your full name" value={form.name}
                  onChange={e => set('name', e.target.value)} autoComplete="name" />
                {errors.name && <p className={styles.errMsg}>{errors.name}</p>}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <input className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" />
              {errors.email && <p className={styles.errMsg}>{errors.email}</p>}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                {mode === 'login' && (
                  <button type="button" className={styles.forgotLink}
                    onClick={() => { setForgotPw(true); setResetSent(false); setResetEmail(form.email); setErrors({}) }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className={styles.pwdWrap}>
                <input className={`${styles.input} ${styles.inputPwd} ${errors.password ? styles.inputErr : ''}`}
                  type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className={styles.errMsg}>{errors.password}</p>}
              {/* Password strength meter — signup only */}
              {mode === 'signup' && form.password && (() => {
                const { score, label, color } = getPwdStrength(form.password)
                return (
                  <div className={styles.pwdStrength}>
                    <div className={styles.strengthBars}>
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={styles.strengthBar}
                          style={{ background: i <= score ? color : 'var(--border, #e5e5e5)' }}
                        />
                      ))}
                    </div>
                    <span className={styles.strengthLabel} style={{ color }}>{label}</span>
                  </div>
                )
              })()}
            </div>

            {errors.general && (
              <div className={styles.generalErr}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
                {errors.general}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={anyLoading}>
              {loading
                ? <><span className={styles.spinner} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : mode === 'login' ? 'Sign in with email →' : 'Create account →'}
            </button>
          </form>
        ) : (
          <div className={styles.resetBox}>
            {resetSent ? (
              <p className={styles.resetConfirm}>
                ✓ Reset link sent — check your inbox and follow the link to set a new password.
              </p>
            ) : (
              <form className={styles.resetForm} onSubmit={handleReset} noValidate>
                <p className={styles.resetLabel}>Enter your account email and we'll send a reset link.</p>
                <input
                  className={`${styles.input} ${errors.resetEmail ? styles.inputErr : ''}`}
                  type="email" placeholder="you@example.com"
                  value={resetEmail}
                  onChange={e => { setResetEmail(e.target.value); setErrors(ev => ({ ...ev, resetEmail: '' })) }}
                  autoComplete="email"
                />
                {errors.resetEmail && <p className={styles.errMsg}>{errors.resetEmail}</p>}
                {errors.general && <p className={styles.generalErr}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                  {errors.general}
                </p>}
                <div className={styles.resetActions}>
                  <button type="submit" className={styles.submitBtn} disabled={anyLoading}>
                    {loading ? <><span className={styles.spinner} /> Sending…</> : 'Send reset link →'}
                  </button>
                  <button type="button" className={styles.switchLink} onClick={() => { setForgotPw(false); setErrors({}) }}>Back to sign in</button>
                </div>
              </form>
            )}
          </div>
        )}

        {!forgotPw && (
          <>
            <div className={styles.divider}><span>or</span></div>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogle}
              disabled={anyLoading}
            >
              {googleLoad
                ? <><span className={styles.spinner} /> Signing in…</>
                : <><GoogleIcon /> Continue with Google</>
              }
            </button>
          </>
        )}

        <p className={styles.switchText}>
          {mode === 'login'
            ? <> Don&apos;t have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('signup')}>Sign up</button></>
            : <> Already have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('login')}>Log in</button></>
          }
        </p>
      </div>
    </div>
  )
}
