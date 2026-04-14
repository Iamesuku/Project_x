import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Contracts.module.css'
import DisputeModal from '../components/DisputeModal'

const STATUS_LABELS = { active: 'Active', completed: 'Completed', disputed: 'Disputed' }
const STATUS_COLORS = { active: 'green', completed: 'blue', disputed: 'red' }

function ProgressBar({ value }) {
  return (
    <div className={styles.progressBar}>
      <div className={styles.progressFill} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

function ContractCard({ contract, onRelease, onToggleMilestone, onDispute }) {
  const [showRelease, setShowRelease] = useState(false)
  const { wallet } = useApp()

  return (
    <div className={`${styles.card} ${styles[`card_${STATUS_COLORS[contract.status]}`]}`}>
      {/* Header */}
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={`${styles.statusBadge} ${styles[`status_${STATUS_COLORS[contract.status]}`]}`}>
            {STATUS_LABELS[contract.status]}
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
          <p className={styles.contractAmount}>${contract.amount.toLocaleString()}</p>
          <p className={styles.contractAmountLabel}>Contract value</p>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.section}>
        <div className={styles.progressHead}>
          <span className={styles.sectionLabel}>Progress</span>
          <span className={styles.progressPct}>{contract.progress}%</span>
        </div>
        <ProgressBar value={contract.progress} />
      </div>

      {/* Milestones */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Milestones</p>
        <div className={styles.milestones}>
          {contract.milestones.map((m, i) => (
            <button
              key={i}
              className={`${styles.milestone} ${m.done ? styles.milestoneDone : ''}`}
              onClick={() => onToggleMilestone(contract.id, i)}
              disabled={contract.status === 'completed'}
            >
              <span className={styles.milestoneCheck}>{m.done ? '✓' : ''}</span>
              <span className={styles.milestoneLabel}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      {contract.status === 'active' && (
        <div className={styles.actions}>
          <Link to={`/messages/${contract.freelancerId}`} className={styles.msgBtn}>
            Message freelancer
          </Link>
          <button
            className={styles.disputeBtn}
            onClick={() => onDispute(contract)}
          >
            Raise a dispute
          </button>
          <button
            className={styles.releaseBtn}
            onClick={() => setShowRelease(v => !v)}
          >
            Release payment →
          </button>
        </div>
      )}

      {showRelease && (
        <div className={styles.releasePanel}>
          <p className={styles.releasePanelTitle}>Release escrow payment</p>
          <p className={styles.releasePanelSub}>
            This will release <strong>${contract.amount.toLocaleString()}</strong> to {contract.freelancerName}.
            Only do this when you have approved the work.
          </p>
          {wallet.escrow >= contract.amount ? (
            <div className={styles.releasePanelActions}>
              <button className={styles.confirmRelease} onClick={() => { onRelease(contract.amount, contract.jobTitle, contract.id); setShowRelease(false) }}>
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

export default function Contracts() {
  const { contracts, releaseEscrow, toggleMilestone, wallet } = useApp()
  const [filter, setFilter]           = useState('all')
  const [disputeContract, setDisputeContract] = useState(null)

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)
  const active    = contracts.filter(c => c.status === 'active').length
  const completed = contracts.filter(c => c.status === 'completed').length
  const disputed  = contracts.filter(c => c.status === 'disputed').length
  const totalValue = contracts.reduce((s, c) => s + c.amount, 0)

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Project management</p>
            <h1 className={styles.title}>My <em>Contracts</em></h1>
          </div>
          <Link to="/post-job" className={styles.newJobBtn}>+ Post a new job</Link>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: 'Active contracts', value: active,    accent: active > 0 },
            { label: 'Completed',        value: completed },
            { label: 'Disputed',         value: disputed,  danger: disputed > 0 },
            { label: 'In escrow',        value: `$${wallet.escrow.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className={`${styles.statCard} ${s.accent ? styles.statAccent : ''} ${s.danger ? styles.statDanger : ''}`}>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className={styles.filterRow}>
          {[['all','All'],['active','Active'],['completed','Completed'],['disputed','Disputed']].map(([v,l]) => (
            <button key={v} className={`${styles.filterBtn} ${filter===v?styles.filterActive:''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No contracts yet</p>
            <p className={styles.emptyBody}>Post a job and accept a freelancer's proposal to create your first contract.</p>
            <Link to="/post-job" className={styles.emptyBtn}>Post a job →</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(c => (
              <ContractCard
                key={c.id}
                contract={c}
                onRelease={releaseEscrow}
                onToggleMilestone={toggleMilestone}
                onDispute={setDisputeContract}
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
    </div>
  )
}
