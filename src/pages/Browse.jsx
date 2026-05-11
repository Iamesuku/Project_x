import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDebounce } from '../hooks/useDebounce'
import { useScrollReveal, use3DTilt } from '../hooks/useScrollReveal'
import { FreelancerGridSkeleton } from '../components/SkeletonLoader'
import styles from './Browse.module.css'

const CATS = [
  'All','AI Services','Development & IT','Design & Creative',
  'Sales & Marketing','Writing & Translation','Finance & Accounting',
  'Engineering & Architecture','Legal','HR & Training','Academic Support','Photography',
]

const CAT_ICONS = {
  'All': '⊞',
  'AI Services': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M17 14v6M14 17h6"/></svg>,
  'Development & IT': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  'Design & Creative': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41"/></svg>,
  'Finance & Accounting': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  'Writing & Translation': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
}

/* Deterministic avatar colour from name */
const AVATAR_HUES = [245, 173, 45, 8, 153, 276]
function avatarHue(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_HUES[h % AVATAR_HUES.length]
}
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

/* SVG Star component with half-star support */
function StarRating({ rating }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {stars.map(s => {
        const fill = rating >= s ? 1 : rating >= s - 0.5 ? 0.5 : 0
        return (
          <svg key={s} width="12" height="12" viewBox="0 0 24 24" className={styles.star}>
            <defs>
              <linearGradient id={`star-${s}-${Math.round(rating * 10)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor"/>
                <stop offset={`${fill * 100}%`} stopColor="transparent"/>
              </linearGradient>
            </defs>
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill={`url(#star-${s}-${Math.round(rating * 10)})`}
              stroke="currentColor" strokeWidth="1.5"
            />
          </svg>
        )
      })}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

/* Tilt freelancer card */
function FreelancerCard({ f, isSaved, onSave, isLoggedIn, delay }) {
  const tiltRef = use3DTilt(8)
  const hue = avatarHue(f.name)

  return (
    <div className={styles.cardWrapper} style={{ animationDelay: `${delay}s` }}>
      <Link to={`/freelancer/${f.id}`} className={styles.card} ref={tiltRef}>
        {/* Top accent line — hue-matched to avatar */}
        <div className={styles.cardAccent} style={{ background: `hsl(${hue} 65% 55%)` }} />

        <div className={styles.cardTop}>
          {/* Initials avatar */}
          <div
            className={styles.cardAvatar}
            style={{ background: `hsl(${hue} 65% 55%)` }}
            aria-hidden="true"
          >
            {initials(f.name)}
          </div>
          <div className={styles.cardMeta}>
            <h3 className={styles.cardName}>{f.name}</h3>
            <p className={styles.cardTitle}>{f.title}</p>
            <p className={styles.cardLocation}>{f.location}</p>
          </div>
          <div className={styles.cardTopRight}>
            <div className={styles.cardRate}>
              ₦{(f.rate || 0).toLocaleString()}<span>/hr</span>
            </div>
            {isLoggedIn && (
              <button
                className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
                onClick={onSave}
                aria-label={isSaved ? `Unsave ${f.name}` : `Save ${f.name}`}
                aria-pressed={isSaved}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <p className={styles.cardBio}>{f.bio}</p>

        <div className={styles.cardSkills}>
          {(f.skills || []).slice(0, 4).map(s => (
            <span key={s} className={styles.skill}>{s}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <StarRating rating={f.rating || 0} />
          <span className={styles.reviewCount}>{f.reviews} reviews</span>
          <span className={styles.completedJobs}>{f.completedJobs} jobs</span>
        </div>

        {/* Slide-up CTA on hover */}
        <div className={styles.cardCta}>
          View profile
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </Link>
    </div>
  )
}

/* SVG Empty state illustration */
function EmptyState({ onReset }) {
  return (
    <div className={styles.empty} role="status" aria-live="polite">
      <svg className={styles.emptyIllustration} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="100" cy="72" r="48" stroke="var(--nexus-border)" strokeWidth="2"/>
        <circle cx="100" cy="72" r="32" stroke="var(--nexus-border)" strokeWidth="1.5" strokeDasharray="4 4"/>
        <path d="M136 108 L156 128" stroke="var(--nexus-mid)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="158" cy="130" r="8" stroke="var(--nexus-mid)" strokeWidth="2" fill="none"/>
        <path d="M88 68 L96 76 L112 60" stroke="var(--nexus-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <path d="M76 52 Q100 36 124 52" stroke="var(--nexus-border)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="60" cy="40" r="4" fill="var(--nexus-border)"/>
        <circle cx="140" cy="40" r="4" fill="var(--nexus-border)"/>
        <circle cx="60" cy="104" r="4" fill="var(--nexus-border)"/>
        <circle cx="140" cy="104" r="4" fill="var(--nexus-border)"/>
      </svg>
      <h3 className={styles.emptyTitle}>Looks like no one here matches. Yet.</h3>
      <p className={styles.emptyBody}>Try adjusting your search or clearing your filters to discover more talent.</p>
      <button className={styles.emptyReset} onClick={onReset}>Clear all filters</button>
    </div>
  )
}

export default function Browse() {
  const { freelancers, savedFreelancers, toggleSaveFreelancer, isLoggedIn, isLoading } = useApp()
  const [params]  = useSearchParams()
  const [search,  setSearch]  = useState(params.get('q') || '')
  const [cat,     setCat]     = useState(() => {
    const c = params.get('cat')
    return c && CATS.includes(c) ? c : 'All'
  })
  const [sortBy,  setSortBy]  = useState('rating')
  const debouncedSearch = useDebounce(search, 300)

  const [headerRef, headerVis] = useScrollReveal(0.1)

  const filtered = useMemo(() => {
    let list = [...freelancers]
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        (f.skills || []).some(s => s.toLowerCase().includes(q))
      )
    }
    if (cat !== 'All') list = list.filter(f => f.category === cat)
    if (sortBy === 'rating')    list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'rate_low')  list.sort((a, b) => (a.rate || 0) - (b.rate || 0))
    if (sortBy === 'rate_high') list.sort((a, b) => (b.rate || 0) - (a.rate || 0))
    if (sortBy === 'jobs')      list.sort((a, b) => (b.completedJobs || 0) - (a.completedJobs || 0))
    return list
  }, [freelancers, debouncedSearch, cat, sortBy])

  function handleSave(e, fId) {
    e.preventDefault(); e.stopPropagation()
    if (!isLoggedIn) return
    toggleSaveFreelancer(fId)
  }

  function clearAll() { setSearch(''); setCat('All'); setSortBy('rating') }
  const hasFilter = search || cat !== 'All' || sortBy !== 'rating'

  return (
    <div className={styles.page}>
      {/* Hero header */}
      <header className={styles.pageHeader} ref={headerRef}>
        <div className={styles.headerMesh} aria-hidden="true" />
        <div className="container">
          <p
            className={styles.eyebrow}
            style={{ opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease 0.1s, transform 0.5s var(--ease-out) 0.1s' }}
          >Browse Talent</p>
          <h1
            className={styles.title}
            style={{ opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.5s ease 0.2s, transform 0.5s var(--ease-out) 0.2s' }}
          >
            Find the perfect<br /><em>expert for your project.</em>
          </h1>
          <p
            className={styles.subtitle}
            style={{ opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease 0.3s, transform 0.5s var(--ease-out) 0.3s' }}
          >
            {freelancers.length.toLocaleString()} vetted campus professionals ready to work
          </p>

          {/* Pill search bar */}
          <div
            className={styles.searchRow}
            style={{ opacity: headerVis ? 1 : 0, transform: headerVis ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease 0.4s, transform 0.5s var(--ease-out) 0.4s' }}
          >
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className={styles.searchInput}
                placeholder="Search by skill, title, or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search freelancers"
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              <span className={styles.searchKbd} aria-hidden="true">⌘K</span>
            </div>
            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="rating">Top Rated</option>
              <option value="rate_low">Rate: Low → High</option>
              <option value="rate_high">Rate: High → Low</option>
              <option value="jobs">Most Jobs Done</option>
            </select>
          </div>

          {/* Scrollable category chips */}
          <div className={styles.catScrollWrap}>
            <div className={styles.catScroll} role="group" aria-label="Filter by category">
              {CATS.map(c => (
                <button
                  key={c}
                  className={`${styles.catChip} ${cat === c ? styles.catActive : ''}`}
                  onClick={() => setCat(c)}
                  aria-pressed={cat === c}
                >
                  {CAT_ICONS[c] && <span className={styles.catChipIcon}>{CAT_ICONS[c]}</span>}
                  {c}
                </button>
              ))}
            </div>
            <div className={styles.catFadeMask} aria-hidden="true" />
          </div>
        </div>
      </header>

      <main id="main-content">
        <div className="container">
          <div className={styles.results}>
            <div className={styles.resultsMeta}>
              <p className={styles.resultCount}>
                {isLoading ? 'Loading…' : `${filtered.length} freelancer${filtered.length !== 1 ? 's' : ''} found`}
              </p>
              {hasFilter && (
                <button className={styles.clearFiltersBtn} onClick={clearAll}>
                  Clear filters ✕
                </button>
              )}
            </div>

            {isLoading ? (
              <FreelancerGridSkeleton count={6} />
            ) : filtered.length === 0 ? (
              <EmptyState onReset={clearAll} />
            ) : (
              <div className={styles.grid}>
                {filtered.map((f, i) => (
                  <FreelancerCard
                    key={f.id}
                    f={f}
                    isSaved={savedFreelancers.includes(f.id)}
                    onSave={e => handleSave(e, f.id)}
                    isLoggedIn={isLoggedIn}
                    delay={Math.min(i * 0.05, 0.4)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
