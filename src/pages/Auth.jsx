import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signUp, logIn, resetPassword } from '../firebase/authService'
import styles from './Auth.module.css'

// Map Firebase error codes → user-friendly messages
const AUTH_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/user-not-found':       'No account found with this email.',
  'auth/wrong-password':       'Incorrect password. Please try again.',
  'auth/invalid-credential':   'Incorrect email or password.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/too-many-requests':    'Too many attempts. Please try again later.',
}

export default function Auth() {
  const { toast } = useApp()
  const navigate = useNavigate()
  const [mode,    setMode]    = useState('login')
  const [role,    setRole]    = useState('client')
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading,   setLoading]   = useState(false)
  const [forgotPw,  setForgotPw]  = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showPwd,   setShowPwd]   = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '', general: '' })) }

  function validate() {
    const e = {}
    if (mode === 'signup' && !form.name.trim()) e.name = 'Full name is required'
    if (!form.email.includes('@'))              e.email = 'Enter a valid email address'
    if (form.password.length < 6)              e.password = 'Password must be at least 6 characters'
    return e
  }

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
      // onAuthStateChanged in AppContext will update isLoggedIn automatically
      navigate(role === 'freelancer' ? '/jobs' : '/dashboard')
    } catch (err) {
      const friendly = AUTH_ERRORS[err.code] || err.message || 'Something went wrong. Please try again.'
      setErrors({ general: friendly })
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next) { setMode(next); setErrors({}); setForgotPw(false); setResetSent(false) }

  async function handleReset(ev) {
    ev.preventDefault()
    if (!resetEmail.includes('@')) { setErrors({ resetEmail: 'Enter a valid email address' }); return }
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
                <label className={styles.label}>Email address</label>
                <input className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                  type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} autoComplete="email" />
                {errors.email && <p className={styles.errMsg}>{errors.email}</p>}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label className={styles.label}>Password</label>
                  {mode === 'login' && (
                    <button type="button" className={styles.forgotLink} onClick={() => { setForgotPw(true); setResetSent(false); setResetEmail(form.email); setErrors({}) }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className={styles.pwdWrap}>
                  <input className={`${styles.input} ${styles.inputPwd} ${errors.password ? styles.inputErr : ''}`}
                    type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={e => set('password', e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}>
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
                        value={resetEmail} onChange={e => { setResetEmail(e.target.value); setErrors(ev => ({ ...ev, resetEmail: '' })) }}
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

            <p className={styles.switchText}>
              {mode==='login'
                ? <>Don&apos;t have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('signup')}>Sign up</button></>
                : <>Already have an account?{' '}<button className={styles.switchLink} onClick={() => switchMode('login')}>Log in</button></>
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
