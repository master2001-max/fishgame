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
import { getFirebaseAuth, getServiceAccount } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in first.',
    });
  }

  // 1. Check if it's an Express-signed JWT (HS256 via env.JWT_SECRET)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.userId = payload.userId;
    req.userName = payload.name;
    return next();
  } catch {
    // Proceed to Firebase token verification
  }

  // 2. Check if it's a Firebase ID Token (RS256 via Google Public Keys)
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
      return next();
    }
  } catch {
    // Proceed to Firebase Custom Token verification
  }

  // 3. Fallback: Firebase Custom Token (RS256 via Service Account key)
  try {
    const decoded = jwt.decode(token);
    if (
      decoded &&
      decoded.uid &&
      decoded.aud === 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
    ) {
      const sa = getServiceAccount();
      const privateKey = sa?.private_key || sa?.privateKey || env.FIREBASE?.privateKey;
      if (privateKey) {
        const verified = jwt.verify(token, privateKey, { algorithms: ['RS256'] });
        req.userId = verified.uid;
        return next();
      }
    }
  } catch {
    // All verification strategies exhausted
  }

  return res.status(401).json({
    error: 'Invalid or expired authentication token. Please sign in again.',
  });
}
