import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Home.module.css'

const CATEGORIES = [
  { icon: '⬡', label: 'AI Services',               count: '3,200+' },
  { icon: '</>',label: 'Development & IT',           count: '18,400+' },
  { icon: '◈',  label: 'Design & Creative',          count: '11,000+' },
  { icon: '↗',  label: 'Sales & Marketing',          count: '7,800+' },
  { icon: '✎',  label: 'Writing & Translation',      count: '9,500+' },
  { icon: '⊞',  label: 'Admin & Support',            count: '5,200+' },
  { icon: '$',  label: 'Finance & Accounting',        count: '4,700+' },
  { icon: '⬡',  label: 'Engineering & Architecture', count: '3,900+' },
  { icon: '⚖',  label: 'Legal',                      count: '2,100+' },
  { icon: '⊙',  label: 'HR & Training',              count: '2,800+' },
]

const LOGOS = ['Microsoft','Notion','Stripe','Airbnb','Figma','Linear','Vercel','Shopify']

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return [ref, vis]
}

const HIRE_CARDS = [
  {
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    title: 'Post a job for free',
    desc: 'Describe what you need, set your budget, and go live instantly.',
    detail: 'Your post reaches thousands of vetted students on campus in seconds. No fees, no commitments — just results.',
  },
  {
    img: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&q=80',
    title: 'Review proposals & hire',
    desc: 'Browse proposals, check profiles, and pick your perfect match.',
    detail: 'Compare bids, read cover letters, and view past reviews — everything you need to make a confident decision.',
  },
  {
    img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80',
    title: 'Pay only when done',
    desc: 'Funds stay in escrow until you approve the completed work.',
    detail: 'Your payment is locked and protected until you sign off. No risk, no chasing invoices — just safe, simple transactions.',
  },
]

const WORK_CARDS = [
  {
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
    title: 'Create your profile',
    desc: 'List your skills, set your rate, and showcase your work.',
    detail: 'A complete profile is your campus portfolio. Students searching for your expertise will find you first.',
  },
  {
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
    title: 'Browse & apply to jobs',
    desc: 'Find projects that match your skills and submit proposals.',
    detail: 'Filter by category, budget, and timeline. Write a short cover letter and name your price — the client picks their favourite.',
  },
  {
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    title: 'Get paid securely',
    desc: 'Payment is guaranteed in escrow before you even start.',
    detail: 'Once the client approves your work, funds hit your NEXUS wallet instantly. Withdraw to your bank any time.',
  },
]

const TRUST_COLS = [
  { icon: '✦', title: 'Zero platform fees',           body: 'NEXUS charges no commission. Every credit you earn goes directly to your wallet.' },
  { icon: '⊞', title: 'Escrow-protected payments',    body: 'Funds are locked until both parties are satisfied. No more chasing payment or losing money to bad actors.' },
  { icon: '◈', title: 'Verified students only',       body: 'Sign-up requires a university email address. Every account is tied to a real campus identity — no anonymous users.' },
]

function HowCard({ card, visible, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={styles.howCard}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.55s ease ${delay}s, transform 0.55s var(--ease-out) ${delay}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.howCardImgWrap}>
        <img
          src={card.img}
          alt={card.title}
          className={styles.howCardImg}
          loading="lazy"
        />
        {/* Hover overlay with detail text */}
        <div className={`${styles.howCardOverlay} ${hovered ? styles.howCardOverlayVisible : ''}`}>
          <p className={styles.howCardDetail}>{card.detail}</p>
        </div>
      </div>
      <div className={styles.howCardBody}>
        <h3 className={styles.howCardTitle}>{card.title}</h3>
        <p className={styles.howCardDesc}>{card.desc}</p>
      </div>
    </div>
  )
}

