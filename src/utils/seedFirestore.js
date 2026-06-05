// ── Firestore Demo-Data Seeder ────────────────────────────────────────────
// Writes seed freelancer profiles and seed job listings to Firestore so
// every user sees them on Browse/Jobs without relying on in-memory fallbacks.
// All demo records carry  isDemo: true  so the app can block proposals on them.
// The function is IDEMPOTENT — running it twice is safe.

import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Seed freelancers ─────────────────────────────────────────────────────
const DEMO_FREELANCERS = [
  { id:'f1',  name:'Amara Osei',       avatar:'AO', title:'UI/UX Designer',        role:'freelancer', rate:45,  rating:4.9, reviews:128, skills:['Figma','Prototyping','User Research','Design Systems'],                 bio:'Award-winning designer with 6+ years helping startups ship beautiful products.',                                                   location:'Lagos, NG',  completedJobs:84,  category:'Design & Creative',    emailVerified:true, memberSince:'September 2025' },
  { id:'f2',  name:'Javier Ruiz',      avatar:'JR', title:'Full-Stack Developer',   role:'freelancer', rate:65,  rating:4.8, reviews:213, skills:['React','Node.js','PostgreSQL','TypeScript'],                              bio:'I build fast, scalable web apps. Obsessed with clean code and great UX. 8+ years across fintech and SaaS.',                     location:'Lagos, NG',  completedJobs:142, category:'Development & IT',  emailVerified:true, memberSince:'September 2025' },
  { id:'f3',  name:'Priya Nair',       avatar:'PN', title:'Brand Strategist',       role:'freelancer', rate:55,  rating:5.0, reviews:67,  skills:['Brand Identity','Copywriting','Strategy','Positioning'],                 bio:'Former FMCG brand manager. Now I help campus brands find their voice.',                                                          location:'Abuja, NG',  completedJobs:53,  category:'Sales & Marketing', emailVerified:true, memberSince:'September 2025' },
  { id:'f4',  name:'Kwame Asante',     avatar:'KA', title:'Motion Designer',        role:'freelancer', rate:50,  rating:4.7, reviews:91,  skills:['After Effects','Cinema 4D','Lottie','Premiere Pro'],                     bio:'I animate ideas into stories. Worked with campus media teams for 3 years.',                                                     location:'Lagos, NG',  completedJobs:76,  category:'Design & Creative',    emailVerified:true, memberSince:'August 2025' },
  { id:'f5',  name:'Sofia Lindqvist',  avatar:'SL', title:'Data Analyst',           role:'freelancer', rate:60,  rating:4.9, reviews:55,  skills:['Python','Tableau','SQL','dbt'],                                          bio:'Turning raw data into decisions. I help student associations and campus projects analyze and act on their data.',               location:'Ibadan, NG', completedJobs:39,  category:'Development & IT',  emailVerified:true, memberSince:'September 2025' },
  { id:'f6',  name:'Ethan Mwangi',     avatar:'EM', title:'SEO Copywriter',         role:'freelancer', rate:35,  rating:4.6, reviews:174, skills:['SEO Writing','Email Marketing','Ads Copy','Content Strategy'],            bio:'Words that convert. I have helped 50+ campus brands rank online and grow their audience.',                                       location:'Lagos, NG',  completedJobs:161, category:'Writing & Translation', emailVerified:true, memberSince:'July 2025' },
  { id:'f7',  name:'Chen Wei',         avatar:'CW', title:'Mobile Developer',       role:'freelancer', rate:70,  rating:4.8, reviews:88,  skills:['React Native','Flutter','Swift','Kotlin'],                               bio:'I ship mobile apps that students love. 10+ campus apps delivered.',                                                             location:'Lagos, NG',  completedJobs:67,  category:'Development & IT',  emailVerified:true, memberSince:'September 2025' },
  { id:'f8',  name:'Fatima Al-Hassan', avatar:'FA', title:'Financial Analyst',      role:'freelancer', rate:75,  rating:5.0, reviews:42,  skills:['Financial Modeling','Excel','FP&A','Valuation'],                         bio:'Finance student with CFA Level I. I build financial models for campus startups.',                                               location:'Abuja, NG',  completedJobs:31,  category:'Finance & Accounting', emailVerified:true, memberSince:'October 2025' },
  { id:'f9',  name:'Diego Morales',    avatar:'DM', title:'DevOps Engineer',        role:'freelancer', rate:80,  rating:4.8, reviews:63,  skills:['AWS','Terraform','Docker','Kubernetes'],                                 bio:'Cloud infrastructure expert. I help student teams deploy and scale their projects.',                                            location:'Lagos, NG',  completedJobs:48,  category:'Development & IT',  emailVerified:true, memberSince:'August 2025' },
  { id:'f10', name:'Yuki Tanaka',      avatar:'YT', title:'Legal Consultant',       role:'freelancer', rate:90,  rating:4.9, reviews:29,  skills:['Contract Law','IP','Compliance','GDPR'],                                 bio:'Law student specializing in tech and IP. I help campus startups with contracts and compliance.',                                location:'Lagos, NG',  completedJobs:22,  category:'Legal',               emailVerified:true, memberSince:'November 2025' },
  { id:'f11', name:'Chidi Okonkwo',    avatar:'CO', title:'Academic Tutor',         role:'freelancer', rate:15,  rating:4.8, reviews:34,  skills:['Mathematics','Calculus','Statistics','Physics'],                         bio:'300-level Engineering student at UNILAG. Tutoring STEM subjects for 2 years.',                                                 location:'Lagos, NG',  completedJobs:28,  category:'Academic Support',  emailVerified:true, memberSince:'September 2025' },
  { id:'f12', name:'Adaeze Nwosu',     avatar:'AN', title:'Campus Photographer',    role:'freelancer', rate:20,  rating:4.9, reviews:19,  skills:['Event Photography','Portrait','Lightroom','Adobe Express'],              bio:'Mass Communication student passionate about visual storytelling.',                                                             location:'Lagos, NG',  completedJobs:15,  category:'Photography',       emailVerified:true, memberSince:'October 2025' },
  { id:'f13', name:'Seun Adeyemi',     avatar:'SA', title:'Social Media Manager',   role:'freelancer', rate:25,  rating:4.7, reviews:12,  skills:['Instagram','TikTok','Content Calendar','Canva'],                         bio:'Marketing student managing social accounts for campus brands and student startups.',                                            location:'Abuja, NG',  completedJobs:9,   category:'Sales & Marketing', emailVerified:true, memberSince:'November 2025' },
  { id:'f14', name:'Tolu Fashola',     avatar:'TF', title:'Video Editor',           role:'freelancer', rate:30,  rating:4.6, reviews:22,  skills:['Premiere Pro','CapCut','DaVinci Resolve','After Effects'],               bio:'CS student who edits YouTube vlogs, TikToks, and departmental recap videos.',                                                  location:'Lagos, NG',  completedJobs:18,  category:'Design & Creative',    emailVerified:true, memberSince:'September 2025' },
]

