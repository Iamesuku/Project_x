import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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
  const cred = await signInWithEmailAndPassword(auth, 'client@nexus.edu', 'Demo1234!');
  console.log('Client logged in, UID:', cred.user.uid);
  
  try {
    const q = query(collection(db, 'proposals'), where('clientId', '==', cred.user.uid));
    const snap = await getDocs(q);
    const proposals = snap.docs.map(d => d.data());
    console.log('CLIENT PROPOSALS:', JSON.stringify(proposals, null, 2));
  } catch (e) {
    console.error('Client proposals read failed:', e);
  }
  
  try {
    const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('clientId', '==', cred.user.uid)));
    const jobs = jobsSnap.docs.map(d => d.data());
    console.log("CLIENT JOBS:");
    console.log(JSON.stringify(jobs, null, 2));
  } catch(e) {
     console.error('Jobs read failed:', e);
  }
  
  process.exit(0);
}
run().catch(console.error);