function HowSection({ howRef, howVis }) {
  const [howTab, setHowTab] = useState('hire')
  const cards = howTab === 'hire' ? HIRE_CARDS : WORK_CARDS

  return (
    <section className={styles.how} id="how-it-works" ref={howRef}>
      <div className="container">
        <div className={styles.howHead}>
          <div>
            <p className={styles.eyebrow}>Simple by design</p>
            <h2 className={styles.sectionTitle}>How NEXUS works.</h2>
          </div>
          {/* Tab switcher — top right */}
          <div className={styles.howTabBar}>
            <button
              className={`${styles.howTabBtn} ${howTab === 'hire' ? styles.howTabActive : ''}`}
              onClick={() => setHowTab('hire')}
            >
              For hiring
            </button>
            <button
              className={`${styles.howTabBtn} ${howTab === 'work' ? styles.howTabActive : ''}`}
              onClick={() => setHowTab('work')}
            >
              For finding work
            </button>
          </div>
        </div>

        {/* Image cards */}
        <div className={styles.howCards} key={howTab}>
          {cards.map((card, i) => (
            <HowCard key={card.title} card={card} visible={howVis} delay={i * 0.1} />
          ))}
        </div>

        {/* Trust strip */}
        <div className={styles.howTrust}>
          {TRUST_COLS.map((c, i) => (
            <div key={c.title} className={`${styles.howTrustCol} ${i < 2 ? styles.howTrustDivider : ''}`}>
              <div className={styles.howTrustIcon}>{c.icon}</div>
              <div>
                <p className={styles.howTrustTitle}>{c.title}</p>
                <p className={styles.howTrustBody}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [mode, setMode] = useState('hire')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const [catRef, catVis] = useInView()
  const [howRef, howVis] = useInView()

  const SUGGESTIONS = mode === 'hire'
    ? ['UI/UX Designer','React Developer','Copywriter','Data Analyst']
    : ['Frontend Jobs','Design Projects','Writing Gigs','Analytics']

  function handleSearch(e) {
    e.preventDefault()
    navigate(mode === 'hire' ? `/browse?q=${query}` : `/jobs?q=${query}`)
  }

  return (
    <div className={styles.page}>

      {/* ── Hero — full-bleed photo ── */}
      <section className={styles.hero}>
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1800&q=85"
          alt="Students collaborating on campus"
          className={styles.heroBg}
        />
        {/* Dark gradient overlay */}
        <div className={styles.heroOverlay} />

        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>
            <span className={styles.dot}/>
            Trusted by 50,000+ professionals worldwide
          </div>

          <h1 className={styles.headline}>
            Where talent meets<br/><em>opportunity.</em>
          </h1>
          <p className={styles.subline}>
            NEXUS connects skilled freelancers with ambitious businesses —<br/>
            without the overhead of traditional hiring.
          </p>

          {/* Frosted-glass pill toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'hire' ? styles.modeActive : ''}`}
              onClick={() => setMode('hire')}
            >
              I want to hire
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'work' ? styles.modeActive : ''}`}
              onClick={() => setMode('work')}
            >
              I want to work
            </button>
          </div>

          {/* Search bar */}
          <form className={styles.searchWrap} onSubmit={handleSearch}>
            <div className={styles.searchBox}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className={styles.searchInput}
                placeholder={mode === 'hire' ? 'Describe what you need…' : 'Search for opportunities…'}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>Search →</button>
            </div>
            <div className={styles.chips}>
              <span className={styles.chipsLabel}>Popular:</span>
              {SUGGESTIONS.map(s => (
                <button type="button" key={s} className={styles.chip} onClick={() => setQuery(s)}>{s}</button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ── Trust marquee ── */}
      <section className={styles.trust}>
        <p className={styles.trustLabel}>Trusted by teams at</p>
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[...LOGOS,...LOGOS].map((n,i) => <span key={i} className={styles.marqueeItem}>{n}</span>)}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className={styles.cats} id="categories" ref={catRef}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Browse by expertise</p>
              <h2 className={styles.sectionTitle}>Talent for every<br/><em>kind of work.</em></h2>
            </div>
            <Link to="/browse" className={styles.viewAll}>View all categories →</Link>
          </div>
          <div className={styles.catGrid}>
            {CATEGORIES.map((c,i) => (
              <Link to={`/browse?cat=${encodeURIComponent(c.label)}`} key={c.label} className={styles.catCard}
                style={{ opacity: catVis?1:0, transform: catVis?'translateY(0)':'translateY(28px)', transition:`opacity 0.5s ease ${i*0.05}s,transform 0.5s var(--ease-out) ${i*0.05}s` }}>
                <span className={styles.catIcon}>{c.icon}</span>
                <span className={styles.catLabel}>{c.label}</span>
                <span className={styles.catCount}>{c.count} experts</span>
                <span className={styles.catArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowSection howRef={howRef} howVis={howVis} />

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <p className={styles.ctaBg} aria-hidden>NEXUS</p>
            <div className={styles.ctaContent}>
              <p className={styles.eyebrow} style={{color:'rgba(255,255,255,0.4)'}}>Ready to start?</p>
              <h2 className={styles.ctaTitle}>The future of work<br/><em>is already here.</em></h2>
              <p className={styles.ctaBody}>Join 180,000+ professionals. No commitments, no monthly fees.</p>
              <div className={styles.ctaActions}>
                <Link to="/browse" className={styles.ctaPrimary}>Start hiring →</Link>
                <Link to="/jobs"   className={styles.ctaGhost}>Find work →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
