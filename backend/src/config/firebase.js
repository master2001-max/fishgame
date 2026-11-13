/**
 * Firebase Admin SDK Initialization Module
 *
 * Location: backend/src/config/firebase.js
 * Where it fits: Infrastructure / Configuration layer. Used by Firestore repositories
 * and Auth middleware to talk to Google Firebase Cloud services.
 *
 * Why: The Firebase Admin SDK gives our Express server privileged access to Cloud Firestore
 * and Firebase Authentication. This allows the server to verify user identity tokens and
 * manage database records securely, without exposing any database credentials to the client.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore as adminGetFirestore } from 'firebase-admin/firestore';
import { getAuth as adminGetAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';
import { env, BACKEND_ROOT } from './env.js';

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;

/**
 * Initializes the Firebase Admin SDK using one of three credential options:
 * 1. A serviceAccountKey.json file path (GOOGLE_APPLICATION_CREDENTIALS)
 * 2. Environment variables directly (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 3. Default application credentials (e.g., when hosted on Google Cloud / Firebase Hosting)
 */
export function initFirebase() {
  if (firebaseApp) {
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  }

  // Check if an app is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    firestoreDb = adminGetFirestore(firebaseApp);
    firebaseAuth = adminGetAuth(firebaseApp);
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  }

  try {
    let credential = null;

    // Strategy 1: Check candidate file paths for serviceAccountKey.json
    const candidatePaths = [
      env.FIREBASE.credentialsPath,
      path.resolve(BACKEND_ROOT, env.FIREBASE.credentialsPath || ''),
      path.resolve(BACKEND_ROOT, 'serviceAccountKey.json'),
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
      path.resolve(process.cwd(), 'backend', 'serviceAccountKey.json'),
    ].filter(Boolean);

    for (const testPath of candidatePaths) {
      if (fs.existsSync(testPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(testPath, 'utf8'));
          credential = cert(serviceAccount);
          break;
        } catch (e) {
          console.warn(`[Firebase] Failed to parse credentials file at ${testPath}:`, e.message);
        }
      }
    }

    // Strategy 2: Check environment variables
    if (!credential && env.FIREBASE.clientEmail && env.FIREBASE.privateKey) {
      credential = cert({
        projectId: env.FIREBASE.projectId,
        clientEmail: env.FIREBASE.clientEmail,
        privateKey: env.FIREBASE.privateKey,
      });
    }

    if (credential) {
      firebaseApp = initializeApp({
        credential,
        projectId: env.FIREBASE.projectId,
      });
      firestoreDb = adminGetFirestore(firebaseApp);
      firebaseAuth = adminGetAuth(firebaseApp);
      return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
    }

    if (env.DB_DRIVER === 'firestore') {
      throw new Error(
        'DB_DRIVER is set to "firestore", but no Firebase credentials could be loaded.'
      );
    }
  } catch (error) {
    if (env.DB_DRIVER === 'firestore') {
      console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error.message);
      throw error;
    }
    console.warn('[Firebase] Running in SQLite mode (Firebase Admin SDK not initialized).');
  }

  return { app: null, db: null, auth: null };
}

export function getFirestore() {
  if (!firestoreDb) {
    initFirebase();
  }
  return firestoreDb;
}

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    initFirebase();
  }
  return firebaseAuth;
}
