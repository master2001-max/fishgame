/**
 * Application HTTP Entry Point
 *
 * Location: backend/server.js
 * Where it fits: Bootstrap root. Initializes database connections and binds the Express server.
 */

import { env } from './src/config/env.js';
import { initDatabase } from './src/db/database.js';
import { initFirebase } from './src/config/firebase.js';
import { createApp } from './src/app.js';

// Initialize the active database driver
if (env.DB_DRIVER === 'firestore') {
  initFirebase();
  console.log('[Fish Catcher] Active database: Google Cloud Firestore (Production)');
} else {
  initDatabase();
  console.log('[Fish Catcher] Active database: SQLite local file (Fallback)');
}

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[Fish Catcher] Server listening on http://localhost:${env.PORT}`);
  console.log(`[Fish Catcher] Client origin allowed: ${env.CLIENT_ORIGIN}`);
});
