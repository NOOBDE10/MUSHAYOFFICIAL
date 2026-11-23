// One-time migration: provisions a real Firebase Auth user for the existing
// plaintext admin_config/main credentials, and creates the admins/{uid}
// marker doc the app now uses to recognize admin sessions.
//
// Run this ONCE, before publishing locked-down Firestore rules (it needs the
// old permissive rules to read admin_config/main). Safe to re-run: it skips
// creation if the admins/{uid} doc already exists.
//
// Usage: node scripts/migrate-admin.mjs

import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

function loadEnvLocal() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const configSnap = await getDoc(doc(db, 'admin_config', 'main'));
  if (!configSnap.exists()) {
    console.error('No admin_config/main document found — nothing to migrate.');
    process.exit(1);
  }
  const config = configSnap.data();
  const email = String(config.email || '').trim().toLowerCase();
  const password = String(config.password || '');
  const name = config.name || 'Store Owner';

  if (!email || !password) {
    console.error('admin_config/main is missing email/password — nothing to migrate.');
    process.exit(1);
  }

  let uid;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`Firebase Auth user already exists for ${email} (uid: ${uid}).`);
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`Created Firebase Auth user for ${email} (uid: ${uid}).`);
  }

  const adminDocRef = doc(db, 'admins', uid);
  const existing = await getDoc(adminDocRef);
  if (existing.exists()) {
    console.log('admins/{uid} doc already exists — leaving it as-is.');
  } else {
    await setDoc(adminDocRef, { name, email, createdAt: new Date().toISOString() });
    console.log(`Created admins/${uid} profile doc.`);
  }

  console.log('\nMigration complete.');
  console.log(`Admin email: ${email}`);
  console.log('Password unchanged — same password as before, now owned by Firebase Auth.');
  console.log('Next: deploy the new Firestore rules, then verify admin login in the app.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
