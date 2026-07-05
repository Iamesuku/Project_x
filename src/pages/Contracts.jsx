import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal'
import styles from './Contracts.module.css'
import DisputeModal from '../components/DisputeModal'

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  disputed: 'Disputed',
  pending_approval: 'Awaiting Approval',
}
const STATUS_COLORS = {
  active: 'green',
  completed: 'blue',
  disputed: 'red',
  pending_approval: 'amber',
}

/* Segmented progress bar — each segment = one milestone */
function ProgressBar({ value, milestones }) {
  const total = milestones?.length || 1
  const done  = milestones?.filter(m => m.done).length || 0
  return (
    <div className={styles.progressBar} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      {milestones?.length > 1 ? (
        <div className={styles.segmentedBar}>
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`${styles.segment} ${m.done ? styles.segmentDone : ''}`}
              title={m.label}
            />
          ))}
        </div>
      ) : (
        <div className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      )}
    </div>
  )
}

/* Animated stat card with counter */
function StatCard({ label, numericValue, displayValue, accent, amber }) {
  const [ref, vis] = useScrollReveal(0.1)
  const count = useCountUp(numericValue ?? 0, vis && numericValue != null)
  return (
    <div
      ref={ref}
      className={`${styles.statCard} ${accent ? styles.statAccent : ''} ${amber ? styles.statAmber : ''}`}
      style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s var(--ease-out)' }}
    >
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>
        {numericValue != null ? count : displayValue}
      </p>
    </div>
  )
}

