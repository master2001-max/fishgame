/**
 * Application HTTP Entry Point
 *
 * Location: backend/server.js
 * Where it fits: Bootstrap root. Initializes Firebase connections and binds the Express server.
 */

import { env } from './src/config/env.js';
import { initFirebase } from './src/config/firebase.js';
import { createApp } from './src/app.js';

// Initialize Google Cloud Firestore and Firebase Admin Auth
initFirebase();
console.log('[Fish Catcher] Active database: Google Cloud Firestore (Production)');

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[Fish Catcher] Server listening on http://localhost:${env.PORT}`);
  console.log(`[Fish Catcher] Client origin allowed: ${env.CLIENT_ORIGIN}`);
});
