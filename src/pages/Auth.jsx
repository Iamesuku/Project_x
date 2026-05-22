import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUp, logIn, resetPassword, signInWithGoogle } from '../firebase/authService'
import { useParticleCanvas } from '../hooks/useScrollReveal'
import styles from './Auth.module.css'

// ── Map Firebase / network error codes → friendly messages ────────────────
const AUTH_ERRORS = {
  'auth/email-already-in-use':      'An account with this email already exists. Try logging in instead.',
  'auth/user-not-found':            'No account found with this email address.',
  'auth/wrong-password':            'Incorrect password. Please try again.',
  'auth/invalid-credential':        'Incorrect email or password. Please check and try again.',
  'auth/invalid-email':             'Please enter a valid email address.',
  'auth/weak-password':             'Password must be at least 6 characters.',
  'auth/too-many-requests':         'Too many failed attempts. Please wait a few minutes then try again.',
  'auth/network-request-failed':    'Network error — check your internet connection and try again.',
  'auth/user-disabled':             'This account has been disabled. Contact support.',
  'auth/operation-not-allowed':     'This sign-in method is not enabled. Please contact the admin.',
  'auth/popup-closed-by-user':      'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked':             'Popup was blocked by your browser. Please allow popups for this site.',
  'auth/cancelled-popup-request':   'Another sign-in is in progress.',
  'auth/requires-recent-login':     'Please log in again to continue.',
  'auth/invalid-login-credentials': 'Incorrect email or password. Please check and try again.',
  'auth/missing-password':          'Please enter your password.',
  'auth/missing-email':             'Please enter your email address.',
}

function friendlyError(err) {
  return AUTH_ERRORS[err.code]
    || (err.message?.includes('network') ? AUTH_ERRORS['auth/network-request-failed'] : null)
    || 'Something went wrong. Please check your details and try again.'
}

export default function Auth() {
  const { toast } = useApp()
  const navigate  = useNavigate()

  const [mode,       setMode]       = useState('login')
  const [role,       setRole]       = useState('client')
  const [form,       setForm]       = useState({ name: '', email: '', password: '' })
  const [errors,     setErrors]     = useState({})
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [forgotPw,   setForgotPw]   = useState(false)
  const [resetSent,  setResetSent]  = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showPwd,    setShowPwd]    = useState(false)

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '', general: '' }))
  }

  // ── Password strength ────────────────────────────────────────────────────
  function getPwdStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 8)               score++
    if (/[A-Z]/.test(pwd))             score++
    if (/[0-9]/.test(pwd))             score++
    if (/[^A-Za-z0-9]/.test(pwd))     score++
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
      await signInWithGoogle()
      toast('Signed in with Google!')
      navigate('/dashboard')
    } catch (err) {
      console.error('[NEXUS Google]', err.code, err.message)
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        NEXUS
      </Link>

      {/* Frosted glass form card */}
      <div className={styles.formCard} role="main">

            <div className={styles.modeSwitcher}>
              <button className={`${styles.modeTab} ${mode==='login'  ? styles.modeActive : ''}`} onClick={() => switchMode('login')}>Log in</button>
              <button className={`${styles.modeTab} ${mode==='signup' ? styles.modeActive : ''}`} onClick={() => switchMode('signup')}>Sign up</button>
            </div>



            {/* ── Role selector (signup only) ── */}
            {mode === 'signup' && !forgotPw && (
              <div className={styles.roleSelect}>
                <p className={styles.roleLabel}>I am a…</p>
                <div className={styles.roleCards}>
                  {[
                    { value:'client',     icon:'⊞', title:'Service Seeker',   sub:'I need help with something' },
                    { value:'freelancer', icon:'◈', title:'Service Provider', sub:'I want to offer my skills'  },
                  ].map(r => (
                    <button key={r.value} type="button"
                      className={`${styles.roleCard} ${role===r.value ? styles.roleCardActive : ''}`}
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
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
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
                        {[1,2,3,4].map(i => (
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
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                  </svg>
                  {errors.general}
                </div>
              )}

              {forgotPw ? (
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
                      {errors.general    && <p className={styles.errMsg}>{errors.general}</p>}
                      <div className={styles.resetActions}>
                        <button type="submit" className={styles.submitBtn} disabled={anyLoading}>
                          {loading ? <><span className={styles.spinner}/> Sending…</> : 'Send reset link →'}
                        </button>
                        <button type="button" className={styles.switchLink} onClick={() => { setForgotPw(false); setErrors({}) }}>Back to sign in</button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <button type="submit" className={styles.submitBtn} disabled={anyLoading}>
                  {loading
                    ? <><span className={styles.spinner}/> {mode==='login' ? 'Signing in…' : 'Creating account…'}</>
                    : mode==='login' ? 'Sign in with email →' : 'Create account →'}
                </button>
              )}
            </form>

            <p className={styles.switchText}>
              {mode==='login'
                ? <> Don&apos;t have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('signup')}>Sign up</button></>
                : <> Already have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('login')}>Log in</button></>
              }
            </p>

            <p className={styles.terms}>
              By continuing you agree to our{' '}
              <Link to="#" className={styles.termsLink}>Terms</Link> and{' '}
              <Link to="#" className={styles.termsLink}>Privacy Policy</Link>.
            </p>
      </div>
    </div>
  )
}
