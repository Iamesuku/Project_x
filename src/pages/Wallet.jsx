import { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Wallet.module.css'

const TX_ICONS = {
  deposit:    { icon: '↓', color: 'green',  label: 'Deposit' },
  withdrawal: { icon: '↑', color: 'red',    label: 'Withdrawal' },
  escrow:     { icon: '⊞', color: 'orange', label: 'Escrow Hold' },
  release:    { icon: '✓', color: 'green',  label: 'Released' },
}

function Modal({ title, onClose, children }) {
  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AmountModal({ title, label, actionLabel, onAction, onClose, max }) {
  const [amount, setAmount] = useState('')
  const [err, setErr] = useState('')

  const PRESETS = max
    ? [50, 100, 200, 500].filter(p => p <= max)
    : [50, 100, 200, 500]

  function submit() {
    const n = parseFloat(amount)
    if (!n || n <= 0) { setErr('Enter a valid amount'); return }
    if (max && n > max) { setErr(`Maximum available: ${max.toFixed(2)}`); return }
    onAction(n)
    onClose()
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.modalBody}>
        <p className={styles.modalLabel}>{label}</p>
        <div className={styles.amountWrap}>
          <span className={styles.amountPrefix}>$</span>
          <input
            className={styles.amountInput}
            type="number"
            min="1"
            placeholder="0.00"
            value={amount}
            onChange={e => { setAmount(e.target.value); setErr('') }}
            autoFocus
          />
        </div>
        {err && <p className={styles.amountErr}>{err}</p>}
        <div className={styles.presets}>
          {PRESETS.map(p => (
            <button key={p} className={styles.preset} onClick={() => setAmount(String(p))}>
              ${p}
            </button>
          ))}
        </div>
        {max != null && (
          <p className={styles.maxHint}>Available: <strong>{sym}{max.toFixed(2)}</strong></p>
        )}
        <button className={styles.modalAction} onClick={submit}>{actionLabel}</button>
      </div>
    </Modal>
  )
}

export default function Wallet() {
  const { wallet, transactions, contracts, depositFunds, withdrawFunds, releaseEscrow } = useApp()
  const [modal,  setModal]  = useState(null) // 'deposit' | 'withdraw' | 'release'
  const [filter, setFilter] = useState('all')

  // Currency symbol — ready for backend to pass real currency
  const sym = wallet.currency === 'NGN' ? '₦' : '$'

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  const totalIn  = transactions.filter(t => t.amount > 0 && t.type !== 'release').reduce((s,t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0)

  // Find the first active contract to link release to — fallback gracefully
  const activeContract = contracts?.find(c => c.status === 'active')

  function handleRelease(amt) {
    releaseEscrow(amt, activeContract?.jobTitle || 'Project', activeContract?.id || null)
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
            <p className={styles.statValue}>{sym}{wallet.balance.toFixed(2)}</p>
            <p className={styles.statSub}>Ready to use</p>
            <div className={styles.statActions}>
              <button className={styles.actionBtn} onClick={() => setModal('deposit')}>+ Add funds</button>
              <button className={`${styles.actionBtn} ${styles.actionOutline}`} onClick={() => setModal('withdraw')}>Withdraw</button>
            </div>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>In Escrow</p>
            <p className={`${styles.statValue} ${styles.statOrange}`}>{sym}{wallet.escrow.toFixed(2)}</p>
            <p className={styles.statSub}>Protected, pending release</p>
            {wallet.escrow > 0 && (
              <button className={`${styles.actionBtn} ${styles.actionSmall}`} onClick={() => setModal('release')}>
                Release funds
              </button>
            )}
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Earned</p>
            <p className={`${styles.statValue} ${styles.statGreen}`}>{sym}{wallet.earned.toFixed(2)}</p>
            <p className={styles.statSub}>Lifetime payments received</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Spent</p>
            <p className={styles.statValue}>{sym}{totalOut.toFixed(2)}</p>
            <p className={styles.statSub}>Across all projects</p>
          </div>
        </div>

        {/* ── Escrow breakdown banner ── */}
        {wallet.escrow > 0 && (
          <div className={styles.escrowBanner}>
            <div className={styles.escrowLeft}>
              <span className={styles.escrowIcon}>⊞</span>
              <div>
                <p className={styles.escrowTitle}>Funds are protected in escrow</p>
                <p className={styles.escrowSub}>
                  {sym}{wallet.escrow.toFixed(2)} is held securely and will be released to the freelancer
                  only when you approve the completed work.
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
            <div className={styles.filterGroup}>
              {[['all','All'],['deposit','Deposits'],['withdrawal','Withdrawals'],['escrow','Escrow'],['release','Released']].map(([v,l]) => (
                <button key={v} className={`${styles.filterBtn} ${filter===v?styles.filterActive:''}`} onClick={() => setFilter(v)}>{l}</button>
              ))}
            </div>
          </div>

          <div className={styles.txList}>
            {filtered.length === 0 && (
              <p className={styles.emptyTx}>No transactions to show.</p>
            )}
            {filtered.map(tx => {
              const meta = TX_ICONS[tx.type] || TX_ICONS.deposit
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
                      {positive ? '+' : ''}{sym}{Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <span className={`${styles.txStatus} ${styles[`txStatus_${tx.status}`]}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── How escrow works ── */}
        <div className={styles.infoGrid}>
          {[
            { icon: '⊞', title: 'Escrow protection', body: 'When you hire a freelancer, funds are locked in escrow. Neither party can access them until work is approved — your money is always safe.' },
            { icon: '✓', title: 'Release on approval', body: 'Once you review and approve the deliverables, release the escrow payment with one click. Funds arrive instantly.' },
            { icon: '↩', title: 'Dispute resolution', body: 'If there is a problem, open a dispute and the NEXUS team mediates. Funds remain locked until resolved.' },
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
          title="Add funds to wallet"
          label="How much would you like to add?"
          actionLabel="Add funds"
          onAction={depositFunds}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'withdraw' && (
        <AmountModal
          title="Withdraw funds"
          label="How much would you like to withdraw?"
          actionLabel="Withdraw"
          onAction={withdrawFunds}
          onClose={() => setModal(null)}
          max={wallet.balance}
        />
      )}
      {modal === 'release' && (
        <AmountModal
          title="Release escrow payment"
          label="How much would you like to release?"
          actionLabel="Release payment"
          onAction={handleRelease}
          onClose={() => setModal(null)}
          max={wallet.escrow}
        />
      )}
    </div>
  )
}
