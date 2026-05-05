import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import styles from './Wallet.module.css'

const TX_ICONS = {
  deposit:    { icon: '↓', color: 'green',  label: 'Deposit' },
  withdrawal: { icon: '↑', color: 'red',    label: 'Withdrawal' },
  escrow:     { icon: '⊞', color: 'orange', label: 'Escrow Hold' },
  release:    { icon: '✓', color: 'green',  label: 'Released' },
}

// ── Generic modal shell ───────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle} id="wallet-modal-title">{title}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Amount modal ─────────────────────────────────────────────────────────
// Bug fixed: sym is now passed as a prop instead of relying on parent scope
function AmountModal({ title, label, actionLabel, onAction, onClose, max, sym }) {
  const [amount, setAmount] = useState('')
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)

  const PRESETS = max != null
    ? [500, 1000, 2000, 5000].filter(p => p <= max)
    : [500, 1000, 2000, 5000]

  async function submit() {
    const n = parseFloat(amount)
    if (!n || n <= 0)             { setErr('Enter a valid amount'); return }
    if (max != null && n > max)   { setErr(`Maximum available: ${sym}${max.toFixed(2)}`); return }
    setBusy(true)
    try {
      await onAction(n)
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.modalBody}>
        <p className={styles.modalLabel}>{label}</p>
        <div className={styles.amountWrap}>
          <span className={styles.amountPrefix}>{sym}</span>
          <input
            className={styles.amountInput}
            type="number"
            min="1"
            placeholder="0.00"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr('') }}
            autoFocus
            aria-label="Amount"
          />
        </div>
        {err && <p className={styles.amountErr} role="alert">{err}</p>}

        {PRESETS.length > 0 && (
          <div className={styles.presets} role="group" aria-label="Quick amounts">
            {PRESETS.map(p => (
              <button
                key={p}
                className={`${styles.preset} ${amount === String(p) ? styles.presetActive : ''}`}
                onClick={() => { setAmount(String(p)); setErr('') }}
              >
                {sym}{p.toLocaleString()}
              </button>
            ))}
          </div>
        )}

        {max != null && (
          <p className={styles.maxHint}>
            Available: <strong>{sym}{max.toFixed(2)}</strong>
          </p>
        )}

        <button
          className={styles.modalAction}
          onClick={submit}
          disabled={busy || !amount}
        >
          {busy
            ? <><span className={styles.spinner} /> Processing…</>
            : actionLabel}
        </button>
      </div>
    </Modal>
  )
}

