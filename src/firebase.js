// ── Backward-compat shim ───────────────────────────────────────────────────
// AppContext.jsx and other files that previously imported from '../firebase'
// will continue to work. All real config now lives in src/firebase/config.js
export { auth, db, rtdb, default } from './firebase/config'
