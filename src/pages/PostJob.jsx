import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './PostJob.module.css'

const CATS = ['Development & IT','Design & Creative','Writing & Translation','Finance & Accounting','Sales & Marketing','Engineering & Architecture','Legal','HR & Training','AI Services']

export default function PostJob() {
  const { postJob, wallet } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', category: CATS[0], description:'', skills:'', budget:'', type:'Fixed' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim() || form.description.length < 40) e.description = 'Description must be at least 40 characters'
    if (!form.budget || isNaN(form.budget) || Number(form.budget) <= 0) e.budget = 'Enter a valid budget'
    return e
  }

  function set(k, v) { setForm(f => ({...f, [k]: v})); setErrors(e => ({...e, [k]: undefined})) }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800))
    const job = postJob({
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      budget: Number(form.budget),
      type: form.type,
    })
    setSubmitting(false)
    navigate(`/job/${job.id}`)
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Post a project</p>
          <h1 className={styles.title}>Find the right<br/><em>talent, fast.</em></h1>
          <div className={styles.benefits}>
            {['Posting is always free','Receive proposals within hours','Pay only when you approve work','Protected by NEXUS escrow'].map(b=>(
              <div key={b} className={styles.benefit}>
                <span className={styles.benefitCheck}>✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
          {wallet.balance > 0 && (
            <div className={styles.walletHint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>
              Your wallet: <strong>${wallet.balance.toFixed(2)}</strong> available for escrow
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Project title <span className={styles.req}>*</span></label>
            <input className={`${styles.input} ${errors.title?styles.inputErr:''}`} placeholder="e.g. Build a React dashboard for our SaaS product" value={form.title} onChange={e=>set('title',e.target.value)} maxLength={120}/>
            {errors.title && <p className={styles.errMsg}>{errors.title}</p>}
            <p className={styles.hint}>{form.title.length}/120</p>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={form.category} onChange={e=>set('category',e.target.value)}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Project type</label>
              <div className={styles.typeGroup}>
                {['Fixed','Hourly'].map(t=>(
                  <button type="button" key={t} className={`${styles.typeBtn} ${form.type===t?styles.typeActive:''}`} onClick={()=>set('type',t)}>{t} price</button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description <span className={styles.req}>*</span></label>
            <textarea className={`${styles.textarea} ${errors.description?styles.inputErr:''}`} rows={6} placeholder="Describe the project in detail: goals, deliverables, timeline, and any requirements…" value={form.description} onChange={e=>set('description',e.target.value)}/>
            {errors.description && <p className={styles.errMsg}>{errors.description}</p>}
            <p className={styles.hint}>{form.description.length} chars · minimum 40</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Required skills <span className={styles.muted}>(comma-separated)</span></label>
            <input className={styles.input} placeholder="e.g. React, TypeScript, Figma" value={form.skills} onChange={e=>set('skills',e.target.value)}/>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{form.type === 'Hourly' ? 'Hourly rate (USD)' : 'Fixed budget (USD)'} <span className={styles.req}>*</span></label>
            <div className={styles.budgetWrap}>
              <span className={styles.budgetPrefix}>$</span>
              <input className={`${styles.input} ${styles.budgetInput} ${errors.budget?styles.inputErr:''}`} type="number" min="1" placeholder={form.type==='Hourly'?'50':'1000'} value={form.budget} onChange={e=>set('budget',e.target.value)}/>
              {form.type==='Hourly' && <span className={styles.budgetSuffix}>/hr</span>}
            </div>
            {errors.budget && <p className={styles.errMsg}>{errors.budget}</p>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? <><span className={styles.spinner}/> Posting…</> : 'Post project for free →'}
          </button>
        </form>
      </div>
    </div>
  )
}
