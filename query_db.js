import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

const env = readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'admin@nexus.edu', 'Demo1234!');
  const snap = await getDocs(collection(db, 'proposals'));
  const proposals = snap.docs.map(d => d.data());
  console.log(JSON.stringify(proposals, null, 2));
  
  const jobsSnap = await getDocs(collection(db, 'jobs'));
  const jobs = jobsSnap.docs.map(d => d.data());
  console.log("JOBS:");
  console.log(JSON.stringify(jobs, null, 2));
  
  process.exit(0);
}
run().catch(console.error);