// ── Main Wallet page ──────────────────────────────────────────────────────
export default function Wallet() {
  const { wallet, transactions, contracts, depositFunds, withdrawFunds, releaseEscrow } = useApp()
  const [modal,  setModal]  = useState(null) // 'deposit' | 'withdraw' | 'release'
  const [filter, setFilter] = useState('all')

  const sym      = wallet.currency === 'NGN' ? '₦' : '$'
  const currency = wallet.currency || 'NGN'

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  const totalIn  = transactions
    .filter(t => t.amount > 0 && t.type !== 'escrow')
    .reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions
    .filter(t => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  // First active contract for release linking
  const activeContract = contracts?.find(c => c.status === 'active')

  function handleRelease(amt) {
    return releaseEscrow(amt, activeContract?.jobTitle || 'Project', activeContract?.id || null)
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Financial overview</p>
            <h1 className={styles.title}>My <em>Wallet</em></h1>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statMain}`}>
            <p className={styles.statLabel}>Available Balance</p>
            <p className={styles.statValue}>{formatCurrency(wallet.balance, currency)}</p>
            <p className={styles.statSub}>Ready to use</p>
            <div className={styles.statActions}>
              <button className={styles.actionBtn} onClick={() => setModal('deposit')}>
                + Add funds
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionOutline}`}
                onClick={() => setModal('withdraw')}
                disabled={wallet.balance <= 0}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>In Escrow</p>
            <p className={`${styles.statValue} ${styles.statOrange}`}>
              {formatCurrency(wallet.escrow, currency)}
            </p>
            <p className={styles.statSub}>Protected, pending release</p>
            {wallet.escrow > 0 && (
              <button
                className={`${styles.actionBtn} ${styles.actionSmall}`}
                onClick={() => setModal('release')}
              >
                Release funds
              </button>
            )}
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Earned</p>
            <p className={`${styles.statValue} ${styles.statGreen}`}>
              {formatCurrency(wallet.earned, currency)}
            </p>
            <p className={styles.statSub}>Lifetime payments received</p>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Spent</p>
            <p className={styles.statValue}>{formatCurrency(totalOut, currency)}</p>
            <p className={styles.statSub}>Across all projects</p>
          </div>
        </div>

        {/* ── Escrow banner ── */}
        {wallet.escrow > 0 && (
          <div className={styles.escrowBanner}>
            <div className={styles.escrowLeft}>
              <span className={styles.escrowIcon}>⊞</span>
              <div>
                <p className={styles.escrowTitle}>Funds are protected in escrow</p>
                <p className={styles.escrowSub}>
                  {formatCurrency(wallet.escrow, currency)} is held securely and will be released to
                  the freelancer only when you approve the completed work.
                </p>
              </div>
            </div>
            <button className={styles.escrowBtn} onClick={() => setModal('release')}>
              Release payment →
            </button>
          </div>
        )}

        {/* ── Transaction history ── */}
        <div className={styles.historySection}>
          <div className={styles.historyHead}>
            <h2 className={styles.historyTitle}>Transaction History</h2>
            <div className={styles.filterGroup} role="group" aria-label="Filter transactions">
              {[
                ['all',        'All'],
                ['deposit',    'Deposits'],
                ['withdrawal', 'Withdrawals'],
                ['escrow',     'Escrow'],
                ['release',    'Released'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
                  onClick={() => setFilter(v)}
                  aria-pressed={filter === v}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.txList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyTx}>
                <p>No transactions to show.</p>
                {filter !== 'all' && (
                  <button className={styles.clearFilter} onClick={() => setFilter('all')}>
                    Show all →
                  </button>
                )}
              </div>
            ) : (
              filtered.map(tx => {
                const meta     = TX_ICONS[tx.type] || TX_ICONS.deposit
                const positive = tx.amount > 0
                return (
                  <div key={tx.id} className={styles.txRow}>
                    <div className={`${styles.txIcon} ${styles[`txIcon_${meta.color}`]}`}>
                      {meta.icon}
                    </div>
                    <div className={styles.txInfo}>
                      <p className={styles.txDesc}>{tx.desc}</p>
                      <p className={styles.txMeta}>{meta.label} · {tx.date}</p>
                    </div>
                    <div className={styles.txRight}>
                      <p className={`${styles.txAmount} ${positive ? styles.txPos : styles.txNeg}`}>
                        {positive ? '+' : ''}{formatCurrency(Math.abs(tx.amount), currency)}
                      </p>
                      <span className={`${styles.txStatus} ${styles[`txStatus_${tx.status}`]}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Explainer cards ── */}
        <div className={styles.infoGrid}>
          {[
            { icon: '⊞', title: 'Escrow protection',   body: 'When you hire a freelancer, funds are locked in escrow. Neither party can access them until work is approved — your money is always safe.' },
            { icon: '✓', title: 'Release on approval', body: 'Once you review and approve the deliverables, release the escrow payment with one click. Funds arrive instantly.' },
            { icon: '↩', title: 'Dispute resolution',  body: 'If there is a problem, open a dispute and the NEXUS team mediates. Funds remain locked until resolved.' },
          ].map(item => (
            <div key={item.title} className={styles.infoCard}>
              <span className={styles.infoIcon}>{item.icon}</span>
              <h3 className={styles.infoTitle}>{item.title}</h3>
              <p className={styles.infoBody}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'deposit' && (
        <AmountModal
          sym={sym}
          title="Add funds to wallet"
          label="How much would you like to add?"
          actionLabel="Add funds →"
          onAction={depositFunds}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'withdraw' && (
        <AmountModal
          sym={sym}
          title="Withdraw funds"
          label="How much would you like to withdraw?"
          actionLabel="Withdraw →"
          onAction={withdrawFunds}
          onClose={() => setModal(null)}
          max={wallet.balance}
        />
      )}
      {modal === 'release' && (
        <AmountModal
          sym={sym}
          title="Release escrow payment"
          label="How much would you like to release?"
          actionLabel="Release payment →"
          onAction={handleRelease}
          onClose={() => setModal(null)}
          max={wallet.escrow}
        />
      )}
    </div>
  )
}
