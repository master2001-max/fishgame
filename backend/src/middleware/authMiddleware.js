/**
 * Authentication Middleware (Firebase ID Token Verification)
 *
 * Location: backend/src/middleware/authMiddleware.js
 * Where it fits: Security boundary. Protects /api/game/* and private user routes.
 *
 * Why: The React client sends a cryptographically signed Firebase ID token in the
 * 'Authorization: Bearer <token>' header. This middleware verifies the token with the
 * Firebase Admin SDK to ensure the user is genuinely authenticated, extracting their UID
 * and attaching it to `req.userId` for downstream controllers.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getFirebaseAuth } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in first.',
    });
  }

  // 1. Verify with Firebase Admin SDK
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    return next();
  } catch {
    // 2. Fallback to signed JWT verification if custom token / test token
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.userId = payload.userId;
      return next();
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired authentication token. Please sign in again.',
      });
    }
  }
}
