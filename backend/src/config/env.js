/**
 * Central Environment Configuration
 *
 * Location: backend/src/config/env.js
 * Where it fits: Loaded on application start before express and Firebase setup.
 *
 * Why: Centralizes all configuration variables and environment fallbacks in one place.
 * Ensures .env is loaded reliably regardless of whether the process was started from the root
 * repository folder or inside the backend folder.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BACKEND_ROOT = path.resolve(__dirname, '../..');

// Explicitly load .env from backend root so running from workspace root works seamlessly
dotenv.config({ path: path.join(BACKEND_ROOT, '.env') });

export const env = {
  // HTTP Server
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Database Driver Strategy: Firestore (Pure Cloud Database)
  DB_DRIVER: 'firestore',

  // JWT Configuration (for session signatures)
  JWT_SECRET: process.env.JWT_SECRET || 'fishcatcher-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '7d',

  // Firebase Admin Configuration (used for Firestore and ID Token verification)
  FIREBASE: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'fishcatcher-60484',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(BACKEND_ROOT, 'serviceAccountKey.json'),
  },

  // Third-Party Interoperability: Marc Conrad's Fish Game API
  FISH_API_BASE: process.env.FISH_API_BASE || 'https://marcconrad.com/uob/fish/api.php',
};
