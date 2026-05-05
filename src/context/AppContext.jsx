import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, addDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, deleteDoc,
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { ref, onValue } from 'firebase/database'
import { auth, db, rtdb } from '../firebase/config'
import { onAuthChange } from '../firebase/authService'
import { subscribeToThreads } from '../firebase/messageService'

// ── Helpers ───────────────────────────────────────────────────────────────
const uid   = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`
const today = () => new Date().toISOString().slice(0,10)
const initials = name => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

// ── Seed data (fallback when Firestore returns 0 results) ─────────────────
const SEED_FREELANCERS = [
  { id:'f1', name:'Amara Osei',       avatar:'AO', title:'UI/UX Designer',            rate:45,  rating:4.9, reviews:128, skills:['Figma','Prototyping','User Research','Design Systems'], bio:'Award-winning designer with 6+ years helping startups ship beautiful products. I specialize in end-to-end product design from research to high-fidelity prototypes.', location:'Lagos, NG', completedJobs:84, category:'Design & Creative',    emailVerified:true, memberSince:'2025-09-01' },
  { id:'f2', name:'Javier Ruiz',      avatar:'JR', title:'Full-Stack Developer',       rate:65,  rating:4.8, reviews:213, skills:['React','Node.js','PostgreSQL','TypeScript'], bio:'I build fast, scalable web apps. Obsessed with clean code and great UX. 8+ years across fintech and SaaS.', location:'Lagos, NG', completedJobs:142, category:'Development & IT',  emailVerified:true, memberSince:'2025-09-05' },
  { id:'f3', name:'Priya Nair',       avatar:'PN', title:'Brand Strategist',           rate:55,  rating:5.0, reviews:67,  skills:['Brand Identity','Copywriting','Strategy','Positioning'], bio:'Former FMCG brand manager. Now I help campus brands find their voice and build identities that last.', location:'Abuja, NG', completedJobs:53, category:'Sales & Marketing', emailVerified:true, memberSince:'2025-09-10' },
  { id:'f4', name:'Kwame Asante',     avatar:'KA', title:'Motion Designer',            rate:50,  rating:4.7, reviews:91,  skills:['After Effects','Cinema 4D','Lottie','Premiere Pro'], bio:'I animate ideas into stories. Worked with campus media teams and student productions for 3 years.', location:'Lagos, NG', completedJobs:76, category:'Design & Creative',    emailVerified:true, memberSince:'2025-08-20' },
  { id:'f5', name:'Sofia Lindqvist',  avatar:'SL', title:'Data Analyst',               rate:60,  rating:4.9, reviews:55,  skills:['Python','Tableau','SQL','dbt'], bio:'Turning raw data into decisions. I help student associations and campus projects instrument, analyze and act on their data.', location:'Ibadan, NG', completedJobs:39, category:'Development & IT',  emailVerified:true, memberSince:'2025-09-15' },
  { id:'f6', name:'Ethan Mwangi',     avatar:'EM', title:'SEO Copywriter',             rate:35,  rating:4.6, reviews:174, skills:['SEO Writing','Email Marketing','Ads Copy','Content Strategy'], bio:'Words that convert. I have helped 50+ campus brands rank online and grow their audience.', location:'Lagos, NG', completedJobs:161, category:'Writing & Translation', emailVerified:true, memberSince:'2025-07-01' },
  { id:'f7', name:'Chen Wei',         avatar:'CW', title:'Mobile Developer',           rate:70,  rating:4.8, reviews:88,  skills:['React Native','Flutter','Swift','Kotlin'], bio:'I ship mobile apps that students love. 10+ campus apps delivered, from event trackers to study tools.', location:'Lagos, NG', completedJobs:67, category:'Development & IT',  emailVerified:true, memberSince:'2025-09-03' },
  { id:'f8', name:'Fatima Al-Hassan', avatar:'FA', title:'Financial Analyst',          rate:75,  rating:5.0, reviews:42,  skills:['Financial Modeling','Excel','FP&A','Valuation'], bio:'Finance student with CFA Level I. I build financial models for campus startups and help societies manage their budgets.', location:'Abuja, NG', completedJobs:31, category:'Finance & Accounting', emailVerified:true, memberSince:'2025-10-01' },
  { id:'f9', name:'Diego Morales',    avatar:'DM', title:'DevOps Engineer',            rate:80,  rating:4.8, reviews:63,  skills:['AWS','Terraform','Docker','Kubernetes'], bio:'Cloud infrastructure expert. I help student teams deploy and scale their projects without complexity.', location:'Lagos, NG', completedJobs:48, category:'Development & IT',  emailVerified:true, memberSince:'2025-08-15' },
  { id:'f10',name:'Yuki Tanaka',      avatar:'YT', title:'Legal Consultant',           rate:90,  rating:4.9, reviews:29,  skills:['Contract Law','IP','Compliance','GDPR'], bio:'Law student specializing in tech and IP. I help campus startups with contracts, partnerships, and compliance.', location:'Lagos, NG', completedJobs:22, category:'Legal',               emailVerified:true, memberSince:'2025-11-01' },
  // ── Campus-specific additions ──
  { id:'f11',name:'Chidi Okonkwo',   avatar:'CO', title:'Academic Tutor',             rate:15,  rating:4.8, reviews:34,  skills:['Mathematics','Calculus','Statistics','Physics'], bio:'300-level Engineering student at UNILAG. I have been tutoring fellow students in STEM subjects for 2 years. Clear explanations and flexible scheduling.', location:'Lagos, NG', completedJobs:28, category:'Academic Support',  emailVerified:true, memberSince:'2025-09-20' },
  { id:'f12',name:'Adaeze Nwosu',    avatar:'AN', title:'Campus Photographer',        rate:20,  rating:4.9, reviews:19,  skills:['Event Photography','Portrait','Lightroom','Adobe Express'], bio:'Mass Communication student passionate about visual storytelling. I cover departmental events, graduations, socials, and personal portraits on campus.', location:'Lagos, NG', completedJobs:15, category:'Photography',       emailVerified:true, memberSince:'2025-10-05' },
  { id:'f13',name:'Seun Adeyemi',    avatar:'SA', title:'Social Media Manager',       rate:25,  rating:4.7, reviews:12,  skills:['Instagram','TikTok','Content Calendar','Canva'], bio:'Marketing student with hands-on experience managing social accounts for campus brand pages and student startups. I grow engagement and create content that resonates with university audiences.', location:'Abuja, NG', completedJobs:9,  category:'Sales & Marketing', emailVerified:true, memberSince:'2025-11-10' },
  { id:'f14',name:'Tolu Fashola',    avatar:'TF', title:'Video Editor',               rate:30,  rating:4.6, reviews:22,  skills:['Premiere Pro','CapCut','DaVinci Resolve','After Effects'], bio:'Computer Science student who edits YouTube vlogs, TikTok content, and departmental recap videos. Fast turnaround, clean transitions, and strong storytelling for campus creators.', location:'Lagos, NG', completedJobs:18, category:'Design & Creative',  emailVerified:true, memberSince:'2025-09-25' },
]

const SEED_JOBS = [
  { id:'j1', title:'Build a SaaS dashboard in React', category:'Development & IT', budget:1200, type:'Fixed', posted:'2 days ago', proposals:14, description:'We need a polished admin dashboard with charts, tables, and a dark mode toggle. Figma designs provided. Must be fully responsive and integrate with our REST API.', skills:['React','Tailwind','Chart.js'], clientId:'demo', status:'open', duration:'2–4 weeks' },
  { id:'j2', title:'Brand identity for fintech startup', category:'Design & Creative', budget:800, type:'Fixed', posted:'1 day ago', proposals:9, description:'Create a full brand identity: logo, color palette, typography, and usage guidelines for a mobile payments startup targeting African markets.', skills:['Branding','Figma','Illustration'], clientId:'demo', status:'open', duration:'1–2 weeks' },
  { id:'j3', title:'SEO content writer – 10 articles/month', category:'Writing & Translation', budget:40, type:'Hourly', posted:'3 hours ago', proposals:22, description:'We are a B2B SaaS company needing long-form, keyword-optimised content every month. Style guide and content calendar provided. Minimum 1500 words per article.', skills:['SEO','Long-form','B2B'], clientId:'demo', status:'open', duration:'Ongoing' },
  { id:'j4', title:'Data pipeline in Python + AWS', category:'Development & IT', budget:2000, type:'Fixed', posted:'5 days ago', proposals:6, description:'Build an ETL pipeline that ingests CSV data from S3, transforms it, and loads into Redshift. Automated with Airflow. Full test coverage required.', skills:['Python','AWS','Airflow'], clientId:'demo', status:'open', duration:'3–5 weeks' },
  { id:'j5', title:'Explainer video animation', category:'Design & Creative', budget:600, type:'Fixed', posted:'6 hours ago', proposals:11, description:'60-second animated explainer video for our product launch. Script is ready and narration will be provided. Need motion designer for animation only.', skills:['After Effects','Animation'], clientId:'demo', status:'open', duration:'1 week' },
  { id:'j6', title:'Financial model for Series A deck', category:'Finance & Accounting', budget:1500, type:'Fixed', posted:'1 day ago', proposals:4, description:'Build a 5-year financial model with revenue projections, unit economics, and a cap table. Outputs will be used in investor meetings. Must work in Excel and Google Sheets.', skills:['Excel','Financial Modeling','FP&A'], clientId:'demo', status:'open', duration:'1–2 weeks' },
  { id:'j7', title:'Mobile app UI design – iOS & Android', category:'Design & Creative', budget:950, type:'Fixed', posted:'4 hours ago', proposals:7, description:'Design screens for a fitness tracking app: onboarding, home, workout tracking, and profile. Deliverable: Figma file with components and auto-layout.', skills:['Figma','Mobile UI','iOS Design'], clientId:'demo2', status:'open', duration:'2 weeks' },
  { id:'j8', title:'GDPR compliance review & documentation', category:'Legal', budget:1100, type:'Fixed', posted:'3 days ago', proposals:3, description:'Review our current data practices, draft privacy policy, DSAR process and DPA templates. We process EU user data and need to be fully compliant.', skills:['GDPR','Privacy Law','Compliance'], clientId:'demo2', status:'open', duration:'1 week' },
  // ── Campus-specific jobs ──
  { id:'j9', title:'Need a tutor for Calculus — 4 sessions', category:'Academic Support', budget:8000, type:'Fixed', posted:'1 day ago', proposals:3, description:'I am a 200-level Engineering student struggling with MTH102 (Integral Calculus). I need 4 one-hour tutoring sessions, preferably over 2 weeks. Flexible timing, can meet in the library or remotely.', skills:['Mathematics','Calculus','Teaching'], clientId:'demo', status:'open', duration:'2 weeks' },
  { id:'j10',title:'Event photographer for departmental dinner', category:'Photography', budget:15000, type:'Fixed', posted:'12 hours ago', proposals:5, description:'Our department (Computer Science, UNILAG) is hosting its annual dinner and awards night. We need a professional photographer to cover the full event (approx. 3 hours) and deliver edited photos within 48 hours.', skills:['Event Photography','Lightroom','Photo Editing'], clientId:'demo2', status:'open', duration:'1 evening' },
  { id:'j11',title:'Manage our faculty association Instagram for 1 month', category:'Sales & Marketing', budget:500, type:'Hourly', posted:'2 days ago', proposals:7, description:'The Faculty of Social Sciences Association needs a social media manager to handle our Instagram page for the month of May. Responsibilities: 3 posts per week, story updates, and audience engagement. Content ideas will be provided.', skills:['Instagram','Canva','Content Creation'], clientId:'demo2', status:'open', duration:'1 month' },
]

const SEED_DISPUTES = [
  {
    id: 'NXS-001',
    contractId: 'c1',
    jobTitle: 'Build a SaaS dashboard in React',
    freelancerName: 'Javier Ruiz',
    amount: 1200,
    reason: 'Work quality below standard',
    description: 'The delivered dashboard has multiple broken components and does not match the Figma designs provided. The Charts & Data milestone was marked complete, but the charts are rendering with placeholder data and not connected to the REST API as agreed. I have sent three follow-up messages with no meaningful response over 5 days.',
    evidenceCount: 3,
    status: 'under_review',
    priority: 'high',
    createdAt: '2026-02-20',
    resolverNote: 'We have reviewed the submitted evidence and have reached out to the freelancer for their response. A decision will be issued within 24 hours.',
  },
  {
    id: 'NXS-002',
    contractId: 'c_demo2',
    jobTitle: 'Brand identity for fintech startup',
    freelancerName: 'Priya Nair',
    amount: 800,
    reason: 'Missed deadlines',
    description: 'The agreed delivery date was 10 days after kick-off. It has now been 18 days and only a mood board has been delivered. No logo, color palette, or usage guidelines as specified in the contract scope.',
    evidenceCount: 1,
    status: 'open',
    priority: 'medium',
    createdAt: '2026-03-01',
    resolverNote: null,
  },
  {
    id: 'NXS-003',
    contractId: 'c_demo3',
    jobTitle: 'SEO content writer – 10 articles/month',
    freelancerName: 'Ethan Mwangi',
    amount: 400,
    reason: 'Work not delivered',
    description: 'Paid for 10 articles. Only 4 were delivered over 3 weeks. Repeated requests for the remaining 6 have been ignored.',
    evidenceCount: 2,
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-01-15',
    resolverNote: 'After reviewing all evidence, NEXUS has determined that a partial refund of $240 will be issued for the 6 undelivered articles. Funds have been released from escrow.',
  },
]

const SEED_TRANSACTIONS = [
  { id:'tx1', type:'deposit',    amount:500,  desc:'Wallet funded',                       date:'2026-02-10', status:'completed' },
  { id:'tx2', type:'escrow',     amount:-120, desc:'Escrow: UI Design project',            date:'2026-02-12', status:'completed' },
  { id:'tx3', type:'release',    amount:120,  desc:'Payment received: UI Design project',  date:'2026-02-14', status:'completed' },
  { id:'tx4', type:'deposit',    amount:300,  desc:'Wallet funded',                        date:'2026-02-15', status:'completed' },
  { id:'tx5', type:'escrow',     amount:-200, desc:'Escrow: React Dashboard',              date:'2026-02-17', status:'pending' },
]

const SEED_CONTRACTS = [
  { id:'c1', jobId:'j1', jobTitle:'Build a SaaS dashboard in React', clientId:'demo', clientName:'Alex Johnson', freelancerId:'f2', freelancerName:'Javier Ruiz', freelancerAvatar:'JR', amount:1200, startDate:'2026-02-17', dueDate:'2026-03-10', status:'active', progress:40, milestones:[{label:'Setup & Architecture',done:true},{label:'Core Components',done:true},{label:'Charts & Data',done:false},{label:'Testing & Delivery',done:false}] },
]

const SEED_NOTIFICATIONS = [
  { id:'n1', text:'Javier Ruiz submitted a proposal on "Build a SaaS dashboard"', read:false, ts:'2026-02-17T09:00:00', link:'/dashboard' },
  { id:'n2', text:'Your project "Brand identity for fintech" has 9 new proposals', read:false, ts:'2026-02-16T14:00:00', link:'/dashboard' },
  { id:'n3', text:'Wallet funded: ₦300 added successfully', read:true,  ts:'2026-02-15T10:00:00', link:'/wallet' },
]

// ── Context ───────────────────────────────────────────────────────────────
const AppContext = createContext(null)

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Firestore collection helpers ──────────────────────────────────────────
async function getAllFreelancers() {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'freelancer')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch { return [] }
}

export function AppProvider({ children }) {
  // ── Firebase auth state — undefined = still resolving ──
  const [firebaseUser, setFirebaseUser] = useState(undefined)
  const isLoading = firebaseUser === undefined

  // ── Core state ──
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUserState] = useState({
    id: null, name: '', avatar: '', role: 'client',
    email: '', memberSince: '',
    bio: '', location: '',
    skills: [], hourlyRate: 0,
  })

  const [wallet,       setWallet]       = useState({ balance:600, escrow:200, earned:120, currency:'NGN' })
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS)
  const [jobs,         setJobs]         = useState(SEED_JOBS)
  const [contracts,    setContracts]    = useState(SEED_CONTRACTS)
  const [proposals,    setProposals]    = useState({})
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS)
  const [freelancers,  setFreelancers]  = useState(SEED_FREELANCERS)
  const [savedJobs,    setSavedJobs]    = useState([])
  const [savedFreelancers, setSavedFreelancers] = useState([])
  const [reviews,      setReviews]      = useState([{ id:'r1', contractId:'c1', fromId:'demo', toId:'f2', rating:5, comment:'Excellent work, very professional. Delivered ahead of schedule.', date:'2026-02-14' }])
  const [threads,      setThreads]      = useState([]) // RTDB threads for contact list
  const [toasts,       setToasts]       = useState([])
  const [disputes,     setDisputes]     = useState(SEED_DISPUTES)

  // ── Track active real-time unsubs ─────────────────────────────────────
  const unsubThreads = useRef(null)
  const unsubNotifs  = useRef(null)

  // ── onAuthStateChanged — runs once on mount ───────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser ?? null)

      if (!fbUser) {
        // Logged out — clear all real user data
        setIsLoggedIn(false)
        setUserState({ id: null, name: '', avatar: '', role: 'client', email: '', memberSince: '', bio: '', location: '', skills: [], hourlyRate: 0 })
        setWallet({ balance: 0, escrow: 0, earned: 0, currency: 'NGN' })
        setTransactions([])
        setJobs(SEED_JOBS)          // keep seed jobs so Browse page has content
        setContracts([])
        setProposals({})
        setNotifications([])
        setFreelancers(SEED_FREELANCERS)
        setSavedJobs([])
        setSavedFreelancers([])
        setReviews([])
        setThreads([])
        setDisputes([])
        if (unsubThreads.current) { unsubThreads.current(); unsubThreads.current = null }
        if (unsubNotifs.current)  { unsubNotifs.current();  unsubNotifs.current  = null }
        return
      }

      // ── Load user data from Firestore ──
      try {
        const userSnap = await getDoc(doc(db, 'users', fbUser.uid))
        if (userSnap.exists()) {
          const d = userSnap.data()
          setUserState({
            id:          fbUser.uid,
            name:        d.name        || fbUser.displayName || fbUser.email.split('@')[0],
            avatar:      d.avatar      || initials(d.name || fbUser.displayName || fbUser.email),
            role:        d.role        || 'client',
            email:       fbUser.email,
            memberSince: d.memberSince?.toDate?.()?.toLocaleDateString('en-US', { month:'long', year:'numeric' }) || 'March 2026',
            bio:         d.bio         || '',
            location:    d.location    || '',
            skills:      d.skills      || [],
            hourlyRate:  d.hourlyRate  || 0,
            rating:      d.rating      || 0,
            reviewCount: d.reviewCount || 0,
            completedJobs: d.completedJobs || 0,
          })
        } else {
          // No Firestore doc (rules may be locked) — build from Auth data
          const emailName = fbUser.email?.split('@')[0] || 'User'
          const displayName = fbUser.displayName || emailName
          setUserState({
            id:           fbUser.uid,
            name:         displayName,
            avatar:       initials(displayName),
            role:         'client',
            email:        fbUser.email,
            memberSince:  new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' }),
            bio:          '',
            location:     '',
            skills:       [],
            hourlyRate:   0,
            rating:       0,
            reviewCount:  0,
            completedJobs: 0,
          })
        }
      } catch (e) {
        // Firestore read failed (rules / offline) — use Auth data
        console.warn('[NEXUS] Could not load user profile from Firestore:', e.message)
        const emailName = fbUser.email?.split('@')[0] || 'User'
        const displayName = fbUser.displayName || emailName
        setUserState({
          id:          fbUser.uid,
          name:        displayName,
          avatar:      initials(displayName),
          role:        'client',
          email:       fbUser.email,
          memberSince: new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' }),
          bio: '', location: '', skills: [], hourlyRate: 0,
          rating: 0, reviewCount: 0, completedJobs: 0,
        })
      }


      // ── Load wallet ──
      try {
        const walletSnap = await getDoc(doc(db, 'wallets', fbUser.uid))
        if (walletSnap.exists()) setWallet(walletSnap.data())
      } catch (e) { console.warn('Error loading wallet:', e) }

      // ── Load jobs ──
      try {
        const jobsSnap = await getDocs(collection(db, 'jobs'))
        const fsJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (fsJobs.length > 0) setJobs(fsJobs); else setJobs(SEED_JOBS)
      } catch { setJobs(SEED_JOBS) }

      // ── Load contracts for this user ──
      try {
        const [asClient, asFreelancer] = await Promise.all([
          getDocs(query(collection(db, 'contracts'), where('clientId',     '==', fbUser.uid))),
          getDocs(query(collection(db, 'contracts'), where('freelancerId', '==', fbUser.uid))),
        ])
        const all = [
          ...asClient.docs.map(d => ({ id: d.id, ...d.data() })),
          ...asFreelancer.docs.map(d => ({ id: d.id, ...d.data() })),
        ]
        const unique = all.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
        if (unique.length > 0) setContracts(unique); else setContracts(SEED_CONTRACTS)
      } catch { setContracts(SEED_CONTRACTS) }

      // ── Load & real-time listen to notifications ──
      try {
        if (unsubNotifs.current) unsubNotifs.current()
        const notifsQ = query(
          collection(db, 'notifications'),
          where('userId', '==', fbUser.uid),
          orderBy('ts', 'desc')
        )
        unsubNotifs.current = onSnapshot(notifsQ, snap => {
          const fsNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          if (fsNotifs.length > 0) setNotifications(fsNotifs)
          else setNotifications(SEED_NOTIFICATIONS)
        })
      } catch { setNotifications(SEED_NOTIFICATIONS) }

      // ── Load freelancers list ──
      try {
        const fsFreelancers = await getAllFreelancers()
        if (fsFreelancers.length > 0) setFreelancers(fsFreelancers)
        else setFreelancers(SEED_FREELANCERS)
      } catch { setFreelancers(SEED_FREELANCERS) }

      // ── Real-time RTDB thread listener (for contact list) ──
      if (unsubThreads.current) unsubThreads.current()
      unsubThreads.current = subscribeToThreads(fbUser.uid, setThreads)

      setIsLoggedIn(true)
    })

    return () => {
      unsub()
      if (unsubThreads.current) unsubThreads.current()
      if (unsubNotifs.current)  unsubNotifs.current()
    }
  }, [])

  // ── Toast ──────────────────────────────────────────────────────────────
  function dismissToast(id) {
    setToasts(p => p.filter(t => t.id !== id))
  }

  function toast(message, type = 'success') {
    const id = uid()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => dismissToast(id), 3500)
  }

  // ── Notifications ──────────────────────────────────────────────────────
  function addNotif(text, link = '/dashboard') {
    const n = { id: uid(), text, read: false, ts: new Date().toISOString(), link }
    setNotifications(p => [n, ...p])
    // Write to Firestore if logged in
    if (firebaseUser) {
      addDoc(collection(db, 'notifications'), {
        userId: firebaseUser.uid, text, read: false,
        ts: serverTimestamp(), link
      }).catch(() => {})
    }
  }

  const unreadNotifCount = notifications.filter(n => !n.read).length

  function markNotifsRead() {
    setNotifications(p => p.map(n => ({ ...n, read: true })))
  }

  function clearNotif(id) {
    setNotifications(p => p.filter(n => n.id !== id))
  }

  // ── Auth actions ───────────────────────────────────────────────────────
  // (login/signup kept in context for backward-compat; Auth.jsx calls authService directly)
  async function login(email, password) {
    const { logIn } = await import('../firebase/authService')
    await logIn(email, password)
    toast('Welcome back!')
    return { success: true }
  }

  async function signup(name, email, password, role) {
    const { signUp } = await import('../firebase/authService')
    await signUp(name, email, password, role)
    toast(`Welcome to NEXUS, ${name.split(' ')[0]}!`)
    return { success: true }
  }

  async function logout() {
    try { await signOut(auth) } catch {}
    toast('Logged out successfully')
  }

  function updateUser(data) {
    const updated = { ...user, ...data }
    setUserState(updated)
    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid), data, { merge: true }).catch(() => {})
    }
    toast('Profile updated')
  }

  function switchRole() {
    const newRole = user.role === 'client' ? 'freelancer' : 'client'
    updateUser({ role: newRole })
    toast(`Switched to ${newRole} mode`)
  }

  // ── Wallet ─────────────────────────────────────────────────────────────
  function persistWallet(updated) {
    setWallet(updated)
    if (firebaseUser) {
      setDoc(doc(db, 'wallets', firebaseUser.uid), updated, { merge: true }).catch(() => {})
    }
  }

  function depositFunds(amount) {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    persistWallet({ ...wallet, balance: +(wallet.balance + amt).toFixed(2) })
    setTransactions(p => [{ id:uid(), type:'deposit', amount:amt, desc:'Wallet funded', date:today(), status:'completed' }, ...p])
    addNotif(`₦${amt.toFixed(2)} added to your wallet`, '/wallet')
    toast(`₦${amt.toFixed(2)} added to wallet`)
  }

  function withdrawFunds(amount) {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    if (amt > wallet.balance) { toast('Insufficient balance', 'error'); return }
    persistWallet({ ...wallet, balance: +(wallet.balance - amt).toFixed(2) })
    setTransactions(p => [{ id:uid(), type:'withdrawal', amount:-amt, desc:'Funds withdrawn', date:today(), status:'completed' }, ...p])
    toast(`₦${amt.toFixed(2)} withdrawn`)
  }

  function fundEscrow(jobId, amount, jobTitle) {
    const amt = parseFloat(amount)
    if (amt > wallet.balance) { toast('Insufficient balance to fund escrow', 'error'); return false }
    persistWallet({ ...wallet, balance: +(wallet.balance - amt).toFixed(2), escrow: +(wallet.escrow + amt).toFixed(2) })
    setTransactions(p => [{ id:uid(), type:'escrow', amount:-amt, desc:`Escrow: ${jobTitle}`, date:today(), status:'pending' }, ...p])
    toast(`₦${amt.toFixed(2)} held in escrow`)
    return true
  }

  function releaseEscrow(amount, jobTitle, contractId) {
    const amt = parseFloat(amount)
    persistWallet({ ...wallet, escrow: +Math.max(0, wallet.escrow - amt).toFixed(2), earned: +(wallet.earned + amt).toFixed(2) })
    setTransactions(p => [{ id:uid(), type:'release', amount:amt, desc:`Payment released: ${jobTitle}`, date:today(), status:'completed' }, ...p])
    if (contractId) {
      setContracts(p => p.map(c => c.id === contractId ? { ...c, status:'completed', completedDate:today() } : c))
    }
    addNotif(`₦${amt.toFixed(2)} released for "${jobTitle}"`, '/wallet')
    toast(`₦${amt.toFixed(2)} released to freelancer`)
  }

  // ── Jobs ───────────────────────────────────────────────────────────────
  function postJob(jobData) {
    const job = { id:`j${uid()}`, ...jobData, posted:'Just now', proposals:0, clientId: user.id, status:'open' }
    setJobs(p => [job, ...p])
    if (firebaseUser) {
      addDoc(collection(db, 'jobs'), { ...job, clientId: firebaseUser.uid, createdAt: serverTimestamp() }).catch(() => {})
    }
    addNotif(`"${job.title}" is live — students can now apply.`, `/job/${job.id}`)
    toast(`"${job.title}" posted!`)
    return job
  }

  function updateJobStatus(jobId, status) {
    setJobs(p => p.map(j => j.id === jobId ? { ...j, status } : j))
  }

  // ── Proposals ──────────────────────────────────────────────────────────
  function submitProposal(jobId, data) {
    const p = { id:`p${uid()}`, ...data, freelancer:user, status:'pending', submittedAt:new Date().toISOString() }
    setProposals(prev => ({ ...prev, [jobId]: [...(prev[jobId]||[]), p] }))
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, proposals: j.proposals + 1 } : j))
    toast('Proposal submitted!')
  }

  function acceptProposal(jobId, proposalId, amount, freelancer) {
    setProposals(prev => ({
      ...prev,
      [jobId]: prev[jobId].map(p => p.id === proposalId ? { ...p, status:'accepted' } : p),
    }))
    const job = jobs.find(j => j.id === jobId)
    fundEscrow(jobId, amount, job?.title || 'Project')
    updateJobStatus(jobId, 'in_progress')

    const contract = {
      id: `c${uid()}`,
      jobId,
      jobTitle:         job?.title || 'Project',
      clientId:         user.id,
      clientName:       user.name,
      freelancerId:     freelancer.id || 'f_unknown',
      freelancerName:   freelancer.name,
      freelancerAvatar: freelancer.avatar,
      amount,
      startDate:        today(),
      dueDate:          '',
      status:           'active',
      progress:         0,
      milestones: [
        { label:'Kick-off & planning', done:false },
        { label:'First deliverable',   done:false },
        { label:'Revisions',           done:false },
        { label:'Final delivery',      done:false },
      ],
    }
    setContracts(p => [contract, ...p])
    if (firebaseUser) {
      addDoc(collection(db, 'contracts'), { ...contract, createdAt: serverTimestamp() }).catch(() => {})
    }
    addNotif(`Contract started with ${freelancer.name} for "${job?.title}"`, '/contracts')
    toast(`Contract started with ${freelancer.name}`)
  }

  function updateContractProgress(contractId, progress) {
    setContracts(p => p.map(c => c.id === contractId ? { ...c, progress } : c))
  }

  function toggleMilestone(contractId, idx) {
    setContracts(p => p.map(c => {
      if (c.id !== contractId) return c
      const milestones = c.milestones.map((m,i) => i===idx ? {...m,done:!m.done} : m)
      const progress = Math.round((milestones.filter(m=>m.done).length / milestones.length) * 100)
      return { ...c, milestones, progress }
    }))
  }

  function markContractComplete(contractId) {
    setContracts(p => p.map(c => c.id === contractId ? { ...c, status: 'pending_approval' } : c))
    const contract = contracts.find(c => c.id === contractId)
    if (contract) {
      addNotif(`"${contract.jobTitle}" has been marked complete by the freelancer. Please review and release payment.`, '/contracts')
      toast('Work submitted — awaiting client approval')
    }
  }

  // ── Messages — legacy local helpers (Messages.jsx uses messageService directly) ────
  function getThreadKey(id1, id2) {
    return [id1, id2].sort().join('_')
  }

  // sendMessage is now handled by messageService.js in Messages.jsx
  // kept here as a no-op stub so legacy callers don't crash
  function sendMessage(toId, text) {
    console.warn('AppContext.sendMessage is deprecated. Use messageService.sendMessage instead.')
  }

  function getThread(otherId) {
    return [] // real-time data lives in Messages.jsx via subscribeToThread
  }

  function getContacts() {
    // Build contacts list from RTDB threads (set by subscribeToThreads in useEffect)
    return threads.map(t => ({
      id:      t.otherId,
      name:    t.otherName   || `User ${t.otherId?.slice(0, 6)}`,
      avatar:  t.otherAvatar || t.otherId?.slice(0, 2).toUpperCase(),
      title:   '',
      lastMsg: t.lastText ? {
        senderId: t.lastSenderId,
        text:     t.lastText,
        ts:       t.lastTimestamp,
      } : null,
      unread:  t.unread || 0,
    }))
  }

  // ── Saved ──────────────────────────────────────────────────────────────
  function toggleSaveJob(jobId) {
    setSavedJobs(p => p.includes(jobId) ? p.filter(id=>id!==jobId) : [...p, jobId])
  }

  function toggleSaveFreelancer(fId) {
    setSavedFreelancers(p => p.includes(fId) ? p.filter(id=>id!==fId) : [...p, fId])
  }

  // ── Reviews ────────────────────────────────────────────────────────────
  function submitReview(contractId, toId, rating, comment) {
    const r = { id:uid(), contractId, fromId:user.id, toId, rating, comment, date:today() }
    setReviews(p => [r, ...p])
    toast('Review submitted!')
  }

  // ── Disputes ───────────────────────────────────────────────────────────
  function submitDispute({ contractId, jobTitle, freelancerName, amount, reason, description, evidenceCount }) {
    // Use functional update to avoid stale closure on disputes.length
    let createdTicket = null
    setDisputes(prev => {
      const ticketNum = String(prev.length + 4).padStart(3, '0')
      const ticket = {
        id:             `NXS-${ticketNum}`,
        contractId,
        jobTitle,
        freelancerName,
        amount,
        reason,
        description,
        evidenceCount,
        status:         'open',
        priority:       'high',
        createdAt:      today(),
        resolverNote:   null,
      }
      createdTicket = ticket
      return [ticket, ...prev]
    })
    // Mark contract as disputed
    setContracts(p => p.map(c => c.id === contractId ? { ...c, status: 'disputed' } : c))
    // Persist dispute to Firestore if logged in
    if (firebaseUser) {
      import('firebase/firestore').then(({ addDoc, collection, serverTimestamp }) => {
        addDoc(collection(db, 'disputes'), {
          contractId, jobTitle, freelancerName, amount, reason, description, evidenceCount,
          userId: firebaseUser.uid, status: 'open', priority: 'high',
          createdAt: serverTimestamp(),
        }).catch(() => {})
      })
    }
    setTimeout(() => {
      if (createdTicket) {
        addNotif(`Dispute ticket ${createdTicket.id} filed for "${jobTitle}". Our team will review within 48 hours.`, '/support')
        toast('Dispute submitted — ticket ID: ' + createdTicket.id)
      }
    }, 0)
    return createdTicket
  }

  return (
    <AppContext.Provider value={{
      // loading gate
      isLoading,
      // auth
      isLoggedIn, user, setUser: setUserState, login, signup, logout, updateUser, switchRole,
      authLoading: isLoading,
      firebaseUser,
      // wallet
      wallet, transactions, depositFunds, withdrawFunds, fundEscrow, releaseEscrow,
      // jobs
      jobs, postJob, updateJobStatus,
      // proposals
      proposals, submitProposal, acceptProposal,
      // contracts
      contracts, updateContractProgress, toggleMilestone, markContractComplete, releaseEscrow,
      // messages (legacy surface — Messages.jsx uses messageService directly)
      sendMessage, getThread, getContacts,
      // notifications
      notifications, unreadNotifCount, markNotifsRead, clearNotif, addNotif,
      // saved
      savedJobs, savedFreelancers, toggleSaveJob, toggleSaveFreelancer,
      // reviews
      reviews, submitReview,
      // disputes
      disputes, submitDispute,
      // freelancers data
      freelancers,
      // toast
      toast, toasts, dismissToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
