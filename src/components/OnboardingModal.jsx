import { useState } from 'react'
import styles from './OnboardingModal.module.css'

// ── Onboarding Modal ──────────────────────────────────────────────────────
// Shown once to new users (detected by a localStorage flag) so they can
// choose their role before landing on the dashboard.
// Fires onComplete(role) when the user confirms.

export default function OnboardingModal({ userName, onComplete }) {
  const [selected, setSelected] = useState('client')
  const [saving,   setSaving]   = useState(false)

  async function handleConfirm() {
    setSaving(true)
    await onComplete(selected)
    setSaving(false)
  }

  const ROLES = [
    {
      value:   'client',
      icon:    '⊞',
      title:   'Service Seeker',
      sub:     'I need help with a project or task',
      perks:   ['Post jobs for free', 'Receive proposals in hours', 'Pay only when you approve'],
    },
    {
      value:   'freelancer',
      icon:    '◈',
      title:   'Service Provider',
      sub:     'I want to offer my skills and earn',
      perks:   ['Browse open projects', 'Submit proposals', 'Get paid through escrow'],
    },
  ]

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.logo}>NEXUS</p>
          <h2 id="onboarding-title" className={styles.title}>
            Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className={styles.sub}>
            One quick thing — how will you be using NEXUS?
          </p>
        </div>

        {/* Role cards */}
        <div className={styles.cards}>
          {ROLES.map(r => (
            <button
              key={r.value}
              className={`${styles.card} ${selected === r.value ? styles.cardActive : ''}`}
              onClick={() => setSelected(r.value)}
              aria-pressed={selected === r.value}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>{r.icon}</span>
                <div>
                  <p className={styles.cardTitle}>{r.title}</p>
                  <p className={styles.cardSub}>{r.sub}</p>
                </div>
              </div>
              <ul className={styles.perks}>
                {r.perks.map(p => (
                  <li key={p} className={styles.perk}>
                    <span className={styles.perkCheck}>✓</span> {p}
                  </li>
                ))}
              </ul>
              {selected === r.value && (
                <div className={styles.selectedBadge}>Selected ✓</div>
              )}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving
            ? <><span className={styles.spinner} /> Setting up your account…</>
            : `Continue as ${selected === 'client' ? 'Service Seeker' : 'Service Provider'} →`}
        </button>

      </div>
    </div>
  )
}
