import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Dashboard.module.css'

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
    : [['overview','Overview'],['applied','Applied Jobs'],['contracts','Active Work'],['activity','Activity']]

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
            <button key={v} className={`${styles.tab} ${activeTab===v?styles.tabActive:''}`} onClick={() => setActiveTab(v)}>{l}</button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div className={styles.tabContent}>
            <div className={styles.kpiRow}>
              {isClient ? [
                { label:'Wallet Balance',  value:`$${wallet.balance.toFixed(2)}`, sub:'Available',      link:'/wallet' },
                { label:'In Escrow',       value:`$${wallet.escrow.toFixed(2)}`,  sub:'Protected',      link:'/wallet', accent: wallet.escrow > 0 },
                { label:'Active Contracts',value: activeContracts.length,         sub:'In progress',    link:'/contracts' },
                { label:'Jobs Posted',     value: postedJobs.length,              sub:'All time',       link:null },
                { label:'Proposals In',    value: totalProposals,                 sub:'Total received', link:null },
              ] : [
                { label:'Wallet Balance',  value:`$${wallet.balance.toFixed(2)}`, sub:'Available',   link:'/wallet' },
                { label:'Total Earned',    value:`$${wallet.earned.toFixed(2)}`,  sub:'Lifetime',    link:'/wallet' },
                { label:'Active Contracts',value: activeContracts.length,         sub:'In progress', link:'/contracts' },
                { label:'Jobs Applied',    value: appliedJobs.length,             sub:'All time',    link:null },
              ].map(k => (
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
                                    ? <button className={styles.acceptBtn} onClick={() => acceptProposal(job.id, p.id, Number(p.bid), p.freelancer)}>Accept & fund escrow</button>
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
