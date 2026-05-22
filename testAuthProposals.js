import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAObivrEPibe0DSUcvtSFQfGl1KtnMtxEM",
  authDomain: "nexus-esukuwrotecode.firebaseapp.com",
  databaseURL: "https://nexus-esukuwrotecode-default-rtdb.firebaseio.com",
  projectId: "nexus-esukuwrotecode",
  storageBucket: "nexus-esukuwrotecode.firebasestorage.app",
  messagingSenderId: "936903146410",
  appId: "1:936903146410:web:0154905759227bd3f149d3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "requester@nexus.com", "password123");
    console.log("Logged in");
    const propsSnap = await getDocs(collection(db, 'proposals'));
    const fsProps = propsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log("Proposals:", JSON.stringify(fsProps, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
