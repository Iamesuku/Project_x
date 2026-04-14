import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUp, logIn, resetPassword } from '../firebase/authService'
import styles from './Auth.module.css'

// ── University email domains accepted by NEXUS ────────────────────────────
// Add your institution's domain here. The check is suffix-based.
const UNI_DOMAINS = [
  '.ac.uk',
  '.edu',
  '.edu.ng',
  '.ac.ng',
  '.edu.gh',
  '.ac.za',
  '.edu.au',
  '.ac.nz',
  // common student portal variants
  'students.',
  'student.',
  'stu.',
]

function isUniEmail(email) {
  const lower = email.toLowerCase()
  return UNI_DOMAINS.some(d => lower.includes(d))
}

// ── Map Firebase / network error codes → friendly messages ────────────────
const AUTH_ERRORS = {
  // Standard codes
  'auth/email-already-in-use':        'An account with this email already exists. Try logging in instead.',
  'auth/user-not-found':              'No account found with this email address.',
  'auth/wrong-password':              'Incorrect password. Please try again.',
  'auth/invalid-credential':          'Incorrect email or password. Please check and try again.',
  'auth/invalid-email':               'Please enter a valid email address.',
  'auth/weak-password':               'Password must be at least 6 characters.',
  'auth/too-many-requests':           'Too many failed attempts. Please wait a few minutes then try again.',
  'auth/network-request-failed':      'Network error — check your internet connection and try again.',
  'auth/user-disabled':               'This account has been disabled. Contact support.',
  'auth/operation-not-allowed':       'Email/password sign-in is not enabled. Please contact the admin.',
  'auth/popup-closed-by-user':        'Sign-in was cancelled.',
  'auth/requires-recent-login':       'Please log in again to continue.',
  // Email Enumeration Protection unified code (Firebase SDK v10+)
  'auth/invalid-login-credentials':   'Incorrect email or password. Please check and try again.',
  'auth/missing-password':            'Please enter your password.',
  'auth/missing-email':               'Please enter your email address.',
}

export default function Auth() {
  const { toast } = useApp()
  const navigate  = useNavigate()

  const [mode,       setMode]       = useState('login')
  const [role,       setRole]       = useState('client')
  const [form,       setForm]       = useState({ name: '', email: '', password: '' })
  const [errors,     setErrors]     = useState({})
  const [loading,    setLoading]    = useState(false)
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
    if (mode === 'signup') {
      if (!form.name.trim()) {
        e.name = 'Full name is required'
      }
      // University email check on signup only
      if (!form.email.includes('@')) {
        e.email = 'Enter a valid email address'
      } else if (!isUniEmail(form.email)) {
        e.email = 'Please use your university email address (e.g. you@university.ac.uk)'
      }
    } else {
      if (!form.email.includes('@')) e.email = 'Enter a valid email address'
    }
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  // ── Submit ───────────────────────────────────────────────────────────────
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
      const friendly = AUTH_ERRORS[err.code]
        || (err.message?.includes('network') ? AUTH_ERRORS['auth/network-request-failed'] : null)
        || 'Something went wrong. Please check your details and try again.'
      setErrors({ general: friendly })
    } finally {
      setLoading(false)
    }
  }

  // ── Demo login (for graders / local dev) ─────────────────────────────────
  async function handleDemoLogin() {
    setLoading(true)
    try {
      await logIn('demo@nexus.ac.uk', 'demo123456')
      toast('Welcome back, Alex!')
      navigate('/dashboard')
    } catch (err) {
      // Demo account doesn't exist yet — create it
      try {
        await signUp('Alex Johnson', 'demo@nexus.ac.uk', 'demo123456', 'client')
        toast('Demo account created — welcome to NEXUS!')
        navigate('/dashboard')
      } catch (signupErr) {
        console.error('[Demo login]', signupErr)
        setErrors({ general: 'Demo login failed. The Firebase project may be paused or Email/Password auth not enabled.' })
      }
    } finally {
      setLoading(false)
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
      const friendly = AUTH_ERRORS[err.code] || 'Could not send reset email. Please try again.'
      setErrors({ general: friendly })
    } finally {
      setLoading(false)
    }
  }

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
            {mode === 'signup' && (
              <div className={styles.uniNotice}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <p>NEXUS is for university students only. A verified campus email is required to sign up.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.rightPanel}>
          <div className={styles.formWrap}>

            <div className={styles.modeSwitcher}>
              <button className={`${styles.modeTab} ${mode==='login'  ? styles.modeActive : ''}`} onClick={() => switchMode('login')}>Log in</button>
              <button className={`${styles.modeTab} ${mode==='signup' ? styles.modeActive : ''}`} onClick={() => switchMode('signup')}>Sign up</button>
            </div>

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
                <label className={styles.label}>
                  {mode === 'signup' ? 'University email' : 'Email address'}
                </label>
                <input className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                  type="email"
                  placeholder={mode === 'signup' ? 'you@university.ac.uk' : 'you@example.com'}
                  value={form.email}
                  onChange={e => set('email', e.target.value)} autoComplete="email" />
                {errors.email ? (
                  <p className={styles.errMsg}>{errors.email}</p>
                ) : mode === 'signup' ? (
                  <p className={styles.fieldHint}>Must end in a recognised university domain (e.g. .ac.uk, .edu)</p>
                ) : null}
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
                        type="email" placeholder="you@university.ac.uk"
                        value={resetEmail}
                        onChange={e => { setResetEmail(e.target.value); setErrors(ev => ({ ...ev, resetEmail: '' })) }}
                        autoComplete="email"
                      />
                      {errors.resetEmail && <p className={styles.errMsg}>{errors.resetEmail}</p>}
                      {errors.general    && <p className={styles.errMsg}>{errors.general}</p>}
                      <div className={styles.resetActions}>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                          {loading ? <><span className={styles.spinner}/> Sending…</> : 'Send reset link →'}
                        </button>
                        <button type="button" className={styles.switchLink} onClick={() => { setForgotPw(false); setErrors({}) }}>Back to sign in</button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading
                    ? <><span className={styles.spinner}/> {mode==='login' ? 'Signing in…' : 'Creating account…'}</>
                    : mode==='login' ? 'Sign in →' : 'Create account →'}
                </button>
              )}
            </form>

            {/* Demo login — for graders and presentations */}
            {!forgotPw && (
              <div className={styles.demoSection}>
                <div className={styles.demoDivider}><span>or</span></div>
                <button
                  className={styles.demoBtn}
                  onClick={handleDemoLogin}
                  disabled={loading}
                  id="demo-login-btn"
                >
                  {loading ? <><span className={styles.spinnerDark}/> Loading demo…</> : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Continue as demo user
                    </>
                  )}
                </button>
                <p className={styles.demoNote}>Instant access · No sign-up required · Demo credentials pre-filled</p>
              </div>
            )}

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
