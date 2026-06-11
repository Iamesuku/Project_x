// ── Firestore Demo-Data Seeder (UNI Edition) ───────────────────────────────
// Writes Nigerian UNI-focused demo freelancer profiles and job listings to
// Firestore so every user sees them on Browse/Jobs without relying on in-memory
// fallbacks.  All demo records carry  isDemo: true  so the app can block
// proposals on them.  The function is IDEMPOTENT — running it twice is safe.

import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Demo freelancers (14 UNI students across all categories) ──────────────
const DEMO_FREELANCERS = [
  { id:'f1',  name:'Chioma Obi',       avatar:'CO', title:'UI/UX Designer',          role:'freelancer', rate:4500, rating:4.9, reviews:112, skills:['Figma','Prototyping','User Research','Design Systems'],             bio:'400-level Mass Communication student at UNI with a passion for interface design. I have designed apps for 3 student startups and 2 faculty portals.',                               location:'Lagos (UNI)', completedJobs:76,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-09-01' },
  { id:'f2',  name:'Emeka Nwosu',       avatar:'EN', title:'Full-Stack Developer',    role:'freelancer', rate:6500, rating:4.8, reviews:189, skills:['React','Node.js','PostgreSQL','Firebase'],                         bio:'Final-year Computer Science student at UNI. I build production-ready web apps. Delivered 8+ campus projects including the Faculty of Engineering student portal and alumni platform.',  location:'Lagos (UNI)', completedJobs:134, category:'Development & IT',  emailVerified:true, memberSince:'2025-08-15' },
  { id:'f3',  name:'Fatimah Bello',     avatar:'FB', title:'Brand Strategist',        role:'freelancer', rate:3500, rating:5.0, reviews:58,  skills:['Brand Identity','Copywriting','Strategy','Positioning'],           bio:'Business Administration student at UNI. Former brand coordinator for the UNI Entrepreneur Society. I help student businesses build brands that get noticed on campus and beyond.',  location:'Lagos (UNI)', completedJobs:47,  category:'Sales & Marketing', emailVerified:true, memberSince:'2025-10-01' },
  { id:'f4',  name:'Olumide Adeyemi',   avatar:'OA', title:'Motion Designer',         role:'freelancer', rate:3000, rating:4.7, reviews:84,  skills:['After Effects','Premiere Pro','Lottie','Cinema 4D'],               bio:'Fine Arts student at UNI. I create motion graphics for campus events and student brands. Worked on visuals for UNI Tech Festival and Faculty of Arts end-of-year cultural shows.',  location:'Lagos (UNI)', completedJobs:63,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-07-10' },
  { id:'f5',  name:'Amina Garba',       avatar:'AG', title:'Data Analyst',            role:'freelancer', rate:4000, rating:4.9, reviews:49,  skills:['Python','R','Tableau','SQL'],                                      bio:'Statistics student at UNI. I help fellow students and research teams clean and visualize data for final-year projects. Proficient in SPSS, R, and Tableau for academic work.',        location:'Lagos (UNI)', completedJobs:35,  category:'Development & IT',  emailVerified:true, memberSince:'2025-09-10' },
  { id:'f6',  name:'Chukwuemeka Eze',   avatar:'CE', title:'SEO Copywriter',          role:'freelancer', rate:2500, rating:4.6, reviews:156, skills:['SEO Writing','Content Strategy','Email Marketing','Copywriting'],   bio:'English Literature student at UNI. I write content that ranks and converts. 40+ articles published for Nigerian startup blogs with measurable traffic growth in every engagement.',   location:'Lagos (UNI)', completedJobs:143, category:'Writing & Translation', emailVerified:true, memberSince:'2025-06-20' },
  { id:'f7',  name:'Ngozi Okafor',      avatar:'NO', title:'Mobile Developer',        role:'freelancer', rate:7000, rating:4.8, reviews:72,  skills:['Flutter','React Native','Kotlin','Firebase'],                      bio:'Computer Science student at UNI. Creator of UniGig, a campus task platform with 400+ signups. I build iOS and Android apps from scratch to production launch.',                     location:'Lagos (UNI)', completedJobs:58,  category:'Development & IT',  emailVerified:true, memberSince:'2025-08-01' },
  { id:'f8',  name:'Ibrahim Danjuma',   avatar:'ID', title:'Financial Analyst',       role:'freelancer', rate:5000, rating:5.0, reviews:37,  skills:['Financial Modeling','Excel','FP&A','PowerPoint'],                  bio:'Accounting student at UNI and ICAN student member. I build financial models and pitch decks for campus entrepreneurs. Helped 4 UNI startups secure grant and competition funding.',location:'Lagos (UNI)', completedJobs:28,  category:'Finance & Accounting', emailVerified:true, memberSince:'2025-10-05' },
  { id:'f9',  name:'Segun Afolabi',     avatar:'SA', title:'DevOps Engineer',         role:'freelancer', rate:5500, rating:4.8, reviews:56,  skills:['AWS','Docker','Terraform','Linux'],                                bio:'Computer Engineering student at UNI. AWS certified. I set up cloud infrastructure and CI/CD pipelines for campus project teams and student startup MVPs that need to scale.',          location:'Lagos (UNI)', completedJobs:44,  category:'Development & IT',  emailVerified:true, memberSince:'2025-07-25' },
  { id:'f10', name:'Adaobi Nwofor',     avatar:'AN', title:'Legal Consultant',        role:'freelancer', rate:8000, rating:4.9, reviews:26,  skills:['Contract Law','IP','Business Law','Compliance'],                   bio:'LLB Law student at UNI. I help student businesses draft contracts, register with the CAC, and protect their intellectual property. First 30-minute consultation is free.', location:'Lagos (UNI)', completedJobs:21,  category:'Legal',               emailVerified:true, memberSince:'2025-11-01' },
  { id:'f11', name:'Taiwo Adeleke',     avatar:'TA', title:'Academic Tutor',          role:'freelancer', rate:2000, rating:4.8, reviews:31,  skills:['Mathematics','Statistics','Physics','Further Maths'],              bio:'400-level Mathematics student at UNI. I tutor 100-200 level students in MTH and STA courses on campus. Flexible schedule, patient style, strong pass-rate record.',                  location:'Lagos (UNI)', completedJobs:25,  category:'Academic Support',  emailVerified:true, memberSince:'2025-09-15' },
  { id:'f12', name:'Blessing Okeke',    avatar:'BO', title:'Campus Photographer',     role:'freelancer', rate:2500, rating:4.9, reviews:18,  skills:['Event Photography','Portrait','Lightroom','Adobe Express'],        bio:'Mass Communication student at UNI. I cover departmental dinners, convocations, graduations, and portrait sessions. Professionally edited photos delivered within 48 hours.',        location:'Lagos (UNI)', completedJobs:14,  category:'Photography',       emailVerified:true, memberSince:'2025-10-10' },
  { id:'f13', name:'Kelechi Eze',       avatar:'KE', title:'Social Media Manager',    role:'freelancer', rate:3000, rating:4.7, reviews:11,  skills:['Instagram','TikTok','Canva','Content Calendar'],                   bio:'Marketing student at UNI. I manage Instagram and TikTok for 4 faculty associations and 2 student clubs on campus. Average 35% engagement growth in the first month.',                location:'Lagos (UNI)', completedJobs:9,   category:'Sales & Marketing', emailVerified:true, memberSince:'2025-11-05' },
  { id:'f14', name:'Tunde Fashola',     avatar:'TF', title:'Video Editor',            role:'freelancer', rate:2000, rating:4.6, reviews:20,  skills:['Premiere Pro','DaVinci Resolve','After Effects','CapCut'],         bio:'Theatre Arts student at UNI. I edit event recap videos, vlogs, and social content. Experienced covering UNI drama festivals, faculty shows, and departmental events.',             location:'Lagos (UNI)', completedJobs:16,  category:'Design & Creative',    emailVerified:true, memberSince:'2025-09-20' },
]

// ── Demo jobs (11 listings covering every NEXUS category) ─────────────────
const DEMO_JOBS = [
  { id:'j1',  title:'Student portal for EESA — Electrical Engineering Student Association, UNI',   category:'Development & IT',     budget:120000, type:'Fixed',  posted:'2 days ago',   proposals:8,  description:'We need a web portal for 400+ members of EESA at UNI. Features: member registration, event calendar, photo gallery, Paystack dues payment integration, and an admin dashboard. Must be mobile-friendly and performant. Figma mockups will be shared with the selected freelancer.', skills:['React','Node.js','Firebase','Paystack API'], status:'open', duration:'4-6 weeks' },
  { id:'j2',  title:'Brand identity for Ajo Digital — campus peer-to-peer savings app (UNI)',      category:'Design & Creative',    budget:75000,  type:'Fixed',  posted:'1 day ago',    proposals:5,  description:'We are launching Ajo Digital, a peer-to-peer savings app for UNI students. We need a full brand identity: logo, color palette, typography guide, social media templates, and a pitch deck cover design. Target audience: Nigerian students aged 18-25. Tagline: Save Together, Grow Together.', skills:['Branding','Figma','Logo Design','Illustration'], status:'open', duration:'2 weeks' },
  { id:'j3',  title:'SEO content writer for StudentMoney.ng — 8 personal finance articles',           category:'Writing & Translation', budget:2500,   type:'Hourly', posted:'5 hours ago',  proposals:14, description:'StudentMoney.ng is a personal finance blog for Nigerian university students. We need 8 articles covering: NYSC allowance budgeting, best student investment apps in Nigeria, campus side hustle ideas, and bank account comparison for students. Minimum 1,200 words each, SEO-optimised with target keywords supplied.', skills:['SEO Writing','Copywriting','Personal Finance'], status:'open', duration:'3 weeks' },
  { id:'j4',  title:'Data analysis for UNI Economics final year project on mobile money adoption',  category:'Development & IT',     budget:35000,  type:'Fixed',  posted:'4 days ago',   proposals:4,  description:'I am a 400-level Economics student at UNI writing my FYP on mobile money adoption among Nigerian university students. I have 200+ survey responses from Google Forms that need analysis. The analyst will clean the data, run descriptive and regression analysis in SPSS or R, and produce well-formatted charts for my report.', skills:['SPSS','R','Statistics','Data Visualization'], status:'open', duration:'1 week' },
  { id:'j5',  title:'Promo graphics for CSSA UNI end-of-semester party — theme: Neon Nights',      category:'Design & Creative',    budget:25000,  type:'Fixed',  posted:'8 hours ago',  proposals:11, description:'The Computer Science Student Association, UNI is hosting its annual end-of-semester party with the theme Neon Nights. Deliverables: digital and print event flyer, Instagram post (1080x1080), WhatsApp story template (1080x1920), and a ticket design. Files delivered in editable Canva/Figma format plus print-ready PDF.', skills:['Graphic Design','Canva','Photoshop','Figma'], status:'open', duration:'3 days' },
  { id:'j6',  title:'3-year financial model for FoodCourt startup — Tony Elumelu Foundation pitch',   category:'Finance & Accounting', budget:45000,  type:'Fixed',  posted:'1 day ago',    proposals:3,  description:'We are pitching FoodCourt (an on-campus food ordering startup) to the Tony Elumelu Foundation grant programme. We need a 3-year financial model with revenue projections, cost structure, break-even analysis, unit economics, and key startup KPIs in Excel or Google Sheets. We will provide our existing figures and assumptions.', skills:['Financial Modeling','Excel','Startup Finance','FP&A'], status:'open', duration:'5 days' },
  { id:'j7',  title:'UI/UX design for CampusEats food delivery mobile app — UNI Campus',           category:'Design & Creative',    budget:85000,  type:'Fixed',  posted:'6 hours ago',  proposals:6,  description:'CampusEats is building a mobile food-delivery app specifically for UNI campus. We need UI/UX designs for: splash screen, onboarding flow, restaurant listing, food item detail page, cart, checkout, and live order tracking. Deliverable: complete Figma file with components, auto-layout, and a clickable high-fidelity prototype.', skills:['Figma','Mobile UI','UX Design','Prototyping'], status:'open', duration:'2 weeks' },
  { id:'j8',  title:'Legal review of NAPS UNI constitution and pharmaceutical company MoU',        category:'Legal',                budget:30000,  type:'Fixed',  posted:'3 days ago',   proposals:2,  description:'The UNI chapter of the National Association of Pharmacy Students is finalising its new constitution and an MoU with a pharmaceutical company for a research grant partnership. We need a law student to review both documents, identify liability-exposing clauses, and suggest clear revisions. Turnaround: 5 working days.', skills:['Contract Law','Legal Drafting','Business Law'], status:'open', duration:'1 week' },
  { id:'j9',  title:'MTH 101 and STA 101 tutor needed — 100-level Engineering student, UNI',       category:'Academic Support',     budget:2000,   type:'Hourly', posted:'2 days ago',   proposals:5,  description:'I am a 100-level Engineering student at UNI struggling with MTH 101 (Calculus I) and STA 101 (Probability and Statistics). I need a tutor who can explain concepts clearly, work through past exam questions, and help me prepare for my semester tests. Prefer Zoom or in-library sessions, twice per week.', skills:['Calculus','Statistics','Mathematics','Teaching'], status:'open', duration:'4 weeks' },
  { id:'j10', title:'Photographer for Chemical Engineering convocation dinner — University (UNI)',  category:'Photography',          budget:50000,  type:'Fixed',  posted:'10 hours ago', proposals:4,  description:'The Department of Chemical Engineering, UNI is hosting its convocation dinner for the graduating class of 2026. We need a photographer for the full 4-hour event: arrival shots, awards ceremony, dinner service, group photos, and candid moments. Venue is the UNI Staff Club. Edited photos delivered within 72 hours.', skills:['Event Photography','Lightroom','Portrait','Photo Editing'], status:'open', duration:'1 evening' },
  { id:'j11', title:'Social media manager for UNI Student Union Government — 2-month contract',    category:'Sales & Marketing',   budget:80000,  type:'Fixed',  posted:'1 day ago',    proposals:7,  description:'The Student Union Government, UNI needs a social media manager for our official Instagram and X (Twitter) accounts over 2 months. Responsibilities: 5 posts per week, managing DMs and comments, live coverage of SUG events, and bi-weekly analytics reports. Content ideas provided. Must understand Nigerian campus culture.', skills:['Instagram','Twitter/X','Content Creation','Canva'], status:'open', duration:'2 months' },
]

/**
 * Seeds demo data to Firestore. Safe to call multiple times — skips if already seeded.
 * @param {function(number,number):void} [onProgress] - Optional progress callback (done, total)
 * @returns {Promise<{alreadySeeded:boolean}|{seeded:number}>}
 */
export async function seedDemoData(onProgress) {
  // ── Check if already seeded ──────────────────────────────────────────────
  const existingDemoJobs = await getDocs(query(collection(db, 'jobs'), where('isDemo', '==', true)))
  if (existingDemoJobs.size > 0) {
    return { alreadySeeded: true, existing: existingDemoJobs.size }
  }

  const total = DEMO_FREELANCERS.length + DEMO_JOBS.length
  let done = 0

  // ── Write freelancer profiles ─────────────────────────────────────────────
  for (const f of DEMO_FREELANCERS) {
    await setDoc(doc(db, 'users', f.id), {
      ...f,
      isDemo:    true,
      createdAt: serverTimestamp(),
    })
    done++
    onProgress?.(done, total)
  }

  // ── Write job listings ────────────────────────────────────────────────────
  for (const j of DEMO_JOBS) {
    await setDoc(doc(db, 'jobs', j.id), {
      ...j,
      isDemo:    true,
      clientId:  '_nexus_demo_',
      createdAt: serverTimestamp(),
    })
    done++
    onProgress?.(done, total)
  }

  return { seeded: done }
}
