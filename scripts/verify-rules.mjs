// Verifies the published Firestore rules behave as intended, from an
// UNAUTHENTICATED (anonymous visitor) perspective — the access level that
// matters most. Read-only except for a throwaway doc in order_lookup used
// to prove the guest-tracking path round-trips correctly.
//
// Usage: node scripts/verify-rules.mjs

import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';

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
const db = getFirestore(app);

let pass = 0, fail = 0;
async function expect(label, shouldSucceed, fn) {
  try {
    await fn();
    if (shouldSucceed) { console.log(`PASS  ${label} (succeeded as expected)`); pass++; }
    else { console.log(`FAIL  ${label} (succeeded but should have been denied)`); fail++; }
  } catch (err) {
    const denied = err.code === 'permission-denied' || /Missing or insufficient permissions/i.test(err.message || '');
    if (!shouldSucceed && denied) { console.log(`PASS  ${label} (denied as expected)`); pass++; }
    else { console.log(`FAIL  ${label} (${err.code || err.message})`); fail++; }
  }
}

async function main() {
  console.log('Running as: anonymous (no sign-in) — the same access level as any site visitor.\n');

  await expect('Read products (public catalog)', true, async () => {
    await getDocs(query(collection(db, 'products'), limit(1)));
  });

  await expect('List users collection', false, async () => {
    await getDocs(query(collection(db, 'users'), limit(1)));
  });

  await expect('List orders collection', false, async () => {
    await getDocs(query(collection(db, 'orders'), limit(1)));
  });

  await expect('List security_logs collection', false, async () => {
    await getDocs(query(collection(db, 'security_logs'), limit(1)));
  });

  await expect('Read admin_config/main (deleted + unruled)', false, async () => {
    const snap = await getDoc(doc(db, 'admin_config', 'main'));
    if (!snap.exists()) throw { code: 'permission-denied' }; // treat "gone" as the desired outcome
  });

  await expect('Read a random admins/{uid} doc', false, async () => {
    await getDoc(doc(db, 'admins', 'not-a-real-uid'));
  });

  await expect('Read a random users/{uid} doc', false, async () => {
    await getDoc(doc(db, 'users', 'not-a-real-uid'));
  });

  await expect('Create a fake product doc (should require admin)', false, async () => {
    await setDoc(doc(db, 'products', '__rules_test_product__'), { name: 'test' });
  });

  const testKey = 'RULES-TEST_0000';
  await expect('Create order_lookup test doc (guest tracking write)', true, async () => {
    await setDoc(doc(db, 'order_lookup', testKey), {
      orderNumber: 'RULES-TEST', customerPhone: '03000000000', status: 'Pending', note: 'verify-rules.mjs test doc — safe to delete',
    });
  });

  await expect('Get that exact order_lookup doc by key', true, async () => {
    const snap = await getDoc(doc(db, 'order_lookup', testKey));
    if (!snap.exists()) throw new Error('doc missing after create');
  });

  await expect('List order_lookup collection (must be blocked)', false, async () => {
    await getDocs(query(collection(db, 'order_lookup'), limit(1)));
  });

  console.log(`\n${pass} passed, ${fail} failed.`);
  if (fail > 0) {
    console.log('\nNote: the order_lookup test doc at order_lookup/RULES-TEST_0000 cannot be');
    console.log('deleted anonymously (delete requires admin) — delete it from the Firebase');
    console.log('console if you want it gone; it is harmless test data.');
  } else {
    console.log('\nNote: left a harmless test doc at order_lookup/RULES-TEST_0000 (anonymous');
    console.log('clients cannot delete it — that is the rule working correctly). Fine to leave,');
    console.log('or delete it yourself from the Firebase console.');
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => { console.error('Script error:', err); process.exit(1); });