// ── Seed jobs ─────────────────────────────────────────────────────────────
const DEMO_JOBS = [
  { id:'j1',  title:'Build a SaaS dashboard in React',                    category:'Development & IT',    budget:1200,  type:'Fixed',  posted:'2 days ago',   proposals:14, description:'We need a polished admin dashboard with charts, tables, and a dark mode toggle. Figma designs provided. Must be fully responsive and integrate with our REST API.',                                                                                                     skills:['React','Tailwind','Chart.js'],                 status:'open', duration:'2–4 weeks' },
  { id:'j2',  title:'Brand identity for fintech startup',                 category:'Design & Creative',   budget:800,   type:'Fixed',  posted:'1 day ago',    proposals:9,  description:'Create a full brand identity: logo, color palette, typography, and usage guidelines for a mobile payments startup targeting African markets.',                                                                                                                        skills:['Branding','Figma','Illustration'],             status:'open', duration:'1–2 weeks' },
  { id:'j3',  title:'SEO content writer – 10 articles/month',             category:'Writing & Translation',budget:40,   type:'Hourly', posted:'3 hours ago',  proposals:22, description:'We are a B2B SaaS company needing long-form, keyword-optimised content every month. Style guide and content calendar provided. Minimum 1500 words per article.',                                                                                                     skills:['SEO','Long-form','B2B'],                       status:'open', duration:'Ongoing' },
  { id:'j4',  title:'Data pipeline in Python + AWS',                      category:'Development & IT',    budget:2000,  type:'Fixed',  posted:'5 days ago',   proposals:6,  description:'Build an ETL pipeline that ingests CSV data from S3, transforms it, and loads into Redshift. Automated with Airflow. Full test coverage required.',                                                                                                                skills:['Python','AWS','Airflow'],                      status:'open', duration:'3–5 weeks' },
  { id:'j5',  title:'Explainer video animation',                          category:'Design & Creative',   budget:600,   type:'Fixed',  posted:'6 hours ago',  proposals:11, description:'60-second animated explainer video for our product launch. Script is ready and narration will be provided. Need motion designer for animation only.',                                                                                                               skills:['After Effects','Animation'],                   status:'open', duration:'1 week' },
  { id:'j6',  title:'Financial model for Series A deck',                  category:'Finance & Accounting', budget:1500, type:'Fixed',  posted:'1 day ago',    proposals:4,  description:'Build a 5-year financial model with revenue projections, unit economics, and a cap table. Outputs will be used in investor meetings. Must work in Excel and Google Sheets.',                                                                                           skills:['Excel','Financial Modeling','FP&A'],           status:'open', duration:'1–2 weeks' },
  { id:'j7',  title:'Mobile app UI design – iOS & Android',               category:'Design & Creative',   budget:950,   type:'Fixed',  posted:'4 hours ago',  proposals:7,  description:'Design screens for a fitness tracking app: onboarding, home, workout tracking, and profile. Deliverable: Figma file with components and auto-layout.',                                                                                                          skills:['Figma','Mobile UI','iOS Design'],              status:'open', duration:'2 weeks' },
  { id:'j8',  title:'GDPR compliance review & documentation',             category:'Legal',               budget:1100,  type:'Fixed',  posted:'3 days ago',   proposals:3,  description:'Review our current data practices, draft privacy policy, DSAR process and DPA templates. We process EU user data and need to be fully compliant.',                                                                                                                skills:['GDPR','Privacy Law','Compliance'],             status:'open', duration:'1 week' },
  { id:'j9',  title:'Need a tutor for Calculus — 4 sessions',             category:'Academic Support',    budget:8000,  type:'Fixed',  posted:'1 day ago',    proposals:3,  description:'I am a 200-level Engineering student struggling with MTH102 (Integral Calculus). I need 4 one-hour tutoring sessions, preferably over 2 weeks. Flexible timing, can meet in the library or remotely.',                                                           skills:['Mathematics','Calculus','Teaching'],           status:'open', duration:'2 weeks' },
  { id:'j10', title:'Event photographer for departmental dinner',          category:'Photography',         budget:15000, type:'Fixed',  posted:'12 hours ago', proposals:5,  description:'Our department (Computer Science, UNILAG) is hosting its annual dinner and awards night. We need a professional photographer to cover the full event (approx. 3 hours) and deliver edited photos within 48 hours.',                                              skills:['Event Photography','Lightroom','Photo Editing'],status:'open', duration:'1 evening' },
  { id:'j11', title:'Manage our faculty association Instagram for 1 month',category:'Sales & Marketing',  budget:500,   type:'Hourly', posted:'2 days ago',   proposals:7,  description:'The Faculty of Social Sciences Association needs a social media manager to handle our Instagram page for the month of May. Responsibilities: 3 posts per week, story updates, and audience engagement. Content ideas will be provided.',                            skills:['Instagram','Canva','Content Creation'],        status:'open', duration:'1 month' },
]

/**
 * Seeds demo data to Firestore. Safe to call multiple times — skips if already seeded.
 * @param {function(number,number):void} [onProgress] - Optional progress callback (done, total)
 * @returns {Promise<{alreadySeeded:boolean}|{seeded:number}>}
 */
export async function seedDemoData(onProgress) {
  // ── Check if already seeded ──────────────────────────────────────────
  const existingDemoJobs = await getDocs(query(collection(db, 'jobs'), where('isDemo', '==', true)))
  if (existingDemoJobs.size > 0) {
    return { alreadySeeded: true, existing: existingDemoJobs.size }
  }

  const total = DEMO_FREELANCERS.length + DEMO_JOBS.length
  let done = 0

  // ── Write freelancer profiles ─────────────────────────────────────────
  for (const f of DEMO_FREELANCERS) {
    await setDoc(doc(db, 'users', f.id), {
      ...f,
      isDemo:    true,
      createdAt: serverTimestamp(),
    })
    done++
    onProgress?.(done, total)
  }

  // ── Write job listings ────────────────────────────────────────────────
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
