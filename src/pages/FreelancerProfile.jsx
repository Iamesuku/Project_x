import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TrustBadge from '../components/TrustBadge'
import styles from './FreelancerProfile.module.css'

/* ── Mock reviews keyed by freelancer id pattern ── */
const MOCK_REVIEWS_POOL = [
  {
    id: 'r1',
    fromName: 'Chidera Okafor',
    fromInitial: 'C',
    rating: 5,
    date: '12 Apr 2026',
    comment:
      'Absolutely outstanding work! Delivered the React dashboard ahead of schedule and the code quality was impeccable. Will definitely hire again for future projects.',
  },
  {
    id: 'r2',
    fromName: 'Amara Nwosu',
    fromInitial: 'A',
    rating: 5,
    date: '28 Mar 2026',
    comment:
      'Very professional and communicative throughout the project. The final product exceeded my expectations — responsive, fast, and clean. A true gem on NEXUS.',
  },
  {
    id: 'r3',
    fromName: 'Emeka Balogun',
    fromInitial: 'E',
    rating: 4,
    date: '14 Mar 2026',
    comment:
      'Great work overall. There were minor revisions after delivery but they were handled quickly and without complaint. Would recommend to anyone looking for solid technical skills.',
  },
  {
    id: 'r4',
    fromName: 'Zara Mahmoud',
    fromInitial: 'Z',
    rating: 5,
    date: '02 Mar 2026',
    comment:
      'This freelancer truly understands the brief. Got exactly what I envisioned on the first draft. Excellent communication and very fair pricing for the quality delivered.',
  },
  {
    id: 'r5',
    fromName: 'Tunde Adeyemi',
    fromInitial: 'T',
    rating: 4,
    date: '19 Feb 2026',
    comment:
      'Solid developer with a good eye for design. The project took a little longer than initially scoped but the end result was worth it. Happy to work together again.',
  },
  {
    id: 'r6',
    fromName: 'Nkechi Eze',
    fromInitial: 'N',
    rating: 5,
    date: '05 Feb 2026',
    comment:
      'From brief to delivery was seamless. Brilliant attention to detail and the UI polish was next level. My clients were very impressed with the final output.',
  },
]

/* ── Deterministically pick 4–5 reviews per freelancer ── */
function getMockReviews(freelancerId) {
  // Use last char of id to vary which reviews show
  const seed = freelancerId ? freelancerId.charCodeAt(freelancerId.length - 1) % 2 : 0
  return seed === 0
    ? MOCK_REVIEWS_POOL.slice(0, 4)
    : MOCK_REVIEWS_POOL.slice(1, 6)
}

/* ── Star renderer (filled + empty) ── */
function Stars({ rating, size = 14 }) {
  return (
    <span className={styles.starRow} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? styles.starFilled : styles.starEmpty}>
          ★
        </span>
      ))}
    </span>
  )
}

/* ── Single review card ── */
function ReviewCard({ review, delay = 0 }) {
  return (
    <div className={styles.reviewCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.reviewTop}>
        <div className={styles.reviewAvatar} data-initial={review.fromInitial}>
          {review.fromInitial}
        </div>
        <div className={styles.reviewMeta}>
          <p className={styles.reviewName}>{review.fromName}</p>
          <Stars rating={review.rating} size={13} />
        </div>
        <p className={styles.reviewDate}>{review.date}</p>
      </div>
      <p className={styles.reviewComment}>"{review.comment}"</p>
    </div>
  )
}

/* ── Rating summary + bar chart ── */
function RatingSummary({ reviews, freelancer }) {
  const totalReviews = freelancer.reviews
  const avgRating = freelancer.rating

  // Build distribution from mock reviews + fill remainder proportionally
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => dist[r.rating]++)

  // Scale up to totalReviews count proportionally
  const mockTotal = reviews.length
  const scale = totalReviews / mockTotal
  const scaledDist = {}
  let remaining = totalReviews
  ;[5, 4, 3, 2, 1].forEach((star, i, arr) => {
    if (i < arr.length - 1) {
      scaledDist[star] = Math.round(dist[star] * scale)
      remaining -= scaledDist[star]
    } else {
      scaledDist[star] = Math.max(0, remaining)
    }
  })

  return (
    <div className={styles.ratingSummary}>
      {/* Left: big number */}
      <div className={styles.ratingBig}>
        <span className={styles.ratingBigNum}>{avgRating.toFixed(1)}</span>
        <Stars rating={Math.round(avgRating)} size={20} />
        <p className={styles.ratingBigLabel}>
          {totalReviews} reviews total
        </p>
      </div>

      {/* Right: bar chart */}
      <div className={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = scaledDist[star] || 0
          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
          return (
            <div key={star} className={styles.barRow}>
              <span className={styles.barLabel}>{star} ★</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${pct}%` }}
                  data-star={star}
                />
              </div>
              <span className={styles.barCount}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function FreelancerProfile() {
  const { id } = useParams()
  const { freelancers, savedFreelancers, toggleSaveFreelancer, reviews, user } = useApp()
  const f = freelancers.find((x) => x.id === id)
  const [activeTab, setActiveTab] = useState('about')

  if (!f)
    return (
      <div className={styles.notFound}>
        <p>Freelancer not found.</p>
        <Link to="/browse" className={styles.back}>
          ← Back to talent
        </Link>
      </div>
    )

  const isSaved = savedFreelancers.includes(f.id)

  // Merge real reviews (from context) with mock reviews, deduplicated by id
  const realReviews = reviews.filter((r) => r.toId === f.id)
  const mockReviews = getMockReviews(f.id)
  const allReviews = [
    ...realReviews,
    ...mockReviews.filter((m) => !realReviews.some((r) => r.id === m.id)),
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.topBar}>
          <Link to="/browse" className={styles.backLink}>
            ← Back to talent
          </Link>
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {f.location}
                  </p>
                  <div className={styles.ratingRow}>
                    <span className={styles.stars}>
                      {'★'.repeat(Math.floor(f.rating))}{'☆'.repeat(5 - Math.floor(f.rating))}
                    </span>
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
                {[
                  ['about', 'About'],
                  ['skills', 'Skills'],
                  ['reviews', `Reviews (${f.reviews})`],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={`${styles.tab} ${activeTab === v ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* ── About tab ── */}
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

              {/* ── Skills tab ── */}
              {activeTab === 'skills' && (
                <div className={styles.tabContent}>
                  <h2 className={styles.sectionTitle}>Skills &amp; expertise</h2>
                  <div className={styles.skills}>
                    {f.skills.map((s) => (
                      <span key={s} className={styles.skill}>{s}</span>
                    ))}
                  </div>
                  <p className={styles.categoryLabel}>
                    Primary category: <strong>{f.category}</strong>
                  </p>
                </div>
              )}

              {/* ── Reviews tab ── */}
              {activeTab === 'reviews' && (
                <div className={styles.tabContent}>
                  {/* Overall rating summary */}
                  <RatingSummary reviews={allReviews} freelancer={f} />

                  <div className={styles.reviewsDivider} />

                  <h2 className={styles.sectionTitle}>
                    What clients are saying
                  </h2>

                  <div className={styles.reviewList}>
                    {allReviews.map((r, i) => (
                      <ReviewCard key={r.id} review={r} delay={i * 60} />
                    ))}
                  </div>

                  {/* Trust signal footer */}
                  <div className={styles.trustFooter}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    All reviews are verified by NEXUS and linked to completed contracts.
                  </div>
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
              {freelancers
                .filter((x) => x.id !== f.id && x.category === f.category)
                .slice(0, 3)
                .map((sim) => (
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
