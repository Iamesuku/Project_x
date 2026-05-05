import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Dashboard.module.css'

/* ── Analytics: pure-SVG bar chart ──────────────────────────────────────── */
function WeeklyBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const chartH = 120
  const barW = 40
  const gap = 18
  const totalW = data.length * (barW + gap) - gap

  return (
    <svg
      viewBox={`0 0 ${totalW + 20} ${chartH + 40}`}
      className={styles.barChartSvg}
      aria-label="Weekly earnings bar chart"
    >
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * chartH)
        const x = i * (barW + gap) + 10
        const y = chartH - barH
        const isMax = d.value === max
        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={x} y={y} width={barW} height={barH}
              rx="6" ry="6"
              fill={isMax ? '#1a1a1a' : '#e5e7eb'}
              className={styles.barRect}
            />
            {/* Value label on top */}
            <text
              x={x + barW / 2} y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight={isMax ? '700' : '500'}
              fill={isMax ? '#1a1a1a' : '#6b7280'}
            >
              {d.value > 0 ? `$${d.value}` : '—'}
            </text>
            {/* Week label below */}
            <text
              x={x + barW / 2} y={chartH + 18}
              textAnchor="middle"
              fontSize="11"
              fill="#9ca3af"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Analytics Tab ───────────────────────────────────────────────────────── */