/* ── Approve & Release Payment Modal ─────────────────────────────────────── */
function ApproveModal({ contract, onClose, onConfirm }) {
  const [success, setSuccess] = useState(false)

  function handleConfirm() {
    onConfirm(contract.amount, contract.jobTitle, contract.id, contract.freelancerId)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
          <div className={styles.successScreen}>
            <div className={styles.successCircle}>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.successSvg}>
                <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" fill="#f0fdf4"/>
                <path d="M14 26l9 9 15-15" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Payment Released!</h2>
            <p className={styles.successAmount}>{formatCurrency(contract.amount)}</p>
            <p className={styles.successMsg}>
              Payment released to <strong>{contract.freelancerName}</strong>
            </p>
            <p className={styles.successSub}>
              The funds have been transferred from escrow to {contract.freelancerName}'s wallet. Contract is now marked as complete.
            </p>
            <button className={styles.successBtn} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Approve &amp; Release Payment</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalJobRow}>
            <p className={styles.modalJobLabel}>Project</p>
            <p className={styles.modalJobTitle}>{contract.jobTitle}</p>
          </div>

          <div className={styles.modalInfoGrid}>
            <div className={styles.modalInfoItem}>
              <p className={styles.modalInfoLabel}>Freelancer</p>
              <div className={styles.modalFreelancer}>
                <div className={styles.modalAvatar}>{contract.freelancerAvatar}</div>
                <span className={styles.modalFreelancerName}>{contract.freelancerName}</span>
              </div>
            </div>
            <div className={styles.modalInfoItem}>
              <p className={styles.modalInfoLabel}>Contract Amount</p>
              <p className={styles.modalAmount}>{formatCurrency(contract.amount)}</p>
            </div>
          </div>

          <div className={styles.modalWarning}>
            <span className={styles.modalWarningIcon}>⚠️</span>
            <p>By confirming, you approve the work and release <strong>{formatCurrency(contract.amount)}</strong> from escrow to {contract.freelancerName}. This action cannot be undone.</p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.modalConfirmBtn} onClick={handleConfirm}>
            ✓ Confirm &amp; Release {formatCurrency(contract.amount)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Contract Card ───────────────────────────────────────────────────────── */
function ContractCard({ contract, onRelease, onToggleMilestone, onDispute, onApprove, onMarkComplete, isClient }) {
  const [showRelease, setShowRelease] = useState(false)
  const { wallet } = useApp()

  const colorKey = STATUS_COLORS[contract.status] || 'blue'

  return (
    <div className={`${styles.card} ${styles[`card_${colorKey}`]}`}>
      {/* Header */}
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={`${styles.statusBadge} ${styles[`status_${colorKey}`]}`}>
            {STATUS_LABELS[contract.status] || contract.status}
          </span>
          <h3 className={styles.cardTitle}>{contract.jobTitle}</h3>
          <div className={styles.parties}>
            <div className={styles.party}>
              <div className={styles.partyAvatar}>{contract.freelancerAvatar}</div>
              <span>{contract.freelancerName}</span>
            </div>
            <span className={styles.partySep}>·</span>
            <span className={styles.partyDate}>Started {contract.startDate}</span>
          </div>
        </div>
        <div className={styles.cardHeadRight}>
          <p className={styles.contractAmount}>{formatCurrency(contract.amount)}</p>
          <p className={styles.contractAmountLabel}>Contract value</p>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.section}>
        <div className={styles.progressHead}>
          <span className={styles.sectionLabel}>Progress</span>
          <span className={styles.progressPct}>{contract.progress}%</span>
        </div>
        <ProgressBar value={contract.progress} milestones={contract.milestones} />
      </div>

      {/* Milestones — timeline style */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Milestones</p>
        <div className={styles.timeline}>
          {contract.milestones.map((m, i) => (
            <div key={i} className={`${styles.timelineItem} ${m.done ? styles.timelineDone : ''}`}>
              {/* Connector line */}
              {i < contract.milestones.length - 1 && (
                <div className={`${styles.timelineConnector} ${m.done ? styles.timelineConnectorDone : ''}`} />
              )}
              <button
                className={styles.timelineCheck}
                onClick={() => onToggleMilestone(contract.id, i)}
                disabled={contract.status === 'completed' || contract.status === 'pending_approval'}
                aria-label={m.done ? `Unmark: ${m.label}` : `Mark complete: ${m.label}`}
                aria-pressed={m.done}
              >
                {m.done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span className={styles.timelineLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVE: Client-side actions ── */}
      {contract.status === 'active' && isClient && (
        <div className={styles.actions}>
          <Link to={`/messages/${contract.freelancerId}`} className={styles.msgBtn}>
            Message freelancer
          </Link>
          <button className={styles.disputeBtn} onClick={() => onDispute(contract)}>
            Raise a dispute
          </button>
          <button className={styles.releaseBtn} onClick={() => setShowRelease(v => !v)}>
            Release payment →
          </button>
        </div>
      )}

      {/* ── ACTIVE: Freelancer-side actions ── */}
      {contract.status === 'active' && !isClient && (
        <div className={styles.actions}>
          <Link to={`/messages/${contract.clientId}`} className={styles.msgBtn}>
            Message client
          </Link>
          <button
            className={styles.markCompleteBtn}
            onClick={() => onMarkComplete(contract.id)}
          >
            ✓ Mark as Complete
          </button>
        </div>
      )}

      {/* ── PENDING APPROVAL: Client sees the big approve button ── */}
      {contract.status === 'pending_approval' && isClient && (
        <div className={styles.pendingApprovalBanner}>
          <div className={styles.pendingLeft}>
            <span className={styles.pendingIcon}>🎉</span>
            <div>
              <p className={styles.pendingTitle}>Freelancer has marked this work as complete</p>
              <p className={styles.pendingSub}>Please review the deliverables and release the payment when satisfied.</p>
            </div>
          </div>
          <button
            className={styles.approveReleaseBtn}
            onClick={() => onApprove(contract)}
          >
            Approve &amp; Release Payment
          </button>
        </div>
      )}

      {/* ── PENDING APPROVAL: Freelancer sees status ── */}
      {contract.status === 'pending_approval' && !isClient && (
        <div className={styles.awaitingBanner}>
          <span>⏳</span>
          <span>Work submitted — awaiting client approval &amp; payment release</span>
        </div>
      )}

      {/* Inline release panel (legacy — client quick release on active) */}
      {showRelease && contract.status === 'active' && isClient && (
        <div className={styles.releasePanel}>
          <p className={styles.releasePanelTitle}>Release escrow payment</p>
          <p className={styles.releasePanelSub}>
            This will release <strong>{formatCurrency(contract.amount)}</strong> to {contract.freelancerName}.
            Only do this when you have approved the work.
          </p>
          {wallet.escrow >= contract.amount ? (
            <div className={styles.releasePanelActions}>
              <button className={styles.confirmRelease} onClick={() => { onRelease(contract.amount, contract.jobTitle, contract.id, contract.freelancerId); setShowRelease(false) }}>
                ✓ Confirm release
              </button>
              <button className={styles.cancelRelease} onClick={() => setShowRelease(false)}>Cancel</button>
            </div>
          ) : (
            <p className={styles.releaseInsufficient}>
              Insufficient escrow balance. <Link to="/wallet">Add funds →</Link>
            </p>
          )}
        </div>
      )}

      {contract.status === 'completed' && (
        <div className={styles.completedBanner}>
          <span>✓</span>
          <span>Completed on {contract.completedDate} · Payment released</span>
        </div>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function Contracts() {
  const { contracts, releaseEscrow, toggleMilestone, wallet, markContractComplete, user } = useApp()
  const [filter, setFilter]           = useState('all')
  const [disputeContract, setDisputeContract] = useState(null)
  const [approveContract, setApproveContract] = useState(null)

  const isClient = user.role === 'client'

  const filtered  = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)
  const active    = contracts.filter(c => c.status === 'active').length
  const completed = contracts.filter(c => c.status === 'completed').length
  const disputed  = contracts.filter(c => c.status === 'disputed').length
  const pending   = contracts.filter(c => c.status === 'pending_approval').length

  function handleApproveRelease(amount, jobTitle, contractId, freelancerId) {
    releaseEscrow(amount, jobTitle, contractId, freelancerId)
    setApproveContract(null)
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Project management</p>
            <h1 className={styles.title}>My <em>Contracts</em></h1>
          </div>
          {isClient
            ? <Link to="/post-job" className={styles.newJobBtn}>+ Post a new job</Link>
            : <Link to="/jobs"     className={styles.newJobBtn}>Browse jobs →</Link>
          }
        </div>

        {/* Stats — animated counters */}
        <div className={styles.statsRow}>
          <StatCard label="Active contracts"  numericValue={active}    accent={active > 0} />
          <StatCard label="Awaiting approval" numericValue={pending}   amber={pending > 0} />
          <StatCard label="Completed"         numericValue={completed} />
          <StatCard label="In escrow"         displayValue={formatCurrency(wallet.escrow ?? 0)} />
        </div>

        {/* Filter */}
        <div className={styles.filterRow}>
          {[
            ['all','All'],
            ['active','Active'],
            ['pending_approval','Awaiting Approval'],
            ['completed','Completed'],
            ['disputed','Disputed'],
          ].map(([v,l]) => (
            <button key={v} className={`${styles.filterBtn} ${filter===v?styles.filterActive:''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No contracts yet</p>
            <p className={styles.emptyBody}>
              {isClient
                ? "Post a job and accept a freelancer's proposal to create your first contract."
                : "Submit proposals to open jobs and get hired to create your first contract."}
            </p>
            {isClient
              ? <Link to="/post-job" className={styles.emptyBtn}>Post a job →</Link>
              : <Link to="/jobs"     className={styles.emptyBtn}>Browse jobs →</Link>
            }
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(c => (
              <ContractCard
                key={c.id}
                contract={c}
                isClient={isClient}
                onRelease={releaseEscrow}
                onToggleMilestone={toggleMilestone}
                onDispute={setDisputeContract}
                onApprove={setApproveContract}
                onMarkComplete={markContractComplete}
              />
            ))}
          </div>
        )}

        {/* Support link */}
        <div className={styles.supportFooter}>
          <Link to="/support" className={styles.supportLink}>
            View active dispute tickets →
          </Link>
        </div>
      </div>

      {/* Dispute modal */}
      {disputeContract && (
        <DisputeModal
          contract={disputeContract}
          onClose={() => setDisputeContract(null)}
        />
      )}

      {/* Approve & Release Payment modal */}
      {approveContract && (
        <ApproveModal
          contract={approveContract}
          onClose={() => setApproveContract(null)}
          onConfirm={handleApproveRelease}
        />
      )}
    </div>
  )
}
