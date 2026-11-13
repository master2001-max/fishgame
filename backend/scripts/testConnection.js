import { initFirebase, getFirestore } from '../src/config/firebase.js';

async function main() {
  console.log('Testing Firebase Admin initialization...');
  const { app, db } = initFirebase();
  if (!app) {
    console.error('Failed to initialize app: app is null');
    process.exit(1);
  }
  console.log('Firebase App initialized successfully! App name:', app.name);
  console.log('Querying Firestore collections...');
  const collections = await db.listCollections();
  console.log('Firestore connected successfully! Existing collections:', collections.map((c) => c.id));
}

main().catch((err) => {
  console.error('Firebase test failed:', err);
  process.exit(1);
});
