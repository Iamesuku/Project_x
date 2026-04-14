import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Support.module.css'

const STATUS_META = {
  open:        { label: 'Open',        color: 'blue',   icon: '●' },
  under_review:{ label: 'Under Review',color: 'amber',  icon: '◐' },
  resolved:    { label: 'Resolved',    color: 'green',  icon: '✓' },
  closed:      { label: 'Closed',      color: 'gray',   icon: '○' },
}

const PRIORITY_META = {
  high:   { label: 'High',   color: 'red'   },
  medium: { label: 'Medium', color: 'amber' },
  low:    { label: 'Low',    color: 'green' },
}

const TIMELINE_STEPS = [
  { key: 'submitted',   label: 'Dispute submitted',      sub: 'We have received your case.' },
  { key: 'acknowledged',label: 'Acknowledged',           sub: 'A resolver has been assigned.' },
  { key: 'under_review',label: 'Under review',           sub: 'Evidence and communications are being reviewed.' },
  { key: 'decision',    label: 'Decision pending',       sub: 'A resolution will be issued shortly.' },
  { key: 'resolved',    label: 'Case resolved',          sub: 'Outcome communicated to all parties.' },
]

function TicketTimeline({ status }) {
  const activeIdx = status === 'open' ? 1
    : status === 'under_review' ? 2
    : status === 'resolved'     ? 4
    : status === 'closed'       ? 4 : 1

  return (
    <div className={styles.timeline}>
      {TIMELINE_STEPS.map((step, i) => {
        const done    = i <= activeIdx
        const current = i === activeIdx
        return (
          <div key={step.key} className={`${styles.timelineStep} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}>
            <div className={styles.timelineDot}>
              {done ? <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> : null}
            </div>
            {i < TIMELINE_STEPS.length - 1 && <div className={`${styles.timelineLine} ${i < activeIdx ? styles.timelineLineDone : ''}`} />}
            <div className={styles.timelineContent}>
              <p className={styles.timelineLabel}>{step.label}</p>
              {current && <p className={styles.timelineSub}>{step.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TicketCard({ ticket, expanded, onToggle }) {
  const sm = STATUS_META[ticket.status] || STATUS_META.open
  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.medium

  return (
    <article className={`${styles.ticketCard} ${expanded ? styles.ticketCardExpanded : ''}`}>
      <div className={styles.ticketCardHeader} onClick={onToggle} role="button" tabIndex={0}
           onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}>
        <div className={styles.ticketCardHeaderLeft}>
          <div className={styles.ticketIdRow}>
            <span className={styles.ticketId}>{ticket.id}</span>
            <span className={`${styles.statusBadge} ${styles[`status_${sm.color}`]}`}>
              <span className={styles.statusDot}>{sm.icon}</span>
              {sm.label}
            </span>
            <span className={`${styles.priorityBadge} ${styles[`priority_${pm.color}`]}`}>
              {pm.label} priority
            </span>
          </div>
          <h3 className={styles.ticketTitle}>{ticket.jobTitle}</h3>
          <div className={styles.ticketMeta}>
            <span>vs <strong>{ticket.freelancerName}</strong></span>
            <span className={styles.ticketMetaSep}>·</span>
            <span>{ticket.reason}</span>
            <span className={styles.ticketMetaSep}>·</span>
            <span>Filed {ticket.createdAt}</span>
          </div>
        </div>
        <div className={styles.ticketCardHeaderRight}>
          <p className={styles.ticketAmount}>${ticket.amount.toLocaleString()}</p>
          <p className={styles.ticketAmountLabel}>In dispute</p>
          <svg
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div className={styles.ticketDetail}>
          <div className={styles.ticketDetailGrid}>
            <div className={styles.ticketDetailLeft}>
              {/* Description */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Description</p>
                <p className={styles.detailSectionBody}>{ticket.description}</p>
              </div>
              {/* Evidence */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Evidence submitted</p>
                {ticket.evidenceCount > 0 ? (
                  <div className={styles.evidencePills}>
                    {Array.from({ length: ticket.evidenceCount }, (_, i) => (
                      <span key={i} className={styles.evidencePill}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        Document {i + 1}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noEvidence}>No files uploaded</p>
                )}
              </div>
              {/* Resolver note */}
              {ticket.resolverNote && (
                <div className={styles.resolverNote}>
                  <div className={styles.resolverNoteHead}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Resolver's note</span>
                  </div>
                  <p>{ticket.resolverNote}</p>
                </div>
              )}
            </div>
            <div className={styles.ticketDetailRight}>
              {/* Timeline */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Case progress</p>
                <TicketTimeline status={ticket.status} />
              </div>
              {/* Info grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoCell}>
                  <span className={styles.infoCellLabel}>Ticket ID</span>
                  <span className={styles.infoCellValue}>{ticket.id}</span>
                </div>
                <div className={styles.infoCell}>
                  <span className={styles.infoCellLabel}>Filed on</span>
                  <span className={styles.infoCellValue}>{ticket.createdAt}</span>
                </div>
                <div className={styles.infoCell}>
                  <span className={styles.infoCellLabel}>Contract value</span>
                  <span className={styles.infoCellValue}>${ticket.amount.toLocaleString()}</span>
                </div>
                <div className={styles.infoCell}>
                  <span className={styles.infoCellLabel}>Expected SLA</span>
                  <span className={styles.infoCellValue}>48 hours</span>
                </div>
              </div>
              {/* Actions */}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <div className={styles.ticketActions}>
                  <Link to={`/messages`} className={styles.ticketActionBtn}>
                    Message freelancer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

export default function Support() {
  const { disputes, user } = useApp()
  const [filter, setFilter]     = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = filter === 'all'
    ? disputes
    : disputes.filter(d => d.status === filter)

  const openCount     = disputes.filter(d => d.status === 'open').length
  const reviewCount   = disputes.filter(d => d.status === 'under_review').length
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Page header */}
        <div className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Conflict management</p>
            <h1 className={styles.title}>Dispute <em>Support</em></h1>
            <p className={styles.subtitle}>
              Track your active dispute tickets and view resolution progress. Our team reviews every case within 48 hours.
            </p>
          </div>
          <div className={styles.slaChip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>48-hour response SLA</span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: 'Total disputes',  value: disputes.length,    accent: false },
            { label: 'Open',            value: openCount,          accent: openCount > 0 },
            { label: 'Under review',    value: reviewCount,        accent: false, amber: reviewCount > 0 },
            { label: 'Resolved',        value: resolvedCount,      success: resolvedCount > 0 },
          ].map(s => (
            <div
              key={s.label}
              className={`${styles.statCard} ${s.accent ? styles.statAccentRed : ''} ${s.amber ? styles.statAccentAmber : ''} ${s.success ? styles.statAccentGreen : ''}`}
            >
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Guarantee strip */}
        <div className={styles.guaranteeStrip}>
          <div className={styles.guaranteeItem}>
            <div className={styles.guaranteeIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className={styles.guaranteeTitle}>Escrow protected</p>
              <p className={styles.guaranteeSub}>Funds are held until your case is resolved</p>
            </div>
          </div>
          <div className={styles.guaranteeDivider} />
          <div className={styles.guaranteeItem}>
            <div className={styles.guaranteeIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className={styles.guaranteeTitle}>Impartial review</p>
              <p className={styles.guaranteeSub}>Independent resolvers assess all evidence</p>
            </div>
          </div>
          <div className={styles.guaranteeDivider} />
          <div className={styles.guaranteeItem}>
            <div className={styles.guaranteeIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className={styles.guaranteeTitle}>Fair outcome</p>
              <p className={styles.guaranteeSub}>Decisions based on evidence and platform policy</p>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className={styles.filterRow}>
          {[
            ['all',         'All tickets'],
            ['open',        'Open'],
            ['under_review','Under review'],
            ['resolved',    'Resolved'],
            ['closed',      'Closed'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
              onClick={() => setFilter(v)}
            >
              {l}
              {v !== 'all' && disputes.filter(d => d.status === v).length > 0 && (
                <span className={styles.filterCount}>
                  {disputes.filter(d => d.status === v).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIllustration}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="23" stroke="var(--border)" strokeWidth="1.5"/>
                <path d="M18 24h12M18 30h8" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="24" cy="18" r="2" fill="var(--border)"/>
              </svg>
            </div>
            {disputes.length === 0 ? (
              <>
                <p className={styles.emptyTitle}>No disputes filed</p>
                <p className={styles.emptyBody}>
                  Great news — you have no active disputes. If a job goes wrong, you can raise a dispute directly from the <Link to="/contracts">Contracts page</Link>.
                </p>
              </>
            ) : (
              <>
                <p className={styles.emptyTitle}>No {filter} tickets</p>
                <p className={styles.emptyBody}>There are no tickets matching this filter.</p>
              </>
            )}
            <Link to="/contracts" className={styles.emptyBtn}>View contracts →</Link>
          </div>
        ) : (
          <div className={styles.ticketList}>
            {filtered.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                expanded={expandedId === ticket.id}
                onToggle={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              />
            ))}
          </div>
        )}

        {/* Help footer */}
        <div className={styles.helpFooter}>
          <div className={styles.helpFooterInner}>
            <div>
              <p className={styles.helpTitle}>Need urgent help?</p>
              <p className={styles.helpSub}>Our support team is available Monday–Friday, 9am–6pm WAT.</p>
            </div>
            <a href="mailto:support@nexus.dev" className={styles.helpBtn}>
              Contact support →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
