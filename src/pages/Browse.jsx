import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDebounce } from '../hooks/useDebounce'
import { FreelancerGridSkeleton } from '../components/SkeletonLoader'
import styles from './Browse.module.css'

const CATS = [
  'All', 'AI Services', 'Development & IT', 'Design & Creative',
  'Sales & Marketing', 'Writing & Translation', 'Finance & Accounting',
  'Engineering & Architecture', 'Legal', 'HR & Training',
  'Academic Support', 'Photography',
]

function StarRating({ rating }) {
  const full = Math.floor(rating)
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

export default function Browse() {
  const { freelancers, savedFreelancers, toggleSaveFreelancer, isLoggedIn, isLoading } = useApp()
  const [params]  = useSearchParams()
  const [search,  setSearch]  = useState(params.get('q') || '')
  const [cat,     setCat]     = useState('All')
  const [sortBy,  setSortBy]  = useState('rating')

  const debouncedSearch = useDebounce(search, 300)

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
    // Fix: filter by the freelancer's actual category field, not keyword guessing
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

  const hasFilter = search || cat !== 'All' || sortBy !== 'rating'

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.title}>Browse <em>Talent</em></h1>
          <p className={styles.subtitle}>{freelancers.length.toLocaleString()} vetted professionals ready to work</p>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className={styles.searchInput} placeholder="Search by skill, title, or name…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search freelancers" />
              {search && <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">✕</button>}
            </div>
            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="rating">Top Rated</option>
              <option value="rate_low">Rate: Low → High</option>
              <option value="rate_high">Rate: High → Low</option>
              <option value="jobs">Most Jobs Done</option>
            </select>
          </div>
          <div className={styles.catScroll} role="group" aria-label="Filter by category">
            {CATS.map(c => (
              <button key={c} className={`${styles.catChip} ${cat === c ? styles.catActive : ''}`} onClick={() => setCat(c)} aria-pressed={cat === c}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.results}>
          <div className={styles.resultsMeta}>
            <p className={styles.resultCount}>{isLoading ? 'Loading…' : `${filtered.length} freelancer${filtered.length !== 1 ? 's' : ''} found`}</p>
            {hasFilter && <button className={styles.clearFiltersBtn} onClick={() => { setSearch(''); setCat('All'); setSortBy('rating') }}>Clear filters ✕</button>}
          </div>

          {isLoading ? <FreelancerGridSkeleton count={6} /> : (
            <div className={styles.grid}>
              {filtered.map(f => {
                const isSaved = savedFreelancers.includes(f.id)
                return (
                  <Link to={`/freelancer/${f.id}`} key={f.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardAvatar} aria-hidden="true">{f.avatar}</div>
                      <div className={styles.cardMeta}>
                        <h3 className={styles.cardName}>{f.name}</h3>
                        <p className={styles.cardTitle}>{f.title}</p>
                        <p className={styles.cardLocation}>{f.location}</p>
                      </div>
                      <div className={styles.cardTopRight}>
                        <div className={styles.cardRate}>₦{f.rate}<span>/hr</span></div>
                        {isLoggedIn && (
                          <button className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`} onClick={e => handleSave(e, f.id)} aria-label={isSaved ? `Unsave ${f.name}` : `Save ${f.name}`} aria-pressed={isSaved}>
                            {isSaved ? '♥' : '♡'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.cardBio}>{f.bio}</p>
                    <div className={styles.cardSkills}>{(f.skills || []).slice(0, 4).map(s => <span key={s} className={styles.skill}>{s}</span>)}</div>
                    <div className={styles.cardFooter}>
                      <StarRating rating={f.rating || 0} />
                      <span className={styles.reviewCount}>{f.reviews} reviews</span>
                      <span className={styles.completedJobs}>{f.completedJobs} jobs done</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🔍</p>
              <p className={styles.emptyTitle}>No results found</p>
              <p className={styles.emptyBody}>Try adjusting your search or selecting a different category</p>
              <button className={styles.emptyReset} onClick={() => { setSearch(''); setCat('All') }}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
