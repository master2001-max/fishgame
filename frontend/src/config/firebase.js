/**
 * Frontend Firebase Client SDK Initialization Module
 *
 * Location: frontend/src/config/firebase.js
 * Where it fits: Client application layer. Used by authentication forms (Login/Register).
 *
 * Why: This initializes the Firebase JavaScript SDK in the browser ONLY for Authentication.
 * Per the architectural design, the React frontend NEVER connects directly to Firestore.
 * When a user logs in or registers:
 * 1. Firebase Auth validates credentials in the browser.
 * 2. Firebase generates a secure, cryptographically signed ID Token (JWT).
 * 3. The React app sends this ID Token to our Express backend via the 'Authorization: Bearer <token>' header.
 * 4. Express verifies the token using the Admin SDK and performs all database queries.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fishcatcher-60484.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fishcatcher-60484',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fishcatcher-60484.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase client instance
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);
