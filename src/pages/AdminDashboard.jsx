import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import styles from './AdminDashboard.module.css'

// ── Static mock data for demo purposes ───────────────────────────────────────
const MOCK_USERS = [
  { id: 'u1', name: 'Alex Johnson',    avatar: 'AJ', email: 'alex@unilag.edu.ng',     role: 'client',     status: 'active',    joined: '2026-02-01', trustScore: 92, jobs: 7  },
  { id: 'u2', name: 'Amara Osei',      avatar: 'AO', email: 'amara@unilag.edu.ng',    role: 'freelancer', status: 'active',    joined: '2026-01-15', trustScore: 98, jobs: 84 },
  { id: 'u3', name: 'Javier Ruiz',     avatar: 'JR', email: 'javier@unilag.edu.ng',   role: 'freelancer', status: 'active',    joined: '2026-01-20', trustScore: 95, jobs: 142},
  { id: 'u4', name: 'Kwame Asante',    avatar: 'KA', email: 'kwame@unilag.edu.ng',    role: 'freelancer', status: 'suspended', joined: '2025-12-10', trustScore: 42, jobs: 3  },
  { id: 'u5', name: 'Priya Nair',      avatar: 'PN', email: 'priya@unilag.edu.ng',    role: 'freelancer', status: 'active',    joined: '2026-02-05', trustScore: 100,jobs: 53 },
  { id: 'u6', name: 'Ethan Mwangi',    avatar: 'EM', email: 'ethan@unilag.edu.ng',    role: 'freelancer', status: 'active',    joined: '2025-11-01', trustScore: 88, jobs: 161},
  { id: 'u7', name: 'Chen Wei',        avatar: 'CW', email: 'chen@unilag.edu.ng',     role: 'freelancer', status: 'banned',    joined: '2025-10-12', trustScore: 8,  jobs: 0  },
  { id: 'u8', name: 'Fatima Al-Hassan',avatar: 'FA', email: 'fatima@unilag.edu.ng',   role: 'freelancer', status: 'active',    joined: '2026-01-05', trustScore: 100,jobs: 31 },
  { id: 'u9', name: 'Chidi Okonkwo',   avatar: 'CO', email: 'chidi@unilag.edu.ng',    role: 'freelancer', status: 'active',    joined: '2026-02-11', trustScore: 85, jobs: 28 },
  { id:'u10', name: 'Seun Adeyemi',    avatar: 'SA', email: 'seun@unilag.edu.ng',     role: 'client',     status: 'suspended', joined: '2025-12-20', trustScore: 33, jobs: 2  },
]

const MOCK_REPORTED_JOBS = [
  { id: 'rj1', jobId: 'j4',  title: 'Data pipeline in Python + AWS',              category: 'Development & IT',    reportCount: 3, reason: 'Misleading scope — budget listed as $2,000 but actual payment released is $200.', reportedAt: '2026-04-10', status: 'open',     reporter: 'Sofia Lindqvist' },
  { id: 'rj2', jobId: 'j11', title: 'Manage our faculty Instagram for 1 month',   category: 'Sales & Marketing',   reportCount: 5, reason: 'Posting unprofessional and offensive content on job description.', reportedAt: '2026-04-09', status: 'open',     reporter: 'Seun Adeyemi'    },
  { id: 'rj3', jobId: 'j2',  title: 'Brand identity for fintech startup',         category: 'Design & Creative',   reportCount: 1, reason: 'Suspected duplicate of existing posted job (j1). Possible spam.', reportedAt: '2026-04-08', status: 'reviewed', reporter: 'Amara Osei'      },
  { id: 'rj4', jobId: 'j7',  title: 'Mobile app UI design – iOS & Android',       category: 'Design & Creative',   reportCount: 2, reason: 'Contact details embedded in description to bypass platform payments.', reportedAt: '2026-04-07', status: 'removed',  reporter: 'Fatima Al-Hassan' },
  { id: 'rj5', jobId: 'j9',  title: 'Need a tutor for Calculus — 4 sessions',    category: 'Academic Support',    reportCount: 1, reason: 'Budget appears inflated (₦8,000 for 4 hours — possible scam).', reportedAt: '2026-04-06', status: 'open',     reporter: 'Chidi Okonkwo'   },
]

