import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import styles from './JobDetail.module.css'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { jobs, proposals, submitProposal, user, wallet, savedJobs, toggleSaveJob, isLoggedIn } = useApp()
  const job = jobs.find(j => j.id === id)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bid: '', coverLetter: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Role guard: clients post jobs, they don't apply to them
  const isClient     = user?.role === 'client'
  const canApply     = isLoggedIn && !isClient
  const currency     = wallet?.currency || 'NGN'

  if (!job) return (
    <div className={styles.notFound}>
      <p>Job not found.</p>
      <Link to="/jobs" className={styles.back}>← Back to jobs</Link>
    </div>
  )

  const jobProposals = proposals[id] || []
  const alreadyApplied = jobProposals.some(p => p.freelancer?.id === user.id)
  const isSaved = savedJobs.includes(job.id)
  const totalProposals = job.proposals + jobProposals.length

  function validate() {
    const e = {}
    if (!form.bid || isNaN(form.bid) || Number(form.bid) <= 0) e.bid = 'Enter a valid rate'
    if (!form.coverLetter.trim() || form.coverLetter.length < 20)
      e.coverLetter = 'Cover letter must be at least 20 characters'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await submitProposal(id, { bid: Number(form.bid), coverLetter: form.coverLetter.trim() })
      setSubmitted(true)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.topBar}>
          <Link to="/jobs" className={styles.backLink}>← All projects</Link>
          <button
            className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
            onClick={() => toggleSaveJob(job.id)}
          >
            {isSaved ? '♥ Saved' : '♡ Save job'}
          </button>
        </div>

        <div className={styles.layout}>
          {/* ── Main ── */}
          <div className={styles.main}>
            <div className={styles.card}>
              <div className={styles.jobHead}>
                <span className={styles.cat}>{job.category}</span>
                <h1 className={styles.title}>{job.title}</h1>
                <div className={styles.metaRow}>
                  <span className={`${styles.statusPill} ${styles[`statusPill_${job.status}`]}`}>{job.status?.replace('_',' ') || 'open'}</span>
                  <span className={styles.metaItem}>Posted {job.posted}</span>
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaItem}>{job.type} price</span>
                  {job.duration && <><span className={styles.metaDot}>·</span><span className={styles.metaItem}>{job.duration}</span></>}
                  <span className={styles.metaDot}>·</span>
                  <span className={styles.metaItem}>{totalProposals} proposals</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Project Description</h2>
                <p className={styles.body}>{job.description}</p>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Required Skills</h2>
                <div className={styles.skills}>
                  {job.skills.map(s => <span key={s} className={styles.skill}>{s}</span>)}
                </div>
              </div>
            </div>

            {/* ── Proposal / action area ── */}
            {submitted ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✓</div>
                <div>
                  <p className={styles.successTitle}>Proposal submitted successfully!</p>
                  <p className={styles.successSub}>
                    The client will review your proposal. Track it in your{' '}
                    <Link to="/dashboard" className={styles.successLink}>Dashboard</Link>.
                  </p>
                </div>
              </div>
            ) : alreadyApplied ? (
              <div className={styles.alreadyBox}>
                <span>✓</span>
                <span>You already submitted a proposal. Track it in your <Link to="/dashboard">Dashboard</Link>.</span>
              </div>
            ) : !isLoggedIn ? (
              // Guest prompt
              <div className={styles.guestBox}>
                <p className={styles.guestTitle}>Want to apply for this project?</p>
                <p className={styles.guestSub}>Create a free account to submit a proposal in minutes.</p>
                <Link to="/auth" className={styles.applyBtn}>Sign up & apply →</Link>
              </div>
            ) : isClient ? (
              // Clients see a reminder that they post, not apply
              <div className={styles.clientBox}>
                <p className={styles.clientTitle}>You're browsing as a client</p>
                <p className={styles.clientSub}>
                  Switch to freelancer mode in your{' '}
                  <Link to="/profile">profile settings</Link> to apply for jobs.
                </p>
              </div>
            ) : !showForm ? (
              <button className={styles.applyBtn} onClick={() => setShowForm(true)}>
                Apply for this project →
              </button>
            ) : (
              <div className={styles.card} role="form" aria-label="Submit proposal">
                <h2 className={styles.sectionTitle} style={{marginBottom:24}}>Submit a Proposal</h2>
                <form onSubmit={handleSubmit} className={styles.propForm} noValidate>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="bid-input">
                      {job.type === 'Hourly' ? 'Your hourly rate (₦/hr)' : 'Your bid (₦ fixed)'}
                    </label>
                    <div className={`${styles.bidWrap} ${errors.bid ? styles.bidErr : ''}`}>
                      <span className={styles.bidPrefix}>₦</span>
                      <input
                        id="bid-input"
                        className={styles.bidInput}
                        type="number" min="1"
                        placeholder={job.type === 'Hourly' ? '5000' : job.budget}
                        value={form.bid}
                        onChange={e => { setForm(f => ({...f, bid: e.target.value})); setErrors(e => ({...e, bid: ''})) }}
                        aria-invalid={!!errors.bid}
                        aria-describedby={errors.bid ? 'bid-error' : undefined}
                      />
                      {job.type === 'Hourly' && <span className={styles.bidSuffix}>/hr</span>}
                    </div>
                    {errors.bid && <p className={styles.errMsg} id="bid-error" role="alert">{errors.bid}</p>}
                    <p className={styles.hint}>Client's budget: {formatCurrency(job.budget, currency)}{job.type === 'Hourly' ? '/hr' : ''}</p>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="cover-input">Cover letter</label>
                    <textarea
                      id="cover-input"
                      className={`${styles.textarea} ${errors.coverLetter ? styles.textareaErr : ''}`}
                      rows={6}
                      placeholder="Why are you the right person for this project?…"
                      value={form.coverLetter}
                      onChange={e => { setForm(f => ({...f, coverLetter: e.target.value})); setErrors(e => ({...e, coverLetter: ''})) }}
                      aria-invalid={!!errors.coverLetter}
                      aria-describedby={errors.coverLetter ? 'cover-error' : undefined}
                    />
                    {errors.coverLetter && <p className={styles.errMsg} id="cover-error" role="alert">{errors.coverLetter}</p>}
                    <p className={styles.hint}>{form.coverLetter.length} chars · minimum 20</p>
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit proposal →'}
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.sideCard}>
              <p className={styles.sideLabel}>Budget</p>
              <p className={styles.sideBudget}>
                {job.type === 'Hourly' ? `$${job.budget}/hr` : `$${job.budget.toLocaleString()}`}
              </p>
              <p className={styles.sideType}>{job.type} price</p>
              <div className={styles.sideStats}>
                {[
                  ['Proposals', totalProposals],
                  ['Duration', job.duration || 'Not specified'],
                  ['Posted', job.posted],
                  ['Status', job.status?.replace('_',' ') || 'open'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.sideStat}>
                    <span className={styles.sideStatKey}>{k}</span>
                    <span className={styles.sideStatVal}>{v}</span>
                  </div>
                ))}
              </div>

              {!submitted && !alreadyApplied && (
                <button className={styles.sideApply} onClick={() => setShowForm(true)}>
                  {showForm ? 'Fill in form below ↓' : 'Apply now →'}
                </button>
              )}
            </div>

            {/* Wallet hint */}
            <div className={styles.walletCard}>
              <div className={styles.walletCardTop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>
                <span className={styles.walletCardLabel}>Your wallet</span>
              </div>
              <p className={styles.walletCardBal}>${wallet.balance.toFixed(2)}</p>
              <p className={styles.walletCardSub}>{wallet.escrow > 0 ? `$${wallet.escrow.toFixed(2)} in escrow` : 'Available balance'}</p>
              <Link to="/wallet" className={styles.walletCardLink}>Manage →</Link>
            </div>

            {/* Similar jobs */}
            <div className={styles.similarCard}>
              <p className={styles.similarTitle}>Similar projects</p>
              {jobs.filter(j => j.id !== id && j.category === job.category).slice(0, 3).map(sj => (
                <Link key={sj.id} to={`/job/${sj.id}`} className={styles.simRow}>
                  <div className={styles.simInfo}>
                    <p className={styles.simTitle}>{sj.title}</p>
                    <p className={styles.simMeta}>{sj.type === 'Hourly' ? `$${sj.budget}/hr` : `$${sj.budget.toLocaleString()}`}</p>
                  </div>
                </Link>
              ))}
              <Link to={`/jobs?cat=${encodeURIComponent(job.category)}`} className={styles.simMore}>
                See all {job.category} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
