import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TrustBadge from '../components/TrustBadge'
import styles from './FreelancerProfile.module.css'

function ReviewCard({ review, fromName }) {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewTop}>
        <div className={styles.reviewAvatar}>{fromName?.[0] || '?'}</div>
        <div>
          <p className={styles.reviewName}>{fromName || 'Client'}</p>
          <div className={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
        </div>
        <p className={styles.reviewDate}>{review.date}</p>
      </div>
      <p className={styles.reviewComment}>{review.comment}</p>
    </div>
  )
}

export default function FreelancerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { freelancers, savedFreelancers, toggleSaveFreelancer, reviews, user } = useApp()
  const f = freelancers.find(x => x.id === id)
  const [activeTab, setActiveTab] = useState('about')

  if (!f) return (
    <div className={styles.notFound}>
      <p>Freelancer not found.</p>
      <Link to="/browse" className={styles.back}>← Back to talent</Link>
    </div>
  )

  const isSaved = savedFreelancers.includes(f.id)
  const freelancerReviews = reviews.filter(r => r.toId === f.id)

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.topBar}>
          <Link to="/browse" className={styles.backLink}>← Back to talent</Link>
          <button
            className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
            onClick={() => toggleSaveFreelancer(f.id)}
          >
            {isSaved ? '♥ Saved' : '♡ Save'}
          </button>
        </div>

        <div className={styles.layout}>
          {/* ── Main ── */}
          <div className={styles.main}>
            {/* Hero card */}
            <div className={styles.heroCard}>
              <div className={styles.profileHead}>
                <div className={styles.avatar}>{f.avatar}</div>
                <div className={styles.profileMeta}>
                  <h1 className={styles.name}>{f.name}</h1>
                  <p className={styles.jobTitle}>{f.title}</p>
                  <p className={styles.location}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {f.location}
                  </p>
                  <div className={styles.ratingRow}>
                    <span className={styles.stars}>{'★'.repeat(Math.floor(f.rating))}{'☆'.repeat(5 - Math.floor(f.rating))}</span>
                    <span className={styles.ratingVal}>{f.rating.toFixed(1)}</span>
                    <span className={styles.reviewCount}>({f.reviews} reviews)</span>
                    <span className={styles.dividerDot}>·</span>
                    <span className={styles.jobsDone}>{f.completedJobs} jobs</span>
                  </div>
                  <div className={styles.trustBadgeWrap}>
                    <TrustBadge user={f} />
                  </div>
                </div>
                <div className={styles.rateBlock}>
                  <p className={styles.rate}>₦{f.rate}<span>/hr</span></p>
                  <p className={styles.rateLabel}>Hourly rate</p>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabs}>
                {[['about','About'],['skills','Skills'],['reviews',`Reviews (${freelancerReviews.length})`]].map(([v,l]) => (
                  <button key={v} className={`${styles.tab} ${activeTab===v?styles.tabActive:''}`} onClick={() => setActiveTab(v)}>{l}</button>
                ))}
              </div>

              {activeTab === 'about' && (
                <div className={styles.tabContent}>
                  <h2 className={styles.sectionTitle}>About {f.name.split(' ')[0]}</h2>
                  <p className={styles.bio}>{f.bio}</p>
                  <div className={styles.statsRow}>
                    {[
                      ['Member rating', `${f.rating}/5.0`],
                      ['Jobs completed', f.completedJobs],
                      ['Total reviews', f.reviews],
                      ['Based in', f.location],
                    ].map(([k, v]) => (
                      <div key={k} className={styles.statBlock}>
                        <span className={styles.statBlockVal}>{v}</span>
                        <span className={styles.statBlockKey}>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className={styles.tabContent}>
                  <h2 className={styles.sectionTitle}>Skills & expertise</h2>
                  <div className={styles.skills}>
                    {f.skills.map(s => <span key={s} className={styles.skill}>{s}</span>)}
                  </div>
                  <p className={styles.categoryLabel}>Primary category: <strong>{f.category}</strong></p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className={styles.tabContent}>
                  {freelancerReviews.length === 0 ? (
                    <p className={styles.noReviews}>No reviews yet — be the first to work with {f.name.split(' ')[0]}!</p>
                  ) : (
                    <div className={styles.reviewList}>
                      {freelancerReviews.map(r => (
                        <ReviewCard key={r.id} review={r} fromName={user.name} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.sideCard}>
              <p className={styles.sideRate}>₦{f.rate}<span>/hr</span></p>
              <div className={styles.sideStats}>
                {[
                  ['Rating', `${f.rating} ★`],
                  ['Reviews', f.reviews],
                  ['Jobs done', f.completedJobs],
                  ['Category', f.category],
                ].map(([k, v]) => (
                  <div key={k} className={styles.sideStatRow}>
                    <span className={styles.sideStatKey}>{k}</span>
                    <span className={styles.sideStatVal}>{v}</span>
                  </div>
                ))}
              </div>
              <div className={styles.sideActions}>
                <Link to="/post-job" className={styles.hireBtn}>
                  Hire {f.name.split(' ')[0]} →
                </Link>
                <Link to={`/messages/${f.id}`} className={styles.msgBtn}>
                  Send message
                </Link>
              </div>
            </div>

            <div className={styles.similarCard}>
              <p className={styles.similarTitle}>Similar talent</p>
              {freelancers.filter(x => x.id !== f.id && x.category === f.category).slice(0, 3).map(sim => (
                <Link key={sim.id} to={`/freelancer/${sim.id}`} className={styles.simRow}>
                  <div className={styles.simAvatar}>{sim.avatar}</div>
                  <div className={styles.simInfo}>
                    <p className={styles.simName}>{sim.name}</p>
                    <p className={styles.simTitle}>{sim.title}</p>
                  </div>
                  <span className={styles.simRate}>₦{sim.rate}/hr</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
