import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import FloatingObject from '../components/FloatingObject'
import styles from './Home.module.css'

/* ── Avatar colour hash (deterministic from name) ───────────────────── */
const AVATAR_HUES = [245, 173, 45, 8, 153, 276]
function avatarHue(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_HUES[h % AVATAR_HUES.length]
}

/* ── Static data ────────────────────────────────────────────────────── */
const CATEGORIES = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M17 14v6M14 17h6"/></svg>, label: 'AI Services', count: '3,200+', hue: 245 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, label: 'Development & IT', count: '18,400+', hue: 200 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>, label: 'Design & Creative', count: '11,000+', hue: 285 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, label: 'Sales & Marketing', count: '7,800+', hue: 15 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label: 'Writing & Translation', count: '9,500+', hue: 155 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>, label: 'Admin & Support', count: '5,200+', hue: 45 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Finance & Accounting', count: '4,700+', hue: 142 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Engineering & Arch', count: '3,900+', hue: 220 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Legal', count: '2,100+', hue: 0 },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'HR & Training', count: '2,800+', hue: 30 },
]

const LOGOS = ['Microsoft', 'Notion', 'Stripe', 'Airbnb', 'Figma', 'Linear', 'Vercel', 'Shopify']

const TRUST_COLS = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    title: 'Zero platform fees',
    body: 'NEXUS charges no commission. Every credit you earn goes directly to your wallet.',
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>,
    title: 'Escrow-protected payments',
    body: 'Funds are locked until both parties are satisfied. No chasing payments or bad actors.',
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17l.92-.08z"/></svg>,
    title: 'Verified students only',
    body: 'Sign-up requires a university email. Every account is tied to a real campus identity.',
  },
]

