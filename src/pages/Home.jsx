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

const SEEKER_STEPS = [
  { icon: '✎', title: 'Post a service request',   body: 'Describe what you need, your budget, and how soon. Your post goes live instantly — any skilled student on campus can see it and respond.' },
  { icon: '◈', title: 'Receive proposals',          body: 'Interested students submit proposals with their approach, timeline, and bid price. You read their profiles, reviews, and past work before deciding.' },
  { icon: '⊞', title: 'Accept and fund escrow',    body: 'Choose the proposal that fits best. When you accept, your payment is automatically moved to escrow — locked and protected until you approve the final work.' },
  { icon: '↗', title: 'Track progress',             body: 'Follow the contract through your dashboard. Message your provider anytime. Mark milestones as they are delivered so both sides stay on the same page.' },
  { icon: '✓', title: 'Approve and release',        body: 'Happy with the result? Release payment with one click and leave a review. Not satisfied? Open a dispute — funds stay locked until it is resolved.' },
]

const PROVIDER_STEPS = [
  { icon: '◈', title: 'Build your profile',         body: 'List your skills, set your rate, and write a short bio. Your profile is your campus portfolio — complete profiles get significantly more views from students who need help.' },
  { icon: '✎', title: 'Browse open requests',       body: 'See all the service requests posted by students across every category — programming help, design work, essay proofreading, repairs, tutoring, and more.' },
  { icon: '→', title: 'Submit a proposal',           body: 'Found a request that fits your skills? Write a short cover letter explaining your approach, set your price, and submit. The student reviews all proposals and picks their best match.' },
  { icon: '⊞', title: 'Deliver your work',          body: 'Once hired, communicate through NEXUS messaging and deliver against the agreed milestones. Your payment is already secured in escrow — you know you will get paid.' },
  { icon: '✓', title: 'Get paid instantly',          body: 'When the student approves your work, the escrow payment is released to your NEXUS wallet immediately. Withdraw to your bank account anytime.' },
]

const TRUST_COLS = [
  { icon: '✦', title: 'Zero platform fees',           body: 'NEXUS charges no commission. Every credit you earn goes directly to your wallet.' },
  { icon: '⊞', title: 'Escrow-protected payments',    body: 'Funds are locked until both parties are satisfied. No more chasing payment or losing money to bad actors.' },
  { icon: '◈', title: 'Verified students only',       body: 'Sign-up requires a university email address. Every account is tied to a real campus identity — no anonymous users.' },
]

function HowSection({ howRef, howVis }) {
  const [howTab, setHowTab] = useState('seeker')
  const steps = howTab === 'seeker' ? SEEKER_STEPS : PROVIDER_STEPS

  return (
    <section className={styles.how} id="how-it-works" ref={howRef}>
      <div className="container">

        {/* Heading */}
        <div className={styles.sectionHead} style={{ marginBottom: 0 }}>
          <div>
            <p className={styles.eyebrow}>Simple by design</p>
            <h2 className={styles.sectionTitle}>How NEXUS works.</h2>
            <p className={styles.howSubtext}>
              Whether you need help or want to offer your skills,<br />
              NEXUS makes student service exchange simple, safe, and fair.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={styles.howTabBar}>
          <button
            className={`${styles.howTabBtn} ${howTab === 'seeker' ? styles.howTabActive : ''}`}
            onClick={() => setHowTab('seeker')}
          >
            I need help
          </button>
          <button
            className={`${styles.howTabBtn} ${howTab === 'provider' ? styles.howTabActive : ''}`}
            onClick={() => setHowTab('provider')}
          >
            I have skills
          </button>
        </div>

        {/* Steps */}
        <div className={styles.howSteps} key={howTab}>
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={styles.howStepNew}
              style={{
                opacity: howVis ? 1 : 0,
                transform: howVis ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s var(--ease-out) ${i * 0.08}s`,
              }}
            >
              <div className={styles.howStepIcon}>{s.icon}</div>
              <span className={styles.howStepNum}>Step {String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.howStepTitle}>{s.title}</h3>
              <p className={styles.howStepBody}>{s.body}</p>
            </div>
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

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.gridLines} aria-hidden>
          {Array.from({length:7}).map((_,i)=><div key={i} className={styles.gridLine}/>)}
        </div>
        <div className={`container ${styles.heroInner}`}>
          <div className={`${styles.badge}`}>
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

          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${mode==='hire'?styles.modeActive:''}`} onClick={()=>setMode('hire')}>I want to hire</button>
            <button className={`${styles.modeBtn} ${mode==='work'?styles.modeActive:''}`} onClick={()=>setMode('work')}>I want to work</button>
          </div>

          <form className={styles.searchWrap} onSubmit={handleSearch}>
            <div className={styles.searchBox}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className={styles.searchInput}
                placeholder={mode==='hire' ? 'Describe what you need…' : 'Search for opportunities…'}
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </div>
            <div className={styles.chips}>
              <span className={styles.chipsLabel}>Popular:</span>
              {SUGGESTIONS.map(s=>(
                <button type="button" key={s} className={styles.chip} onClick={()=>setQuery(s)}>{s}</button>
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
            {[...LOGOS,...LOGOS].map((n,i)=><span key={i} className={styles.marqueeItem}>{n}</span>)}
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
            {CATEGORIES.map((c,i)=>(
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
