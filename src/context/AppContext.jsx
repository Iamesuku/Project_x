import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, addDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, deleteDoc
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

// ── Nigerian demo data (in-memory fallback for Browse & Jobs pages) ─────────
const SEED_FREELANCERS = [
  { id:'f1',  name:'Chioma Obi',       avatar:'CO', title:'UI/UX Designer',          role:'freelancer', rate:4500, rating:4.9, reviews:112, skills:['Figma','Prototyping','User Research','Design Systems'],             bio:'400-level Mass Communication student at UNILAG with a passion for interface design. I have designed apps for 3 student startups and 2 faculty portals.',                               location:'Lagos (UNILAG)',    completedJobs:76,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-09-01' },
  { id:'f2',  name:'Emeka Nwosu',       avatar:'EN', title:'Full-Stack Developer',    role:'freelancer', rate:6500, rating:4.8, reviews:189, skills:['React','Node.js','PostgreSQL','Firebase'],                        bio:'Final-year Computer Science student at UNILAG. I build production-ready web apps. Delivered 8+ campus projects including the Faculty of Engineering student portal and alumni platform.',         location:'Lagos (UNILAG)',       completedJobs:134, category:'Development & IT',  emailVerified:true, memberSince:'2025-08-15' },
  { id:'f3',  name:'Fatimah Bello',     avatar:'FB', title:'Brand Strategist',        role:'freelancer', rate:3500, rating:5.0, reviews:58,  skills:['Brand Identity','Copywriting','Strategy','Positioning'],          bio:'Business Administration student at UNILAG. Former brand coordinator for the UNILAG Entrepreneur Society. I help student businesses build brands that get noticed on campus and beyond.',           location:'Lagos (UNILAG)',       completedJobs:47,  category:'Sales & Marketing', emailVerified:true, memberSince:'2025-10-01' },
  { id:'f4',  name:'Olumide Adeyemi',   avatar:'OA', title:'Motion Designer',         role:'freelancer', rate:3000, rating:4.7, reviews:84,  skills:['After Effects','Premiere Pro','Lottie','Cinema 4D'],              bio:'Fine Arts student at UNILAG. I create motion graphics for campus events and student brands. Worked on visuals for UNILAG Tech Festival and Faculty of Arts end-of-year cultural shows.',                         location:'Lagos (UNILAG)',     completedJobs:63,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-07-10' },
  { id:'f5',  name:'Amina Garba',       avatar:'AG', title:'Data Analyst',            role:'freelancer', rate:4000, rating:4.9, reviews:49,  skills:['Python','R','Tableau','SQL'],                                     bio:'Statistics student at UNILAG. I help fellow students and research teams clean and visualize data for final-year projects. Proficient in SPSS, R, and Tableau for academic work.',          location:'Lagos (UNILAG)',        completedJobs:35,  category:'Development & IT',  emailVerified:true, memberSince:'2025-09-10' },
  { id:'f6',  name:'Chukwuemeka Eze',   avatar:'CE', title:'SEO Copywriter',          role:'freelancer', rate:2500, rating:4.6, reviews:156, skills:['SEO Writing','Content Strategy','Email Marketing','Copywriting'],  bio:'English Literature student at UNILAG. I write content that ranks and converts. 40+ articles published for Nigerian startup blogs with measurable traffic growth in every engagement.',   location:'Lagos (UNILAG)',    completedJobs:143, category:'Writing & Translation', emailVerified:true, memberSince:'2025-06-20' },
  { id:'f7',  name:'Ngozi Okafor',      avatar:'NO', title:'Mobile Developer',        role:'freelancer', rate:7000, rating:4.8, reviews:72,  skills:['Flutter','React Native','Kotlin','Firebase'],                     bio:'Computer Science student at UNILAG. Creator of UniGig, a campus task platform with 400+ signups. I build iOS and Android apps from scratch to production launch.',  location:'Lagos (UNILAG)',      completedJobs:58,  category:'Development & IT',  emailVerified:true, memberSince:'2025-08-01' },
  { id:'f8',  name:'Ibrahim Danjuma',   avatar:'ID', title:'Financial Analyst',       role:'freelancer', rate:5000, rating:5.0, reviews:37,  skills:['Financial Modeling','Excel','FP&A','PowerPoint'],                 bio:'Accounting student at UNILAG and ICAN student member. I build financial models and pitch decks for campus entrepreneurs. Helped 4 UNILAG startups secure grant and competition funding.',                    location:'Lagos (UNILAG)',       completedJobs:28,  category:'Finance & Accounting', emailVerified:true, memberSince:'2025-10-05' },
  { id:'f9',  name:'Segun Afolabi',     avatar:'SA', title:'DevOps Engineer',         role:'freelancer', rate:5500, rating:4.8, reviews:56,  skills:['AWS','Docker','Terraform','Linux'],                               bio:'Computer Engineering student at UNILAG. AWS certified. I set up cloud infrastructure and CI/CD pipelines for campus project teams and student startup MVPs that need to scale.',          location:'Lagos (UNILAG)', completedJobs:44,  category:'Development & IT',  emailVerified:true, memberSince:'2025-07-25' },
  { id:'f10', name:'Adaobi Nwofor',     avatar:'AN', title:'Legal Consultant',        role:'freelancer', rate:8000, rating:4.9, reviews:26,  skills:['Contract Law','IP','Business Law','Compliance'],                  bio:'LLB Law student, University of Lagos. I help student businesses draft contracts, register with the CAC, and protect their intellectual property. First 30-minute consultation is free.', location:'Lagos (UNILAG)',    completedJobs:21,  category:'Legal',               emailVerified:true, memberSince:'2025-11-01' },
  { id:'f11', name:'Taiwo Adeleke',     avatar:'TA', title:'Academic Tutor',          role:'freelancer', rate:2000, rating:4.8, reviews:31,  skills:['Mathematics','Statistics','Physics','Further Maths'],             bio:'400-level Mathematics student at UNILAG. I tutor 100-200 level students in MTH and STA courses on campus. Flexible schedule, patient style, strong pass-rate record.',        location:'Lagos (UNILAG)',     completedJobs:25,  category:'Academic Support',  emailVerified:true, memberSince:'2025-09-15' },
  { id:'f12', name:'Blessing Okeke',    avatar:'BO', title:'Campus Photographer',     role:'freelancer', rate:2500, rating:4.9, reviews:18,  skills:['Event Photography','Portrait','Lightroom','Adobe Express'],       bio:'Mass Communication student at UNILAG. I cover departmental dinners, convocations, graduations, and portrait sessions. Professionally edited photos delivered within 48 hours.',        location:'Lagos (UNILAG)',    completedJobs:14,  category:'Photography',       emailVerified:true, memberSince:'2025-10-10' },
  { id:'f13', name:'Kelechi Eze',       avatar:'KE', title:'Social Media Manager',    role:'freelancer', rate:3000, rating:4.7, reviews:11,  skills:['Instagram','TikTok','Canva','Content Calendar'],                  bio:'Marketing student at UNILAG. I manage Instagram and TikTok for 4 faculty associations and 2 student clubs on campus. Average 35% engagement growth in the first month.',   location:'Lagos (UNILAG)',      completedJobs:9,   category:'Sales & Marketing', emailVerified:true, memberSince:'2025-11-05' },
  { id:'f14', name:'Tunde Fashola',     avatar:'TF', title:'Video Editor',            role:'freelancer', rate:2000, rating:4.6, reviews:20,  skills:['Premiere Pro','DaVinci Resolve','After Effects','CapCut'],        bio:'Theatre Arts student at UNILAG. I edit event recap videos, vlogs, and social content. Experienced covering UNILAG drama festivals, faculty shows, and departmental events.',  location:'Lagos (UNILAG)',       completedJobs:16,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-09-20' },
]
SEED_FREELANCERS.forEach(f => { f.isDemo = true })

const SEED_JOBS = [
  { id:'j1',  title:'Student portal for EESA — Electrical Engineering Student Association, UNILAG',   category:'Development & IT',     budget:120000, type:'Fixed',  posted:'2 days ago',   proposals:8,  description:'We need a web portal for 400+ members of EESA at UNILAG. Features: member registration, event calendar, photo gallery, Paystack dues payment integration, and an admin dashboard. Must be mobile-friendly and performant. Figma mockups will be shared with the selected freelancer.', skills:['React','Node.js','Firebase','Paystack API'], status:'open', duration:'4-6 weeks' },
  { id:'j2',  title:'Brand identity for Ajo Digital — campus peer-to-peer savings app (UNILAG)',        category:'Design & Creative',    budget:75000,  type:'Fixed',  posted:'1 day ago',    proposals:5,  description:'We are launching Ajo Digital, a peer-to-peer savings app for UNILAG students. We need a full brand identity: logo, color palette, typography guide, social media templates, and a pitch deck cover design. The target audience is Nigerian students aged 18-25. Our current tagline is Save Together, Grow Together.', skills:['Branding','Figma','Logo Design','Illustration'], status:'open', duration:'2 weeks' },
  { id:'j3',  title:'SEO content writer for StudentMoney.ng — 8 personal finance articles',           category:'Writing & Translation', budget:2500,   type:'Hourly', posted:'5 hours ago',  proposals:14, description:'StudentMoney.ng is a personal finance blog for Nigerian university students. We need 8 articles covering: NYSC allowance budgeting, best student investment apps in Nigeria, campus side hustle ideas, and bank account comparison for students. Minimum 1,200 words each, SEO-optimised with target keywords supplied.', skills:['SEO Writing','Copywriting','Personal Finance'], status:'open', duration:'3 weeks' },
  { id:'j4',  title:'Data analysis for UNILAG Economics final year project on mobile money adoption',      category:'Development & IT',     budget:35000,  type:'Fixed',  posted:'4 days ago',   proposals:4,  description:'I am a 400-level Economics student at UNILAG writing my FYP on mobile money adoption among Nigerian university students. I have 200+ survey responses from Google Forms that need analysis. The data analyst will clean the data, run descriptive and regression analysis in SPSS or R, and produce well-formatted charts ready for insertion into my project report.', skills:['SPSS','R','Statistics','Data Visualization'], status:'open', duration:'1 week' },
  { id:'j5',  title:'Promo graphics for CSSA UNILAG end-of-semester party — theme: Neon Nights',        category:'Design & Creative',    budget:25000,  type:'Fixed',  posted:'8 hours ago',  proposals:11, description:'The Computer Science Student Association, UNILAG is hosting its annual end-of-semester party with the theme Neon Nights. Deliverables: digital and print event flyer, Instagram post (1080x1080), WhatsApp story template (1080x1920), and a ticket design. All files delivered in editable Canva or Figma format plus print-ready PDF.', skills:['Graphic Design','Canva','Photoshop','Figma'], status:'open', duration:'3 days' },
  { id:'j6',  title:'3-year financial model for FoodCourt startup — Tony Elumelu Foundation pitch',    category:'Finance & Accounting', budget:45000,  type:'Fixed',  posted:'1 day ago',    proposals:3,  description:'We are pitching FoodCourt (an on-campus food ordering startup) to the Tony Elumelu Foundation grant programme. We need a 3-year financial model with revenue projections, cost structure, break-even analysis, unit economics, and key startup KPIs in Excel or Google Sheets. We will provide our existing figures and business assumptions.', skills:['Financial Modeling','Excel','Startup Finance','FP&A'], status:'open', duration:'5 days' },
  { id:'j7',  title:'UI/UX design for CampusEats food delivery mobile app — UNILAG Campus',               category:'Design & Creative',    budget:85000,  type:'Fixed',  posted:'6 hours ago',  proposals:6,  description:'CampusEats is building a mobile food-delivery app specifically for UNILAG campus. We need UI/UX designs for: splash screen, onboarding flow, restaurant listing, food item detail page, cart, checkout, and live order tracking. Deliverable: complete Figma file with components, auto-layout, and a clickable high-fidelity prototype.', skills:['Figma','Mobile UI','UX Design','Prototyping'], status:'open', duration:'2 weeks' },
  { id:'j8',  title:'Legal review of NAPS UNILAG constitution and pharmaceutical company MoU',        category:'Legal',                budget:30000,  type:'Fixed',  posted:'3 days ago',   proposals:2,  description:'The UNILAG chapter of the National Association of Pharmacy Students is finalising its new constitution and an MoU with a pharmaceutical company for a research grant partnership. We need a law student to review both documents, identify any clauses that expose the association to liability, and suggest clear revisions. Required turnaround: 5 working days.', skills:['Contract Law','Legal Drafting','Business Law'], status:'open', duration:'1 week' },
  { id:'j9',  title:'MTH 101 and STA 101 tutor needed — 100-level Engineering student, UNILAG',         category:'Academic Support',     budget:2000,   type:'Hourly', posted:'2 days ago',   proposals:5,  description:'I am a 100-level Engineering student at UNILAG struggling with MTH 101 (Calculus I) and STA 101 (Probability and Statistics). I need an experienced tutor who can explain concepts clearly, work through past exam questions with me, and help me prepare for my semester tests. I prefer Zoom or in-library sessions, twice per week.', skills:['Calculus','Statistics','Mathematics','Teaching'], status:'open', duration:'4 weeks' },
  { id:'j10', title:'Photographer for Chemical Engineering convocation dinner — University of Lagos (UNILAG)', category:'Photography',           budget:50000,  type:'Fixed',  posted:'10 hours ago', proposals:4,  description:'The Department of Chemical Engineering, University of Lagos is hosting its convocation dinner for the graduating class of 2026. We need a professional photographer for the full 4-hour event: arrival shots, award ceremony, dinner service, group photographs, and candid moments. Venue is the UNILAG Staff Club. Edited and colour-graded photos to be delivered within 72 hours.', skills:['Event Photography','Lightroom','Portrait','Photo Editing'], status:'open', duration:'1 evening' },
  { id:'j11', title:'Social media manager for UNILAG Student Union Government — 2-month contract',       category:'Sales & Marketing',    budget:80000,  type:'Fixed',  posted:'1 day ago',    proposals:7,  description:'The Student Union Government, UNILAG needs a social media manager for our official Instagram and X (Twitter) accounts over 2 months. Responsibilities include: 5 posts per week, managing DMs and comments, live coverage of SUG events, and bi-weekly analytics reports presented to the PRO. Content ideas will be provided. Candidate must understand Nigerian campus culture.', skills:['Instagram','Twitter/X','Content Creation','Canva'], status:'open', duration:'2 months' },
]
// Flag seed jobs so the app can block proposals to them
SEED_JOBS.forEach(j => { j.isDemo = true; j.clientId = '_nexus_demo_' })

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
    resolverNote: 'After reviewing all evidence, NEXUS has determined that a partial refund of ₦240 will be issued for the 6 undelivered articles. Funds have been released from escrow.',
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
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
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
  const unsubJobs    = useRef(null)
  const unsubContracts = useRef(null)
  const unsubProposals = useRef(null)

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
        if (unsubJobs.current)    { unsubJobs.current();    unsubJobs.current    = null }
        if (unsubContracts.current) { unsubContracts.current(); unsubContracts.current = null }
        if (unsubProposals.current) { unsubProposals.current(); unsubProposals.current = null }
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
            isAdmin:     d.isAdmin     || d.role === 'admin' || false,
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

      // ── Load jobs real-time ──
      try {
        if (unsubJobs.current) unsubJobs.current()
        unsubJobs.current = onSnapshot(collection(db, 'jobs'), snap => {
          const fsJobs = snap.docs.map(d => ({ ...d.data(), id: d.id }))
          if (fsJobs.length > 0) {
            setJobs(fsJobs)
          } else {
            setJobs(SEED_JOBS)
          }
        })
      } catch (e) { 
        console.warn('Error loading jobs:', e)
        setJobs(SEED_JOBS)
      }

      // ── Load proposals real-time (two queries avoid composite index requirement) ──
      try {
        if (unsubProposals.current) unsubProposals.current()
        const raw = { client: [], freelancer: [] }
        function mergeProposals() {
          const seen = new Set()
          const all  = [...raw.client, ...raw.freelancer].filter(p => {
            if (seen.has(p.id)) return false
            seen.add(p.id); return true
          })
          const map = {}
          all.forEach(p => { if (!map[p.jobId]) map[p.jobId] = []; map[p.jobId].push(p) })
          setProposals(map)
        }
        const unsubC = onSnapshot(
          query(collection(db, 'proposals'), where('clientId',     '==', fbUser.uid)),
          s => { raw.client     = s.docs.map(d => ({ ...d.data(), id: d.id })); mergeProposals() }
        )
        const unsubF = onSnapshot(
          query(collection(db, 'proposals'), where('freelancerId', '==', fbUser.uid)),
          s => { raw.freelancer = s.docs.map(d => ({ ...d.data(), id: d.id })); mergeProposals() }
        )
        unsubProposals.current = () => { unsubC(); unsubF() }
      } catch (e) {
        console.warn('Error loading proposals:', e)
        setProposals({})
      }

      // ── Load contracts real-time (two queries to avoid composite index) ──
      try {
        if (unsubContracts.current) unsubContracts.current()
        const rawC = { asClient: [], asFreelancer: [] }
        function mergeContracts() {
          const seen = new Set()
          const all  = [...rawC.asClient, ...rawC.asFreelancer].filter(c => {
            if (seen.has(c.id)) return false
            seen.add(c.id); return true
          })
          setContracts(all)
        }
        const unsubCC = onSnapshot(
          query(collection(db, 'contracts'), where('clientId',     '==', fbUser.uid)),
          s => { rawC.asClient     = s.docs.map(d => ({ ...d.data(), id: d.id })); mergeContracts() }
        )
        const unsubCF = onSnapshot(
          query(collection(db, 'contracts'), where('freelancerId', '==', fbUser.uid)),
          s => { rawC.asFreelancer = s.docs.map(d => ({ ...d.data(), id: d.id })); mergeContracts() }
        )
        unsubContracts.current = () => { unsubCC(); unsubCF() }
      } catch (e) {
        console.warn('Error loading contracts:', e)
        setContracts([])
      }

      // ── Load & real-time listen to notifications ──
      try {
        if (unsubNotifs.current) unsubNotifs.current()
        const notifsQ = query(
          collection(db, 'notifications'),
          where('userId', '==', fbUser.uid)
        )
        unsubNotifs.current = onSnapshot(notifsQ, snap => {
          const fsNotifs = snap.docs.map(d => ({ ...d.data(), id: d.id }))
          fsNotifs.sort((a, b) => (b.ts || 0) - (a.ts || 0))
          setNotifications(fsNotifs)
        })
      } catch { setNotifications([]) }

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
      if (unsubJobs.current)    unsubJobs.current()
      if (unsubContracts.current) unsubContracts.current()
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
      if (firebaseUser) {
        // Persist contract completion
        updateDoc(doc(db, 'contracts', contractId), { status: 'completed', completedDate: today() }).catch(() => {})
        // Credit the freelancer's wallet in Firestore
        const contract = contracts.find(c => c.id === contractId)
        const fId = contract?.freelancerId
        if (fId && !/^f\d+$/.test(fId) && fId !== 'f_unknown') {
          getDoc(doc(db, 'wallets', fId)).then(snap => {
            const fw = snap.exists() ? snap.data() : { balance: 0, escrow: 0, earned: 0, currency: 'NGN' }
            return setDoc(doc(db, 'wallets', fId), {
              ...fw,
              balance: +(fw.balance + amt).toFixed(2),
              earned:  +(fw.earned  + amt).toFixed(2),
            }, { merge: true })
          }).catch(() => {})
          // Notify the freelancer
          addDoc(collection(db, 'notifications'), {
            userId: fId,
            text:   `₦${amt.toFixed(2)} has been released to your wallet for "${jobTitle}".`,
            read:   false,
            ts:     serverTimestamp(),
            link:   '/wallet',
          }).catch(() => {})
        }
      }
    }
    addNotif(`₦${amt.toFixed(2)} released for "${jobTitle}"`, '/wallet')
    toast(`₦${amt.toFixed(2)} released to freelancer`)
  }

  // ── Jobs ───────────────────────────────────────────────────────────────
  function postJob(jobData) {
    const clientId = firebaseUser?.uid || user.id
    const job = { id:`j${uid()}`, ...jobData, posted:'Just now', proposals:0, clientId, status:'open' }
    setJobs(p => [job, ...p])
    if (firebaseUser) {
      setDoc(doc(db, 'jobs', job.id), { ...job, createdAt: serverTimestamp() }).catch(() => {})
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
    const job = jobs.find(j => j.id === jobId)
    if (job?.isDemo) {
      toast('This is a demonstration listing — submit proposals on real posted jobs.', 'error')
      return
    }
    const freelancerId = firebaseUser?.uid || user.id
    const newId = `p${uid()}`
    const p = { id:newId, jobId, ...data, freelancer:{ ...user, id: freelancerId }, freelancerId, status:'pending', submittedAt:new Date().toISOString() }
    const updatedProps = [...(proposals[jobId]||[]), p]
    setProposals(prev => ({ ...prev, [jobId]: updatedProps }))
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, proposals: (j.proposals || 0) + 1 } : j))
    if (firebaseUser) {
      setDoc(doc(db, 'proposals', p.id), { ...p, clientId: job?.clientId || '' }).catch(() => {})
    }
    toast('Proposal submitted!')
  }

  function acceptProposal(jobId, proposalId, amount, freelancer) {
    const updatedProps = (proposals[jobId] || []).map(p => p.id === proposalId ? { ...p, status:'accepted' } : p)
    setProposals(prev => ({ ...prev, [jobId]: updatedProps }))
    const job = jobs.find(j => j.id === jobId)
    fundEscrow(jobId, amount, job?.title || 'Project')
    updateJobStatus(jobId, 'in_progress')

    if (firebaseUser) {
      if (job) {
        updateDoc(doc(db, 'jobs', jobId), { status: 'in_progress' }).catch(() => {})
      }
      updateDoc(doc(db, 'proposals', proposalId), { status: 'accepted' }).catch(() => {})
    }

    const clientId = firebaseUser?.uid || user.id
    const contract = {
      id: `c${uid()}`,
      jobId,
      jobTitle:         job?.title || 'Project',
      clientId,
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
      setDoc(doc(db, 'contracts', contract.id), { ...contract, createdAt: serverTimestamp() }).catch(() => {})
      // Notify the freelancer in Firestore if they have a real Firebase UID (not a seed demo profile)
      const fId = freelancer.id
      if (fId && !/^f\d+$/.test(fId) && fId !== 'f_unknown') {
        addDoc(collection(db, 'notifications'), {
          userId: fId,
          text:   `Your proposal for "${job?.title}" was accepted! A contract has been started.`,
          read:   false,
          ts:     serverTimestamp(),
          link:   '/contracts',
        }).catch(() => {})
      }
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
      isLoggedIn, user, setUser: setUserState, login, signup, logout, updateUser,
      authLoading: isLoading,
      firebaseUser,
      // wallet
      wallet, transactions, depositFunds, withdrawFunds, fundEscrow, releaseEscrow,
      // jobs
      jobs, postJob, updateJobStatus,
      // proposals
      proposals, submitProposal, acceptProposal,
      // contracts
      contracts, updateContractProgress, toggleMilestone, markContractComplete,
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
