import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDebounce } from '../hooks/useDebounce'
import { JobListSkeleton } from '../components/SkeletonLoader'
import styles from './Jobs.module.css'

const CATS = [
  'All', 'Development & IT', 'Design & Creative', 'Writing & Translation',
  'Finance & Accounting', 'Sales & Marketing', 'Engineering & Architecture',
  'Legal', 'HR & Training', 'Academic Support', 'Photography',
]

export default function Jobs() {
  const { jobs, savedJobs, toggleSaveJob, isLoggedIn, isLoading } = useApp()
  const [params]  = useSearchParams()
  const [search,  setSearch] = useState(params.get('q') || '')
  const [cat,     setCat]    = useState(params.get('cat') || 'All')
  const [type,    setType]   = useState('All')

  // Debounce search — only recalculates 300ms after typing stops
  const debouncedSearch = useDebounce(search, 300)

  const openJobs = useMemo(() => jobs.filter(j => j.status !== 'closed'), [jobs])

  const filtered = useMemo(() => {
    let list = openJobs
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.skills || []).some(s => s.toLowerCase().includes(q))
      )
    }
    if (cat !== 'All')  list = list.filter(j => j.category === cat)
    if (type !== 'All') list = list.filter(j => j.type === type)
    return list
  }, [openJobs, debouncedSearch, cat, type])

  function handleSave(e, jobId) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) return
    toggleSaveJob(jobId)
  }

  function clearFilters() {
    setSearch(''); setCat('All'); setType('All')
  }

  const hasFilter = search || cat !== 'All' || type !== 'All'

  return (
    <div className={styles.page}>
      {/* Header + filters */}
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.title}>Find <em>Work</em></h1>
          <p className={styles.subtitle}>{openJobs.length} open projects right now</p>

          <div className={styles.filterRow}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Search projects, skills…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search jobs"
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">✕</button>
              )}
            </div>
            <select
              className={styles.filterSelect}
              value={type}
              onChange={e => setType(e.target.value)}
              aria-label="Filter by project type"
            >
              <option value="All">All types</option>
              <option value="Fixed">Fixed price</option>
              <option value="Hourly">Hourly</option>
            </select>
          </div>

          <div className={styles.catScroll} role="group" aria-label="Filter by category">
            {CATS.map(c => (
              <button
                key={c}
                className={`${styles.catChip} ${cat === c ? styles.catActive : ''}`}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container">
        <div className={styles.results}>
          <div className={styles.resultsMeta}>
            <p className={styles.resultCount}>
              {isLoading ? 'Loading…' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''} found`}
            </p>
            {hasFilter && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                Clear filters ✕
              </button>
            )}
          </div>

          {isLoading ? (
            <JobListSkeleton count={5} />
          ) : (
            <div className={styles.list}>
              {filtered.map(job => {
                const isSaved = savedJobs.includes(job.id)
                return (
                  <Link to={`/job/${job.id}`} key={job.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <div className={styles.cardHeadLeft}>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                        <p className={styles.jobMeta}>{job.category} · Posted {job.posted}</p>
                      </div>
                      <div className={styles.cardHeadRight}>
                        <div className={styles.budgetBlock}>
                          <span className={styles.budget}>
                            {job.type === 'Hourly' ? `₦${job.budget}/hr` : `₦${(job.budget || 0).toLocaleString()}`}
                          </span>
                          <span className={styles.budgetType}>{job.type}</span>
                        </div>
                        {isLoggedIn && (
                          <button
                            className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
                            onClick={e => handleSave(e, job.id)}
                            aria-label={isSaved ? 'Unsave job' : 'Save job'}
                            aria-pressed={isSaved}
                          >
                            {isSaved ? '♥' : '♡'}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={styles.desc}>{job.description}</p>

                    <div className={styles.cardFoot}>
                      <div className={styles.skills}>
                        {(job.skills || []).map(s => (
                          <span key={s} className={styles.skill}>{s}</span>
                        ))}
                      </div>
                      <div className={styles.cardFootRight}>
                        {job.duration && <span className={styles.duration}>{job.duration}</span>}
                        <span className={styles.proposals}>
                          {job.proposals} proposal{job.proposals !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>📋</p>
              <p className={styles.emptyTitle}>No projects found</p>
              <p className={styles.emptyBody}>Try adjusting your search or filters</p>
              <button className={styles.emptyReset} onClick={clearFilters}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
