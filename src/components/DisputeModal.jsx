import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import styles from './DisputeModal.module.css'

const DISPUTE_REASONS = [
  'Work not delivered',
  'Work quality below standard',
  'Freelancer unresponsive',
  'Scope creep / unauthorized charges',
  'Missed deadlines',
  'Fraudulent activity',
  'Other',
]

export default function DisputeModal({ contract, onClose }) {
  const { submitDispute, toast } = useApp()
  const [reason, setReason]         = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles]           = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const fileRef = useRef(null)
  const overlayRef = useRef(null)

  // Trap keyboard focus and close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  function handleFileChange(e) {
    const picked = Array.from(e.target.files).slice(0, 5)
    setFiles(prev => {
      const combined = [...prev, ...picked]
      return combined.slice(0, 5)
    })
  }

  function removeFile(idx) {
    setFiles(p => p.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) { toast('Please select a reason for the dispute', 'error'); return }
    if (description.trim().length < 30) { toast('Please provide a more detailed description (at least 30 characters)', 'error'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))   // simulate async
    submitDispute({
      contractId:     contract.id,
      jobTitle:       contract.jobTitle,
      freelancerName: contract.freelancerName,
      amount:         contract.amount,
      reason,
      description:    description.trim(),
      evidenceCount:  files.length,
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Dispute submitted">
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#e8f5ee"/>
                <path d="M10 16.5l4 4 8-8" stroke="#1a7a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Dispute submitted</h2>
            <p className={styles.successBody}>
              Your dispute for <strong>"{contract.jobTitle}"</strong> has been logged and assigned a ticket ID. Our resolution team will review your case and respond within <strong>24–48 hours</strong>. You can track the status on the <a href="/support">Support page</a>.
            </p>
            <div className={styles.successMeta}>
              <span className={styles.successMetaLabel}>Ticket reference</span>
              <span className={styles.successMetaValue}>NXS-{Date.now().toString().slice(-6)}</span>
            </div>
            <button className={styles.successClose} onClick={onClose}>Got it</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="dispute-title">

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.warningIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className={styles.headerEyebrow}>Dispute Resolution</p>
              <h2 className={styles.headerTitle} id="dispute-title">Raise a dispute</h2>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Contract reference */}
        <div className={styles.contractRef}>
          <div className={styles.contractRefLeft}>
            <p className={styles.contractRefLabel}>Contract</p>
            <p className={styles.contractRefTitle}>{contract.jobTitle}</p>
          </div>
          <div className={styles.contractRefRight}>
            <p className={styles.contractRefLabel}>Freelancer</p>
            <div className={styles.contractRefFreelancer}>
              <div className={styles.contractAvatar}>{contract.freelancerAvatar}</div>
              <span>{contract.freelancerName}</span>
            </div>
          </div>
          <div className={styles.contractRefRight}>
            <p className={styles.contractRefLabel}>Value</p>
            <p className={styles.contractRefAmount}>${contract.amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          {/* Reason */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dispute-reason">
              Reason for dispute <span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                id="dispute-reason"
                className={styles.select}
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason…</option>
                {DISPUTE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <svg className={styles.selectArrow} width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dispute-desc">
              Description <span className={styles.required}>*</span>
            </label>
            <p className={styles.fieldHint}>Explain what went wrong in as much detail as possible. Include any communications, agreements, or expectations that were not met.</p>
            <textarea
              id="dispute-desc"
              className={styles.textarea}
              placeholder="Describe the issue clearly…"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
            <p className={`${styles.charCount} ${description.length < 30 && description.length > 0 ? styles.charCountWarn : ''}`}>
              {description.length} characters {description.length < 30 && description.length > 0 ? '(minimum 30)' : ''}
            </p>
          </div>

          {/* Evidence upload */}
          <div className={styles.field}>
            <label className={styles.label}>
              Upload evidence <span className={styles.optional}>(optional, up to 5 files)</span>
            </label>
            <p className={styles.fieldHint}>Screenshots, documents, chat exports, or any files that support your claim.</p>

            <div
              className={styles.dropzone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add(styles.dragOver) }}
              onDragLeave={e => e.currentTarget.classList.remove(styles.dragOver)}
              onDrop={e => {
                e.preventDefault()
                e.currentTarget.classList.remove(styles.dragOver)
                const dropped = Array.from(e.dataTransfer.files).slice(0, 5)
                setFiles(prev => [...prev, ...dropped].slice(0, 5))
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className={styles.dropzoneText}>
                <span>Click to upload</span> or drag and drop
              </p>
              <p className={styles.dropzoneSub}>PNG, JPG, PDF, DOCX up to 10 MB each</p>
              <input ref={fileRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.docx,.doc" style={{ display:'none' }} onChange={handleFileChange} />
            </div>

            {files.length > 0 && (
              <ul className={styles.fileList}>
                {files.map((f, i) => (
                  <li key={i} className={styles.fileItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileSize}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" className={styles.fileRemove} onClick={() => removeFile(i)} aria-label="Remove file">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notice */}
          <div className={styles.notice}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>Submitting a dispute will pause this contract and notify your freelancer. Funds in escrow will be held until the case is resolved. Fraudulent disputes may result in account suspension.</p>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (
                <><span className={styles.btnSpinner} /> Submitting…</>
              ) : (
                'Submit dispute →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
