import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Browse.module.css'

const CATS = ['All','AI Services','Development & IT','Design & Creative','Sales & Marketing','Writing & Translation','Finance & Accounting','Engineering & Architecture','Legal','HR & Training']

function StarRating({ rating }) {
  return (
    <span className={styles.stars}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </span>
  )
}

export default function Browse() {
  const { freelancers, savedFreelancers, toggleSaveFreelancer, isLoggedIn } = useApp()
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [cat, setCat] = useState('All')
  const [sortBy, setSortBy] = useState('rating')

  const filtered = useMemo(() => {
    let list = freelancers
    if (search) list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.title.toLowerCase().includes(search.toLowerCase()) || f.skills.some(s => s.toLowerCase().includes(search.toLowerCase())))
    if (cat !== 'All') list = list.filter(f => {
      const map = {'Development & IT':['Developer','Dev'],'Design & Creative':['Designer','Motion'],'Writing & Translation':['Writer','Copy'],'Finance & Accounting':['Financial'],'AI Services':['AI'],'Sales & Marketing':['Brand','Marketing'],'Engineering & Architecture':['Engineering'],'Legal':['Legal'],'HR & Training':['HR','Training']}
      const kws = map[cat] || []
      return kws.some(k => f.title.includes(k))
    })
    if (sortBy === 'rating')    list = [...list].sort((a,b) => b.rating - a.rating)
    if (sortBy === 'rate_low')  list = [...list].sort((a,b) => a.rate - b.rate)
    if (sortBy === 'rate_high') list = [...list].sort((a,b) => b.rate - a.rate)
    return list
  }, [freelancers, search, cat, sortBy])

  function handleSave(e, fId) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) return
    toggleSaveFreelancer(fId)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.title}>Browse <em>Talent</em></h1>
          <p className={styles.subtitle}>{freelancers.length.toLocaleString()} vetted professionals ready to work</p>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className={styles.searchInput} placeholder="Search by skill, title, or name…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className={styles.sortSelect} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="rating">Top Rated</option>
              <option value="rate_low">Rate: Low → High</option>
              <option value="rate_high">Rate: High → Low</option>
            </select>
          </div>
          <div className={styles.catScroll}>
            {CATS.map(c => (
              <button key={c} className={`${styles.catChip} ${cat===c?styles.catActive:''}`} onClick={()=>setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.results}>
          <p className={styles.resultCount}>{filtered.length} freelancer{filtered.length !== 1 ? 's' : ''} found</p>
          <div className={styles.grid}>
            {filtered.map(f => {
              const isSaved = savedFreelancers.includes(f.id)
              return (
                <Link to={`/freelancer/${f.id}`} key={f.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardAvatar}>{f.avatar}</div>
                    <div className={styles.cardMeta}>
                      <h3 className={styles.cardName}>{f.name}</h3>
                      <p className={styles.cardTitle}>{f.title}</p>
                      <p className={styles.cardLocation}>{f.location}</p>
                    </div>
                    <div className={styles.cardTopRight}>
                      <div className={styles.cardRate}>${f.rate}<span>/hr</span></div>
                      {isLoggedIn && (
                        <button
                          className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
                          onClick={e => handleSave(e, f.id)}
                          title={isSaved ? 'Unsave' : 'Save'}
                        >{isSaved ? '♥' : '♡'}</button>
                      )}
                    </div>
                  </div>
                  <p className={styles.cardBio}>{f.bio}</p>
                  <div className={styles.cardSkills}>
                    {f.skills.map(s => <span key={s} className={styles.skill}>{s}</span>)}
                  </div>
                  <div className={styles.cardFooter}>
                    <StarRating rating={f.rating}/>
                    <span className={styles.reviewCount}>{f.reviews} reviews</span>
                    <span className={styles.completedJobs}>{f.completedJobs} jobs done</span>
                  </div>
                </Link>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No results found</p>
              <p className={styles.emptyBody}>Try adjusting your search or category filter</p>
              <button className={styles.emptyReset} onClick={()=>{setSearch('');setCat('All')}}>Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