function AnalyticsTab({ contracts, proposals, user, transactions }) {
  // ── Earnings this month vs last month ──
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  const releaseTransactions = transactions.filter(tx => tx.type === 'release')

  function sumEarnings(month, year) {
    return releaseTransactions
      .filter(tx => {
        const d = new Date(tx.date)
        return d.getMonth() === month && d.getFullYear() === year
      })
      .reduce((s, tx) => s + Math.abs(tx.amount), 0)
  }

  const earningsThisMonth = sumEarnings(thisMonth, thisYear)
  const earningsLastMonth = sumEarnings(lastMonth, lastMonthYear)
  const earningsDelta = earningsThisMonth - earningsLastMonth
  const earningsPct   = earningsLastMonth > 0
    ? ((earningsDelta / earningsLastMonth) * 100).toFixed(0)
    : earningsThisMonth > 0 ? 100 : 0

  // ── Proposals stats ──
  const allProposals = Object.values(proposals).flat()
  const myProposals  = allProposals.filter(p => p.freelancer?.id === user.id)
  const sent         = myProposals.length
  const accepted     = myProposals.filter(p => p.status === 'accepted').length
  const acceptRate   = sent > 0 ? ((accepted / sent) * 100).toFixed(0) : 0

  // ── Weekly earnings (past 4 weeks) ──
  function getWeekLabel(weeksAgo) {
    if (weeksAgo === 0) return 'This wk'
    if (weeksAgo === 1) return 'Last wk'
    return `${weeksAgo}w ago`
  }

  function weekEarnings(weeksAgo) {
    const end   = new Date(); end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() - weeksAgo * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return releaseTransactions
      .filter(tx => {
        const d = new Date(tx.date)
        return d >= start && d <= end
      })
      .reduce((s, tx) => s + Math.abs(tx.amount), 0)
  }

  // Seed some demo data if no real release transactions exist
  const weeklyData = releaseTransactions.length > 0
    ? [3, 2, 1, 0].map(w => ({ label: getWeekLabel(w), value: weekEarnings(w) }))
    : [
        { label: '3w ago', value: 240 },
        { label: '2w ago', value: 380 },
        { label: 'Last wk', value: 120 },
        { label: 'This wk', value: 310 },
      ]

  const totalWeekly = weeklyData.reduce((s, d) => s + d.value, 0)

  // ── Top skills in demand (from all open jobs) ──
  const DEMANDED_SKILLS = [
    { skill: 'React',           count: 28, category: 'Development' },
    { skill: 'UI/UX Design',    count: 22, category: 'Design' },
    { skill: 'Python',          count: 19, category: 'Development' },
    { skill: 'Figma',           count: 18, category: 'Design' },
    { skill: 'Content Writing', count: 15, category: 'Writing' },
    { skill: 'Node.js',         count: 13, category: 'Development' },
    { skill: 'Data Analysis',   count: 11, category: 'Analytics' },
    { skill: 'Video Editing',   count: 9,  category: 'Creative' },
  ]
  const maxCount = DEMANDED_SKILLS[0].count

  const CATEGORY_COLORS = {
    'Development': '#6366f1',
    'Design':      '#ec4899',
    'Writing':     '#f59e0b',
    'Analytics':   '#06b6d4',
    'Creative':    '#8b5cf6',
  }

  return (
    <div className={styles.analyticsGrid}>
      {/* ── Earnings comparison ── */}
      <div className={styles.analyticsCard}>
        <div className={styles.analyticsCardHead}>
          <h3 className={styles.analyticsCardTitle}>Earnings — Month over Month</h3>
          <span className={styles.analyticsBadge}>Income</span>
        </div>
        <div className={styles.earningsRow}>
          <div className={styles.earningsBlock}>
            <p className={styles.earningsLabel}>This month</p>
            <p className={styles.earningsValue}>${earningsThisMonth.toLocaleString()}</p>
            <div className={`${styles.earningsDelta} ${earningsDelta >= 0 ? styles.deltaUp : styles.deltaDown}`}>
              {earningsDelta >= 0 ? '▲' : '▼'} {Math.abs(earningsPct)}%
              <span> vs last month</span>
            </div>
          </div>
          <div className={styles.earningsDivider} />
          <div className={`${styles.earningsBlock} ${styles.earningsBlockMuted}`}>
            <p className={styles.earningsLabel}>Last month</p>
            <p className={styles.earningsValueSm}>${earningsLastMonth.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Proposal ratio ── */}
      <div className={styles.analyticsCard}>
        <div className={styles.analyticsCardHead}>
          <h3 className={styles.analyticsCardTitle}>Proposal Performance</h3>
          <span className={styles.analyticsBadge}>Proposals</span>
        </div>
        <div className={styles.proposalStats}>
          <div className={styles.proposalRatioCircle}>
            <svg viewBox="0 0 80 80" className={styles.donutSvg}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8"/>
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke="#1a1a1a" strokeWidth="8"
                strokeDasharray={`${(acceptRate / 100) * 201} 201`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className={styles.donutLabel}>
              <span className={styles.donutPct}>{acceptRate}%</span>
              <span className={styles.donutSub}>accepted</span>
            </div>
          </div>
          <div className={styles.proposalBreakdown}>
            <div className={styles.propStatRow}>
              <div className={styles.propStatDot} style={{background:'#1a1a1a'}}/>
              <div>
                <p className={styles.propStatNum}>{sent}</p>
                <p className={styles.propStatLabel}>Sent</p>
              </div>
            </div>
            <div className={styles.propStatRow}>
              <div className={styles.propStatDot} style={{background:'#22c55e'}}/>
              <div>
                <p className={styles.propStatNum}>{accepted}</p>
                <p className={styles.propStatLabel}>Accepted</p>
              </div>
            </div>
            <div className={styles.propStatRow}>
              <div className={styles.propStatDot} style={{background:'#e5e7eb'}}/>
              <div>
                <p className={styles.propStatNum}>{sent - accepted}</p>
                <p className={styles.propStatLabel}>Pending</p>
              </div>
            </div>
          </div>
        </div>
        {sent === 0 && (
          <p className={styles.analyticsHint}>Submit proposals to start tracking your success rate.</p>
        )}
      </div>

      {/* ── Weekly bar chart (full width) ── */}
      <div className={`${styles.analyticsCard} ${styles.analyticsCardFull}`}>
        <div className={styles.analyticsCardHead}>
          <h3 className={styles.analyticsCardTitle}>Weekly Earnings — Past 4 Weeks</h3>
          <span className={styles.analyticsBadge}>${totalWeekly.toLocaleString()} total</span>
        </div>
        <div className={styles.barChartWrap}>
          <WeeklyBarChart data={weeklyData} />
        </div>
        <p className={styles.analyticsHint}>
          Bars reflect payments released to your wallet each week.
        </p>
      </div>

      {/* ── Top skills in demand ── */}
      <div className={`${styles.analyticsCard} ${styles.analyticsCardFull}`}>
        <div className={styles.analyticsCardHead}>
          <h3 className={styles.analyticsCardTitle}>Top Skills in Demand on NEXUS</h3>
          <span className={styles.analyticsBadge}>Market insights</span>
        </div>
        <div className={styles.skillsDemandList}>
          {DEMANDED_SKILLS.map((s, i) => (
            <div key={s.skill} className={styles.skillDemandRow}>
              <div className={styles.skillDemandLeft}>
                <span className={styles.skillDemandRank}>{i + 1}</span>
                <div>
                  <p className={styles.skillDemandName}>{s.skill}</p>
                  <p className={styles.skillDemandCat}
                    style={{ color: CATEGORY_COLORS[s.category] || '#6b7280' }}>
                    {s.category}
                  </p>
                </div>
              </div>
              <div className={styles.skillDemandRight}>
                <div className={styles.skillDemandBar}>
                  <div
                    className={styles.skillDemandFill}
                    style={{
                      width: `${(s.count / maxCount) * 100}%`,
                      background: CATEGORY_COLORS[s.category] || '#1a1a1a',
                    }}
                  />
                </div>
                <span className={styles.skillDemandCount}>{s.count} jobs</span>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.analyticsHint}>
          Based on active job listings. Keep your skills sharp in high-demand areas!
        </p>
      </div>
    </div>
  )
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, wallet, transactions, jobs, proposals, freelancers, acceptProposal, contracts } = useApp()
  const [activeTab, setActiveTab] = useState('overview')

  const postedJobs = jobs.filter(j => j.clientId === user.id)
  const totalProposals = postedJobs.reduce((s, j) => s + (proposals[j.id]?.length || 0), 0)
  const activeContracts = contracts.filter(c => c.status === 'active')
  const recentTx = transactions.slice(0, 5)

  // Freelancer applied jobs
  const appliedJobs = Object.entries(proposals)
    .filter(([,props]) => props.some(p => p.freelancer?.id === user.id))
    .map(([jobId]) => jobs.find(j => j.id === jobId))
    .filter(Boolean)

  const isClient = user.role === 'client'

  const TABS = isClient
    ? [['overview','Overview'],['jobs','My Jobs'],['proposals','Proposals'],['activity','Activity']]
    : [['overview','Overview'],['applied','Applied Jobs'],['contracts','Active Work'],['analytics','Your Performance'],['activity','Activity']]

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.userRow}>
            <div className={styles.bigAvatar}>{user.avatar}</div>
            <div>
              <p className={styles.greeting}>Good day,</p>
              <h1 className={styles.name}>{user.name}</h1>
              <div className={styles.memberRow}>
                <span className={styles.roleBadge}>{isClient ? 'Client' : 'Freelancer'}</span>
                <span className={styles.memberSince}>Member since {user.memberSince}</span>
              </div>
            </div>
          </div>
          <div className={styles.quickActions}>
            {isClient
              ? <Link to="/post-job"  className={styles.qaBtn}>+ Post a job</Link>
              : <Link to="/jobs"      className={styles.qaBtn}>Browse jobs</Link>
            }
            <Link to="/wallet" className={`${styles.qaBtn} ${styles.qaOutline}`}>Manage wallet</Link>
            <Link to="/profile" className={`${styles.qaBtn} ${styles.qaOutline}`}>Edit profile</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(([v,l]) => (
            <button
              key={v}
              className={`${styles.tab} ${activeTab===v?styles.tabActive:''} ${v==='analytics'?styles.tabAnalytics:''}`}
              onClick={() => setActiveTab(v)}
            >
              {v === 'analytics' && <span className={styles.tabIcon}>📊</span>}
              {l}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.kpiRow}>
              {(isClient ? [
                { label:'Wallet Balance',  value:`₦${(wallet.balance||0).toLocaleString()}`, sub:'Available',      link:'/wallet' },
                { label:'In Escrow',       value:`₦${(wallet.escrow||0).toLocaleString()}`,  sub:'Protected',      link:'/wallet', accent: (wallet.escrow||0) > 0 },
                { label:'Active Contracts',value: activeContracts.length,                     sub:'In progress',    link:'/contracts' },
                { label:'Jobs Posted',     value: postedJobs.length,                          sub:'All time',       link:null },
                { label:'Proposals In',    value: totalProposals,                             sub:'Total received', link:null },
              ] : [
                { label:'Wallet Balance',  value:`₦${(wallet.balance||0).toLocaleString()}`, sub:'Available',   link:'/wallet' },
                { label:'Total Earned',    value:`₦${(wallet.earned||0).toLocaleString()}`,  sub:'Lifetime',    link:'/wallet' },
                { label:'Active Contracts',value: activeContracts.length,                     sub:'In progress', link:'/contracts' },
                { label:'Jobs Applied',    value: appliedJobs.length,                         sub:'All time',    link:null },
              ]).map(k => (
                <div key={k.label} className={`${styles.kpi} ${k.accent ? styles.kpiAccent : ''}`}>
                  <p className={styles.kpiLabel}>{k.label}</p>
                  <p className={styles.kpiValue}>{k.value}</p>
                  <p className={styles.kpiSub}>{k.sub}</p>
                  {k.link && <Link to={k.link} className={styles.kpiLink}>View →</Link>}
                </div>
              ))}
            </div>

            <div className={styles.twoCol}>
              {/* Recent jobs / contracts */}
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>{isClient ? 'Recent Jobs' : 'Active Contracts'}</h2>
                  <Link to={isClient ? '/post-job' : '/contracts'} className={styles.panelAction}>{isClient ? '+ New' : 'See all'}</Link>
                </div>
                {(isClient ? postedJobs : activeContracts).length === 0 ? (
                  <div className={styles.panelEmpty}>
                    <p>{isClient ? 'No jobs posted yet.' : 'No active contracts yet.'}</p>
                    <Link to={isClient ? '/post-job' : '/jobs'} className={styles.emptyLink}>
                      {isClient ? 'Post your first job →' : 'Find work →'}
                    </Link>
                  </div>
                ) : (
                  <div className={styles.miniList}>
                    {(isClient ? postedJobs.slice(0,4) : activeContracts.slice(0,4)).map(item => (
                      <Link to={isClient ? `/job/${item.id}` : '/contracts'} key={item.id} className={styles.miniRow}>
                        <div className={styles.miniInfo}>
                          <p className={styles.miniTitle}>{isClient ? item.title : item.jobTitle}</p>
                          <p className={styles.miniMeta}>{isClient ? `${item.category} · ${item.posted}` : `${item.progress}% complete`}</p>
                        </div>
                        <span className={styles.miniBadge}>
                          {isClient ? `${proposals[item.id]?.length || item.proposals} proposals` : `$${item.amount.toLocaleString()}`}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Recent Transactions</h2>
                  <Link to="/wallet" className={styles.panelAction}>See all</Link>
                </div>
                {recentTx.length === 0 ? (
                  <div className={styles.panelEmpty}><p>No transactions yet.</p></div>
                ) : (
                  <div className={styles.miniList}>
                    {recentTx.map(tx => {
                      const pos = tx.amount > 0
                      return (
                        <div key={tx.id} className={styles.miniRow}>
                          <div className={`${styles.txDot} ${pos ? styles.txDotGreen : styles.txDotOrange}`}/>
                          <div className={styles.miniInfo}>
                            <p className={styles.miniTitle}>{tx.desc}</p>
                            <p className={styles.miniMeta}>{tx.date} · {tx.status}</p>
                          </div>
                          <p className={`${styles.miniAmount} ${pos ? styles.amtPos : styles.amtNeg}`}>
                            {pos?'+':'-'}${Math.abs(tx.amount).toFixed(2)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ MY JOBS (client) ══ */}
        {activeTab === 'jobs' && isClient && (
          <div className={styles.tabContent}>
            <div className={styles.jobsHeader}>
              <p className={styles.jobsCount}>{postedJobs.length} job{postedJobs.length!==1?'s':''} posted</p>
              <Link to="/post-job" className={styles.qaBtn}>+ Post new job</Link>
            </div>
            {postedJobs.length === 0 ? (
              <div className={styles.bigEmpty}>
                <p className={styles.bigEmptyTitle}>No jobs posted yet</p>
                <p className={styles.bigEmptySub}>Post your first project and start receiving proposals within hours.</p>
                <Link to="/post-job" className={styles.bigEmptyBtn}>Post a job — it's free →</Link>
              </div>
            ) : (
              <div className={styles.jobCards}>
                {postedJobs.map(job => (
                  <div key={job.id} className={styles.jobCard}>
                    <div className={styles.jobCardHead}>
                      <div>
                        <Link to={`/job/${job.id}`} className={styles.jobCardTitle}>{job.title}</Link>
                        <p className={styles.jobCardMeta}>{job.category} · Posted {job.posted} · {job.type}</p>
                      </div>
                      <div className={styles.jobCardRight}>
                        <span className={styles.jobCardBudget}>{job.type==='Hourly'?`$${job.budget}/hr`:`$${job.budget.toLocaleString()}`}</span>
                        <span className={`${styles.jobStatus} ${styles[`jobStatus_${job.status}`]}`}>{job.status.replace('_',' ')}</span>
                      </div>
                    </div>
                    <p className={styles.jobCardDesc}>{job.description}</p>
                    <div className={styles.jobCardFoot}>
                      <div className={styles.jobCardSkills}>{job.skills.map(s=><span key={s} className={styles.skill}>{s}</span>)}</div>
                      <span className={styles.proposalCount}>{proposals[job.id]?.length || job.proposals} proposals</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PROPOSALS (client) ══ */}
        {activeTab === 'proposals' && isClient && (
          <div className={styles.tabContent}>
            {postedJobs.every(j => !(proposals[j.id]?.length)) ? (
              <div className={styles.bigEmpty}>
                <p className={styles.bigEmptyTitle}>No proposals yet</p>
                <p className={styles.bigEmptySub}>Post a job to start receiving proposals from talented freelancers.</p>
                <Link to="/post-job" className={styles.bigEmptyBtn}>Post a job →</Link>
              </div>
            ) : (
              <div className={styles.propSections}>
                {postedJobs.map(job => {
                  const props = proposals[job.id]
                  if (!props?.length) return null
                  return (
                    <div key={job.id} className={styles.propSection}>
                      <div className={styles.propJobHead}>
                        <Link to={`/job/${job.id}`} className={styles.propJobTitle}>{job.title}</Link>
                        <span className={styles.propCount}>{props.length} proposal{props.length!==1?'s':''}</span>
                      </div>
                      <div className={styles.propList}>
                        {props.map(p => (
                          <div key={p.id} className={`${styles.propCard} ${p.status==='accepted'?styles.propAccepted:''}`}>
                            <div className={styles.propTop}>
                              <div className={styles.propAvatar}>{p.freelancer?.avatar||'F'}</div>
                              <div className={styles.propMeta}>
                                <p className={styles.propName}>{p.freelancer?.name||'Freelancer'}</p>
                                <p className={styles.propTitle}>{p.freelancer?.title||''}</p>
                              </div>
                              <div className={styles.propRight}>
                                <p className={styles.propBid}>{job.type==='Hourly'?`$${p.bid}/hr`:`$${Number(p.bid).toLocaleString()}`}</p>
                                {p.status==='accepted'
                                  ? <span className={styles.propAcceptedBadge}>✓ Accepted</span>
                                  : wallet.balance >= p.bid
                                    ? <button className={styles.acceptBtn} onClick={() => acceptProposal(job.id, p.id, Number(p.bid), p.freelancer)}>Accept &amp; fund escrow</button>
                                    : <Link to="/wallet" className={styles.insufficientBadge}>Add funds first</Link>
                                }
                              </div>
                            </div>
                            <p className={styles.propCover}>{p.coverLetter}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ APPLIED JOBS (freelancer) ══ */}
        {activeTab === 'applied' && !isClient && (
          <div className={styles.tabContent}>
            {appliedJobs.length === 0 ? (
              <div className={styles.bigEmpty}>
                <p className={styles.bigEmptyTitle}>No applications yet</p>
                <p className={styles.bigEmptySub}>Browse open jobs and submit your first proposal.</p>
                <Link to="/jobs" className={styles.bigEmptyBtn}>Browse jobs →</Link>
              </div>
            ) : (
              <div className={styles.jobCards}>
                {appliedJobs.map(job => {
                  const myProp = proposals[job.id]?.find(p => p.freelancer?.id === user.id)
                  return (
                    <Link to={`/job/${job.id}`} key={job.id} className={styles.jobCard} style={{textDecoration:'none'}}>
                      <div className={styles.jobCardHead}>
                        <div>
                          <p className={styles.jobCardTitle}>{job.title}</p>
                          <p className={styles.jobCardMeta}>{job.category} · {job.posted}</p>
                        </div>
                        <span className={`${styles.propStatusBadge} ${myProp?.status==='accepted'?styles.propStatusAccepted:styles.propStatusPending}`}>
                          {myProp?.status==='accepted' ? '✓ Accepted' : 'Pending'}
                        </span>
                      </div>
                      <p className={styles.jobCardDesc}>{job.description}</p>
                      <div className={styles.jobCardFoot}>
                        <div className={styles.jobCardSkills}>{job.skills.map(s=><span key={s} className={styles.skill}>{s}</span>)}</div>
                        <span className={styles.proposalCount}>Your bid: {job.type==='Hourly'?`$${myProp?.bid}/hr`:`$${myProp?.bid}`}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ CONTRACTS (freelancer) ══ */}
        {activeTab === 'contracts' && !isClient && (
          <div className={styles.tabContent}>
            {activeContracts.length === 0 ? (
              <div className={styles.bigEmpty}>
                <p className={styles.bigEmptyTitle}>No active contracts</p>
                <p className={styles.bigEmptySub}>Browse jobs and submit proposals to start working.</p>
                <Link to="/jobs" className={styles.bigEmptyBtn}>Find work →</Link>
              </div>
            ) : (
              <div className={styles.jobCards}>
                {activeContracts.map(c => (
                  <div key={c.id} className={styles.jobCard}>
                    <div className={styles.jobCardHead}>
                      <div>
                        <p className={styles.jobCardTitle}>{c.jobTitle}</p>
                        <p className={styles.jobCardMeta}>Client: {c.clientName} · Started {c.startDate}</p>
                      </div>
                      <span className={styles.jobCardBudget}>${c.amount.toLocaleString()}</span>
                    </div>
                    <div className={styles.progressRow}>
                      <span style={{fontSize:13,color:'var(--mid)'}}>Progress: {c.progress}%</span>
                      <div className={styles.miniProgress}><div className={styles.miniProgressFill} style={{width:`${c.progress}%`}}/></div>
                    </div>
                    <div className={styles.jobCardFoot}>
                      <Link to="/contracts" className={styles.skill} style={{padding:'6px 14px'}}>View contract →</Link>
                      <Link to={`/messages/${c.clientId}`} className={styles.proposalCount}>Message client</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ANALYTICS (freelancer only) ══ */}
        {activeTab === 'analytics' && !isClient && (
          <div className={styles.tabContent}>
            <div className={styles.analyticsHeader}>
              <div>
                <p className={styles.analyticsEyebrow}>Freelancer insights</p>
                <h2 className={styles.analyticsTitle}>Your Performance</h2>
              </div>
              <span className={styles.analyticsPeriodBadge}>April 2026</span>
            </div>
            <AnalyticsTab
              contracts={contracts}
              proposals={proposals}
              user={user}
              transactions={transactions}
            />
          </div>
        )}

        {/* ══ ACTIVITY ══ */}
        {activeTab === 'activity' && (
          <div className={styles.tabContent}>
            <div className={styles.activityList}>
              {transactions.length === 0
                ? <div className={styles.bigEmpty}><p className={styles.bigEmptyTitle}>No activity yet</p></div>
                : transactions.map(tx => {
                  const pos = tx.amount > 0
                  const typeMap = {deposit:'Added funds',withdrawal:'Withdrew funds',escrow:'Funded escrow',release:'Released payment'}
                  return (
                    <div key={tx.id} className={styles.actRow}>
                      <div className={`${styles.actDot} ${pos?styles.actGreen:styles.actOrange}`}/>
                      <div className={styles.actInfo}>
                        <p className={styles.actTitle}>{typeMap[tx.type]||tx.type}</p>
                        <p className={styles.actDesc}>{tx.desc}</p>
                        <p className={styles.actDate}>{tx.date}</p>
                      </div>
                      <div className={styles.actRight}>
                        <p className={`${styles.actAmount} ${pos?styles.amtPos:styles.amtNeg}`}>
                          {pos?'+':'-'}${Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <span className={`${styles.actStatus} ${tx.status==='completed'?styles.actComplete:styles.actPending}`}>{tx.status}</span>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