const TABS = ['overview', 'users', 'reports']

const TAB_LABELS = { overview: 'Overview', users: 'User Management', reports: 'Reported Jobs' }

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = {
  Users:    () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M17 20h5v-2a4 4 0 00-3-3.87M17 20H7m10 0v-2c0-.66-.13-1.3-.37-1.87M7 20H2v-2a4 4 0 013-3.87M7 20v-2c0-.66.13-1.3.37-1.87m0 0A4 4 0 1110 8a4 4 0 01-2.63 9.13M21 8a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Briefcase:() => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  Wallet:   () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h2"/></svg>,
  Shield:   () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Flag:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zm0 7v-7"/></svg>,
  Ban:      () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>,
  Check:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>,
  Warn:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  Trash:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 6h18m-2 0l-1.5 13A2 2 0 0115.5 21h-7a2 2 0 01-1.99-1.82L5 6m4-3h6m-6 0a1 1 0 00-1 1v1h8V4a1 1 0 00-1-1m-6 0h6"/></svg>,
}

// ── Trust score colour ────────────────────────────────────────────────────────
function trustColor(score) {
  if (score >= 80) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

export default function AdminDashboard() {
  const { jobs, transactions, freelancers } = useApp()
  const [activeTab, setActiveTab] = useState('overview')

  // ── User Management state ─────────────────────────────────────────────
  const [users, setUsers]           = useState(MOCK_USERS)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')  // all | active | suspended | banned
  const [confirmRow, setConfirmRow] = useState(null)   // { id, action } — pending confirmation

  // ── Reported Jobs state ───────────────────────────────────────────────
  const [reports, setReports]             = useState(MOCK_REPORTED_JOBS)
  const [reportFilter, setReportFilter]   = useState('all')  // all | open | reviewed | removed
  const [expandedReport, setExpandedReport] = useState(null)

  // ── KPI data ──────────────────────────────────────────────────────────
  const totalUsers        = users.length
  const activeJobs        = jobs.filter(j => j.status === 'open').length
  const totalTransactions = transactions.length
  const flaggedCount      = reports.filter(r => r.status === 'open').length
  const activeUsers       = users.filter(u => u.status === 'active').length
  const suspendedUsers    = users.filter(u => u.status === 'suspended').length
  const bannedUsers       = users.filter(u => u.status === 'banned').length

  // ── Activity feed data ────────────────────────────────────────────────
  const recentActivity = useMemo(() => [
    { id: 'a1', icon: '🧑‍💻', text: 'Javier Ruiz completed a contract for ₦1,200', ts: '2 min ago',  type: 'contract' },
    { id: 'a2', icon: '🚩', text: 'New report on "Manage our faculty Instagram"',   ts: '14 min ago', type: 'report'   },
    { id: 'a3', icon: '🧑‍🎓', text: 'Chidi Okonkwo joined as a new freelancer',      ts: '1 hr ago',   type: 'user'     },
    { id: 'a4', icon: '💸', text: 'Wallet funded: ₦15,000 by Adaeze Nwosu',         ts: '2 hr ago',   type: 'wallet'   },
    { id: 'a5', icon: '⚠️', text: 'Seun Adeyemi account suspended (low trust)',     ts: '3 hr ago',   type: 'admin'    },
    { id: 'a6', icon: '📋', text: 'New job posted: Mobile app UI design',           ts: '4 hr ago',   type: 'job'      },
    { id: 'a7', icon: '🚩', text: 'Job "Data pipeline in Python" flagged x3',       ts: '5 hr ago',   type: 'report'   },
    { id: 'a8', icon: '🧑‍💻', text: 'Fatima Al-Hassan submitted a proposal',          ts: '6 hr ago',   type: 'contract' },
  ], [])

  // ── User actions ──────────────────────────────────────────────────────
  function handleUserAction(userId, action) {
    if (confirmRow?.id === userId && confirmRow?.action === action) {
      // Confirmed — apply the action
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        const newStatus = action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'active'
        return { ...u, status: newStatus }
      }))
      setConfirmRow(null)
    } else {
      setConfirmRow({ id: userId, action })
    }
  }

  function cancelConfirm() { setConfirmRow(null) }

  // ── Report actions ────────────────────────────────────────────────────
  function handleReportAction(reportId, action) {
    setReports(prev => prev.map(r => {
      if (r.id !== reportId) return r
      if (action === 'remove')   return { ...r, status: 'removed'  }
      if (action === 'dismiss')  return { ...r, status: 'reviewed'  }
      return r
    }))
  }

  // ── Filtered users ────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchFilter = userFilter === 'all' || u.status === userFilter
    return matchSearch && matchFilter
  })

  const filteredReports = reports.filter(r =>
    reportFilter === 'all' || r.status === reportFilter
  )

  return (
    <div className={styles.page}>
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoText}>nexus</span>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.sideNav}>
          {TABS.map(tab => (
            <button
              key={tab}
              id={`admin-tab-${tab}`}
              className={`${styles.navItem} ${activeTab === tab ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className={styles.navIcon}>
                {tab === 'overview' && <Icon.Shield />}
                {tab === 'users'    && <Icon.Users />}
                {tab === 'reports'  && <Icon.Flag />}
              </span>
              <span>{TAB_LABELS[tab]}</span>
              {tab === 'reports' && flaggedCount > 0 && (
                <span className={styles.navBadge}>{flaggedCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminCard}>
            <div className={styles.adminAvatar}>A</div>
            <div>
              <p className={styles.adminName}>Admin Console</p>
              <p className={styles.adminRole}>Super Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className={styles.main}>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>System Overview</h1>
                <p className={styles.pageSubtitle}>Real-time platform health and activity monitoring</p>
              </div>
              <div className={styles.livePill}>
                <span className={styles.liveDot} />
                Live
              </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
              <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                <div className={styles.kpiIconWrap}><Icon.Users /></div>
                <div>
                  <p className={styles.kpiValue}>{totalUsers.toLocaleString()}</p>
                  <p className={styles.kpiLabel}>Total Users</p>
                  <p className={styles.kpiSub}>{activeUsers} active · {suspendedUsers} suspended · {bannedUsers} banned</p>
                </div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                <div className={styles.kpiIconWrap}><Icon.Briefcase /></div>
                <div>
                  <p className={styles.kpiValue}>{activeJobs}</p>
                  <p className={styles.kpiLabel}>Active Jobs</p>
                  <p className={styles.kpiSub}>{jobs.length} total listings posted</p>
                </div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                <div className={styles.kpiIconWrap}><Icon.Wallet /></div>
                <div>
                  <p className={styles.kpiValue}>{totalTransactions}</p>
                  <p className={styles.kpiLabel}>Total Transactions</p>
                  <p className={styles.kpiSub}>Deposits, escrows & releases</p>
                </div>
              </div>
              <div className={`${styles.kpiCard} ${styles.kpiRed}`}>
                <div className={styles.kpiIconWrap}><Icon.Flag /></div>
                <div>
                  <p className={styles.kpiValue}>{flaggedCount}</p>
                  <p className={styles.kpiLabel}>Open Reports</p>
                  <p className={styles.kpiSub}>{reports.length} total flagged items</p>
                </div>
              </div>
            </div>

            {/* Activity Feed + User Distribution */}
            <div className={styles.overviewGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Recent Activity</h2>
                  <span className={styles.panelMeta}>Last 24 hours</span>
                </div>
                <div className={styles.activityFeed}>
                  {recentActivity.map(a => (
                    <div key={a.id} className={styles.actRow}>
                      <span className={styles.actEmoji}>{a.icon}</span>
                      <div className={styles.actBody}>
                        <p className={styles.actText}>{a.text}</p>
                        <p className={styles.actTs}>{a.ts}</p>
                      </div>
                      <span className={`${styles.actType} ${styles[`actType_${a.type}`]}`}>{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.rightCol}>
                {/* User Status Distribution */}
                <div className={styles.panel}>
                  <div className={styles.panelHead}>
                    <h2 className={styles.panelTitle}>User Status</h2>
                  </div>
                  <div className={styles.distList}>
                    {[
                      { label: 'Active',    count: activeUsers,    color: 'var(--success)', pct: Math.round(activeUsers / totalUsers * 100) },
                      { label: 'Suspended', count: suspendedUsers, color: 'var(--warning)', pct: Math.round(suspendedUsers / totalUsers * 100) },
                      { label: 'Banned',    count: bannedUsers,    color: 'var(--danger)',  pct: Math.round(bannedUsers / totalUsers * 100) },
                    ].map(d => (
                      <div key={d.label} className={styles.distRow}>
                        <div className={styles.distMeta}>
                          <span className={styles.distDot} style={{ background: d.color }} />
                          <span className={styles.distLabel}>{d.label}</span>
                          <span className={styles.distCount}>{d.count}</span>
                        </div>
                        <div className={styles.distBar}>
                          <div className={styles.distFill} style={{ width: `${d.pct}%`, background: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Health */}
                <div className={styles.panel}>
                  <div className={styles.panelHead}>
                    <h2 className={styles.panelTitle}>Platform Health</h2>
                  </div>
                  <div className={styles.healthGrid}>
                    {[
                      { label: 'API Response', value: '98ms',  status: 'good' },
                      { label: 'Auth Service',  value: '100%',  status: 'good' },
                      { label: 'Firestore',     value: '99.9%', status: 'good' },
                      { label: 'RTDB',          value: '100%',  status: 'good' },
                      { label: 'Flagged Items', value: flaggedCount,  status: flaggedCount > 3 ? 'warn' : 'good' },
                      { label: 'Error Rate',    value: '0.02%', status: 'good' },
                    ].map(h => (
                      <div key={h.label} className={styles.healthCard}>
                        <p className={styles.healthVal}>{h.value}</p>
                        <p className={styles.healthLabel}>{h.label}</p>
                        <span className={`${styles.healthDot} ${h.status === 'warn' ? styles.healthWarn : styles.healthOk}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT TAB ──────────────────────────────────────  */}
        {activeTab === 'users' && (
          <div className={styles.tabContent}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>User Management</h1>
                <p className={styles.pageSubtitle}>{totalUsers} registered users · manage access and trust</p>
              </div>
            </div>

            {/* Controls */}
            <div className={styles.tableControls}>
              <input
                id="admin-user-search"
                className={styles.searchInput}
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <div className={styles.filterPills}>
                {['all', 'active', 'suspended', 'banned'].map(f => (
                  <button
                    key={f}
                    id={`admin-filter-${f}`}
                    className={`${styles.pill} ${userFilter === f ? styles.pillActive : ''}`}
                    onClick={() => setUserFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && (
                      <span className={styles.pillCount}>
                        {users.filter(u => u.status === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Trust Score</th>
                    <th>Jobs</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const isPending = confirmRow?.id === u.id
                    return (
                      <tr key={u.id} className={`${styles.row} ${u.status === 'banned' ? styles.rowBanned : u.status === 'suspended' ? styles.rowSuspended : ''}`}>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.tableAvatar}>{u.avatar}</div>
                            <div>
                              <p className={styles.userName}>{u.name}</p>
                              <p className={styles.userEmail}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.rolePill} ${u.role === 'client' ? styles.roleClient : styles.roleFreelancer}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className={styles.trustCell}>
                            <span className={styles.trustNum} style={{ color: trustColor(u.trustScore) }}>
                              {u.trustScore}
                            </span>
                            <div className={styles.trustBar}>
                              <div className={styles.trustFill} style={{ width: `${u.trustScore}%`, background: trustColor(u.trustScore) }} />
                            </div>
                          </div>
                        </td>
                        <td className={styles.numCell}>{u.jobs}</td>
                        <td className={styles.dateCell}>{u.joined}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status_${u.status}`]}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          {isPending ? (
                            <div className={styles.confirmRow}>
                              <span className={styles.confirmText}>
                                {confirmRow.action === 'ban' ? 'Ban' : confirmRow.action === 'suspend' ? 'Suspend' : 'Restore'} user?
                              </span>
                              <button id={`confirm-yes-${u.id}`} className={styles.confirmYes}  onClick={() => handleUserAction(u.id, confirmRow.action)}>Yes</button>
                              <button id={`confirm-no-${u.id}`}  className={styles.confirmNo}   onClick={cancelConfirm}>No</button>
                            </div>
                          ) : (
                            <div className={styles.actionBtns}>
                              {u.status !== 'active' && (
                                <button id={`restore-${u.id}`} className={`${styles.actionBtn} ${styles.actionRestore}`} onClick={() => handleUserAction(u.id, 'restore')} title="Restore user">
                                  <Icon.Check /> Restore
                                </button>
                              )}
                              {u.status !== 'suspended' && u.status !== 'banned' && (
                                <button id={`suspend-${u.id}`} className={`${styles.actionBtn} ${styles.actionSuspend}`} onClick={() => handleUserAction(u.id, 'suspend')} title="Suspend user">
                                  <Icon.Warn /> Suspend
                                </button>
                              )}
                              {u.status !== 'banned' && (
                                <button id={`ban-${u.id}`} className={`${styles.actionBtn} ${styles.actionBan}`} onClick={() => handleUserAction(u.id, 'ban')} title="Ban user">
                                  <Icon.Ban /> Ban
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>No users match your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REPORTED JOBS TAB ────────────────────────────────────────  */}
        {activeTab === 'reports' && (
          <div className={styles.tabContent}>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Reported Jobs</h1>
                <p className={styles.pageSubtitle}>{reports.length} flagged items · review and moderate content</p>
              </div>
              <div className={styles.warningPill}>
                <Icon.Flag />
                {flaggedCount} open
              </div>
            </div>

            {/* Filter bar */}
            <div className={styles.tableControls}>
              <div className={styles.filterPills}>
                {['all', 'open', 'reviewed', 'removed'].map(f => (
                  <button
                    key={f}
                    id={`report-filter-${f}`}
                    className={`${styles.pill} ${reportFilter === f ? styles.pillActive : ''}`}
                    onClick={() => setReportFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className={styles.pillCount}>
                      {f === 'all' ? reports.length : reports.filter(r => r.status === f).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Report cards */}
            <div className={styles.reportList}>
              {filteredReports.map(r => {
                const isExpanded = expandedReport === r.id
                return (
                  <div
                    key={r.id}
                    className={`${styles.reportCard} ${r.status === 'removed' ? styles.reportRemoved : r.status === 'reviewed' ? styles.reportReviewed : ''}`}
                  >
                    <div className={styles.reportTop} onClick={() => setExpandedReport(isExpanded ? null : r.id)}>
                      <div className={styles.reportLeft}>
                        <div className={styles.flagCircle}>
                          <Icon.Flag />
                        </div>
                        <div>
                          <p className={styles.reportTitle}>{r.title}</p>
                          <p className={styles.reportMeta}>{r.category} · Reported {r.reportedAt} by {r.reporter}</p>
                        </div>
                      </div>
                      <div className={styles.reportRight}>
                        <span className={styles.reportCount}>×{r.reportCount} reports</span>
                        <span className={`${styles.reportStatus} ${styles[`reportStatus_${r.status}`]}`}>{r.status}</span>
                        <span className={styles.reportChevron}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.reportDetail}>
                        <div className={styles.reportReason}>
                          <p className={styles.reportReasonLabel}>Reported reason</p>
                          <p className={styles.reportReasonText}>"{r.reason}"</p>
                        </div>
                        {r.status === 'open' && (
                          <div className={styles.reportActions}>
                            <button
                              id={`dismiss-report-${r.id}`}
                              className={`${styles.reportBtn} ${styles.reportBtnDismiss}`}
                              onClick={() => handleReportAction(r.id, 'dismiss')}
                            >
                              <Icon.Check /> Mark Reviewed
                            </button>
                            <button
                              id={`remove-report-${r.id}`}
                              className={`${styles.reportBtn} ${styles.reportBtnRemove}`}
                              onClick={() => handleReportAction(r.id, 'remove')}
                            >
                              <Icon.Trash /> Remove Job
                            </button>
                          </div>
                        )}
                        {r.status !== 'open' && (
                          <div className={styles.resolvedNote}>
                            <Icon.Check />
                            <span>This report has been {r.status}. No further action required.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {filteredReports.length === 0 && (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>No reports in this category</p>
                  <p className={styles.emptySub}>All flagged content has been reviewed.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
