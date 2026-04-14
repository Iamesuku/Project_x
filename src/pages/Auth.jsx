import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUp, logIn, resetPassword, signInWithGoogle } from '../firebase/authService'
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.split}>

        {/* Left brand panel */}
        <div className={styles.leftPanel}>
          <Link to="/" className={styles.backHome}>← nexus</Link>
          <div className={styles.leftContent}>
            <h1 className={styles.leftTitle}>
              {mode === 'login' ? 'Welcome\nback.' : 'Start your\njourney.'}
            </h1>
            <p className={styles.leftSub}>
              {mode === 'login'
                ? 'Log back in and pick up where you left off.'
                : 'Join students sharing skills and getting things done on campus.'}
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>

            <div className={styles.modeSwitcher}>
              <button className={`${styles.modeTab} ${mode==='login'  ? styles.modeActive : ''}`} onClick={() => switchMode('login')}>Log in</button>
              <button className={`${styles.modeTab} ${mode==='signup' ? styles.modeActive : ''}`} onClick={() => switchMode('signup')}>Sign up</button>
            </div>

            {/* ── Google Sign-In (primary CTA) ── */}
            {!forgotPw && (
              <div className={styles.googleSection}>
                <button
                  id="google-signin-btn"
                  className={styles.googleBtn}
                  onClick={handleGoogle}
                  disabled={anyLoading}
                >
                  {googleLoad ? (
                    <><span className={styles.spinnerDark}/> Signing in…</>
                  ) : (
                    <>
                      {/* Official Google "G" logo */}
                      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                      {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
                    </>
                  )}
                </button>
                <p className={styles.googleNote}>Use your Gmail account — quickest way to get started</p>
              </div>
            )}

            {/* ── Divider ── */}
            {!forgotPw && (
              <div className={styles.divider}><span>or continue with email</span></div>
            )}

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
      </div>
    </div>
  )
}