/* ── Floating hero card composition ─────────────────────────────────── */
function HeroCardComposition() {
  return (
    <div className={styles.heroComposition} aria-hidden="true">
      {/* Ambient orb */}
      <div className={styles.heroOrb} />

      {/* Primary card — freelancer profile */}
      <div className={styles.heroCard1}>
        <div className={styles.hcTop}>
          <div className={styles.hcAvatar} style={{ background: `hsl(245,70%,60%)` }}>AO</div>
          <div className={styles.hcInfo}>
            <p className={styles.hcName}>Adeola Okonkwo</p>
            <p className={styles.hcRole}>UI/UX Designer</p>
          </div>
          <div className={styles.hcRate}>₦8,500<span>/hr</span></div>
        </div>
        <div className={styles.hcSkills}>
          <span>Figma</span><span>Framer</span><span>React</span>
        </div>
        <div className={styles.hcStars}>
          {'★★★★★'} <span>4.9</span> · <span>127 jobs</span>
        </div>
      </div>

      {/* Secondary card — job notification */}
      <div className={styles.heroCard2}>
        <div className={styles.hcNotifIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
        </div>
        <div>
          <p className={styles.hcNotifTitle}>New Proposal</p>
          <p className={styles.hcNotifBody}>React Dashboard — ₦45,000</p>
        </div>
        <div className={styles.hcNotifBadge}>New</div>
      </div>

      {/* Floating payment badge */}
      <div className={styles.heroBadgePill}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        Payment secured — ₦240,000
      </div>

      {/* Geometric floating objects */}
      <FloatingObject shape="ring"    size={56}  x="80%"  y="10%"  duration={7}   phase={0}    opacity={0.18} colour="var(--nexus-accent)" />
      <FloatingObject shape="diamond" size={20}  x="5%"   y="25%"  duration={5}   phase={0.3}  opacity={0.15} colour="var(--nexus-accent)" />
      <FloatingObject shape="circle"  size={12}  x="90%"  y="65%"  duration={4.5} phase={0.6}  opacity={0.12} colour="var(--nexus-success)" filled />
      <FloatingObject shape="hexagon" size={32}  x="70%"  y="85%"  duration={8}   phase={0.5}  opacity={0.1}  colour="var(--nexus-warn)" />
    </div>
  )
}

/* ── Process step card (image-driven) ──────────────────────────────── */
function StepCard({ img, step, title, desc, detail, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={styles.stepCard}
      style={{ animationDelay: `${delay}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.stepNum}>{step}</div>
      <div className={styles.stepImgWrap}>
        <img
          src={img}
          alt=""
          className={styles.stepImg}
          loading="lazy"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className={`${styles.stepOverlay} ${hovered ? styles.stepOverlayVisible : ''}`}>
          <p className={styles.stepDetail}>{detail}</p>
        </div>
      </div>
      <div className={styles.stepBody}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepDesc}>{desc}</p>
      </div>
    </div>
  )
}

const HIRE_STEPS = [
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
    detail: 'Your payment is locked and protected until you sign off. No risk, no chasing invoices.',
  },
]

const WORK_STEPS = [
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
    detail: 'Filter by category, budget, and timeline. Write a short cover letter and name your price.',
  },
  {
    img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
    title: 'Get paid securely',
    desc: 'Payment is guaranteed in escrow before you even start.',
    detail: 'Once the client approves your work, funds hit your NEXUS wallet instantly.',
  },
]

/* ── Main Home component ────────────────────────────────────────────── */
export default function Home() {
  const [mode, setMode]   = useState('hire')
  const [query, setQuery] = useState('')
  const [howTab, setHowTab] = useState('hire')
  const navigate = useNavigate()

  const [catRef,  catVis]  = useScrollReveal()
  const [howRef,  howVis]  = useScrollReveal()
  const [trustRef, trustVis] = useScrollReveal()
  const [ctaRef,  ctaVis]  = useScrollReveal()

  const steps = howTab === 'hire' ? HIRE_STEPS : WORK_STEPS

  const SUGGESTIONS = mode === 'hire'
    ? ['UI/UX Designer', 'React Developer', 'Copywriter', 'Data Analyst']
    : ['Frontend Jobs', 'Design Projects', 'Writing Gigs', 'Analytics']

  function handleSearch(e) {
    e.preventDefault()
    const path = mode === 'hire' ? '/browse' : '/jobs'
    navigate(`${path}?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        {/* Mesh gradient background */}
        <div className={styles.heroMesh} aria-hidden="true" />
        {/* Vertical grid lines */}
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={`container ${styles.heroInner}`}>
          {/* Left column — text */}
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <span className={styles.dot} />
              Trusted by 50,000+ students across Nigeria
            </div>

            <h1 id="hero-heading" className={styles.headline}>
              Where talent<br />meets <em>opportunity.</em>
            </h1>
            <p className={styles.subline}>
              NEXUS connects skilled freelancers with ambitious students —
              secured by escrow, verified by university email.
            </p>

            {/* Mode toggle */}
            <div className={styles.modeToggle} role="group" aria-label="Select mode">
              <button
                className={`${styles.modeBtn} ${mode === 'hire' ? styles.modeActive : ''}`}
                onClick={() => setMode('hire')}
                aria-pressed={mode === 'hire'}
              >I want to hire</button>
              <button
                className={`${styles.modeBtn} ${mode === 'work' ? styles.modeActive : ''}`}
                onClick={() => setMode('work')}
                aria-pressed={mode === 'work'}
              >I want to work</button>
            </div>

            {/* Search */}
            <form className={styles.searchWrap} onSubmit={handleSearch}>
              <div className={styles.searchBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className={styles.searchInput}
                  placeholder={mode === 'hire' ? 'Describe what you need…' : 'Search for opportunities…'}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label={mode === 'hire' ? 'Search for freelancers' : 'Search for jobs'}
                />
                <button type="submit" className={styles.searchBtn}>Search →</button>
              </div>
              <div className={styles.chips}>
                <span className={styles.chipsLabel}>Popular:</span>
                {SUGGESTIONS.map(s => (
                  <button type="button" key={s} className={styles.chip} onClick={() => setQuery(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </form>

            {/* Scroll indicator */}
            <div className={styles.scrollIndicator} aria-hidden="true">
              <span className={styles.scrollLabel}>SCROLL</span>
              <div className={styles.scrollLine} />
            </div>
          </div>

          {/* Right column — floating 3D composition */}
          <HeroCardComposition />
        </div>
      </section>

      {/* ── Trust marquee ─────────────────────────────────────────── */}
      <section className={styles.marqueeSection} aria-label="Trusted by">
        <p className={styles.marqueeLabel}>Trusted by teams at</p>
        <div className={styles.marqueeWrap}>
          <div className={styles.marqueeTrack}>
            {[...LOGOS, ...LOGOS].map((n, i) => (
              <span key={i} className={styles.marqueeItem}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────── */}
      <section className={styles.catsSection} id="categories" ref={catRef} aria-labelledby="cats-heading">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Browse by expertise</p>
              <h2 id="cats-heading" className={styles.sectionTitle}>
                Talent for every<br /><em>kind of work.</em>
              </h2>
            </div>
            <Link to="/browse" className={styles.viewAll}>View all categories →</Link>
          </div>
          <div className={styles.catGrid}>
            {CATEGORIES.map((c, i) => (
              <Link
                to={`/browse?cat=${encodeURIComponent(c.label)}`}
                key={c.label}
                className={styles.catCard}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  '--cat-hue': c.hue,
                }}
              >
                <span className={styles.catIcon}>{c.icon}</span>
                <span className={styles.catLabel}>{c.label}</span>
                <span className={styles.catCount}>{c.count} experts</span>
                <span className={styles.catArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className={styles.howSection} id="how-it-works" ref={howRef} aria-labelledby="how-heading">
        <div className="container">
          <div className={styles.howHead}>
            <div>
              <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.4)' }}>Simple by design</p>
              <h2 id="how-heading" className={styles.howTitle}>How NEXUS works.</h2>
            </div>
            <div className={styles.howTabBar} role="group" aria-label="View steps for">
              <button
                className={`${styles.howTabBtn} ${howTab === 'hire' ? styles.howTabActive : ''}`}
                onClick={() => setHowTab('hire')}
                aria-pressed={howTab === 'hire'}
              >For hiring</button>
              <button
                className={`${styles.howTabBtn} ${howTab === 'work' ? styles.howTabActive : ''}`}
                onClick={() => setHowTab('work')}
                aria-pressed={howTab === 'work'}
              >For finding work</button>
            </div>
          </div>

          <div className={styles.stepCards} key={howTab}>
            {steps.map((s, i) => (
              <StepCard key={s.title} {...s} step={i + 1} visible={true} delay={i * 0.12} />
            ))}
          </div>


          {/* Trust strip */}
          <div className={styles.howTrust} ref={trustRef}>
            {TRUST_COLS.map((c, i) => (
              <div
                key={c.title}
                className={`${styles.trustCol} ${i < 2 ? styles.trustDivider : ''}`}
                style={{
                  opacity:   trustVis ? 1 : 0,
                  transform: trustVis ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s var(--ease-out) ${i * 0.1}s`,
                }}
              >
                <div className={styles.trustIcon}>{c.icon}</div>
                <div>
                  <p className={styles.trustTitle}>{c.title}</p>
                  <p className={styles.trustBody}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} ref={ctaRef} aria-labelledby="cta-heading">
        <div className="container">
          <div
            className={styles.ctaCard}
            style={{
              opacity:   ctaVis ? 1 : 0,
              transform: ctaVis ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.7s ease, transform 0.7s var(--ease-out)',
            }}
          >
            {/* Watermark text */}
            <p className={styles.ctaWatermark} aria-hidden="true">NEXUS</p>

            {/* Orbiting shapes */}
            <FloatingObject shape="ring"    size={64}  x="75%"  y="15%"  duration={20} phase={0}   opacity={0.08} colour="rgba(255,255,255,0.6)" rotate />
            <FloatingObject shape="diamond" size={28}  x="85%"  y="70%"  duration={28} phase={0.4} opacity={0.07} colour="rgba(255,255,255,0.5)" rotate />
            <FloatingObject shape="circle"  size={20}  x="60%"  y="80%"  duration={35} phase={0.7} opacity={0.06} colour="rgba(255,255,255,0.4)" />
            <FloatingObject shape="hexagon" size={44}  x="92%"  y="40%"  duration={25} phase={0.2} opacity={0.05} colour="rgba(255,255,255,0.4)" />

            <div className={styles.ctaContent}>
              <p className={styles.eyebrow} style={{ color: 'rgba(255,255,255,0.35)' }}>Ready to start?</p>
              <h2 id="cta-heading" className={styles.ctaTitle}>
                The future of work<br /><em>is already here.</em>
              </h2>
              <p className={styles.ctaBody}>
                Join 180,000+ professionals. No commitments, no monthly fees.
              </p>
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
