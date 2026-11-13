/**
 * Authentication Service
 *
 * Location: backend/src/services/authService.js
 * Where it fits: Business Logic Layer for hunter authentication and session bootstrapping.
 *
 * Why: Separates authentication business rules from HTTP controller logic. Handles user
 * registration, credential checks, token issuance, and initial state construction.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { getFirebaseAuth } from '../config/firebase.js';
import { gameService } from './gameService.js';
import { AppError } from '../utils/appError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signJwt(user) {
  return jwt.sign({ userId: user.id, name: user.name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export const authService = {
  /**
   * Registers a new hunter. In Firestore mode, synchronizes with Firebase Auth.
   */
  async register({ name, email, password, idToken }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (cleanName.length < 2 || cleanName.length > 32) {
      throw new AppError('Hunter name must be between 2 and 32 characters.', 400);
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new AppError('Please enter a valid email address.', 400);
    }

    // Check duplicate name or email
    const existingName = await userRepository.findByName(cleanName);
    if (existingName) {
      throw new AppError('That hunter name is already taken.', 409);
    }
    const existingEmail = await userRepository.findByEmail(cleanEmail);
    if (existingEmail) {
      throw new AppError('That email is already registered.', 409);
    }

    let userId = null;
    let token = null;

    if (env.DB_DRIVER === 'firestore') {
      const auth = getFirebaseAuth();
      // If client sent an already-authenticated Firebase ID token
      if (idToken) {
        const decoded = await auth.verifyIdToken(idToken);
        userId = decoded.uid;
        token = idToken;
      } else if (rawPassword.length >= 6) {
        // Create user in Firebase Authentication via Admin SDK
        const fbUser = await auth.createUser({
          email: cleanEmail,
          password: rawPassword,
          displayName: cleanName,
        });
        userId = fbUser.uid;
      } else {
        throw new AppError('Password must be at least 6 characters.', 400);
      }
    } else {
      if (rawPassword.length < 6) {
        throw new AppError('Password must be at least 6 characters.', 400);
      }
    }

    const passwordHash = rawPassword ? bcrypt.hashSync(rawPassword, 10) : '';
    const user = await userRepository.create({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
    });

    if (!token) {
      token = signJwt(user);
    }

    return {
      token,
      state: gameService.buildClientState(user),
    };
  },

  /**
   * Synchronizes or logs in a user using their Firebase ID Token.
   */
  async syncFirebaseUser(idToken, fallbackName = '') {
    const auth = getFirebaseAuth();
    if (!auth) throw new AppError('Firebase Auth is unavailable.', 500);

    const decoded = await auth.verifyIdToken(idToken);
    const userId = decoded.uid;
    const email = (decoded.email || '').toLowerCase();
    const name = decoded.name || fallbackName || email.split('@')[0] || 'Hunter';

    let user = await userRepository.findById(userId);
    if (!user) {
      user = await userRepository.create({
        id: userId,
        name,
        email,
      });
    }

    return {
      token: idToken,
      state: gameService.buildClientState(user),
    };
  },

  /**
   * Authenticates user via identifier/password (or token in Firestore mode).
   */
  async login({ identifier, password, idToken }) {
    if (env.DB_DRIVER === 'firestore' && idToken) {
      return this.syncFirebaseUser(idToken, identifier);
    }

    const cleanIdentifier = String(identifier || '').trim();
    const rawPassword = String(password || '');

    if (!cleanIdentifier) {
      throw new AppError('Username or email is required.', 400);
    }

    const user = await userRepository.findByIdentifier(cleanIdentifier);
    if (!user) {
      throw new AppError('Invalid username/email or password.', 401);
    }

    // In SQLite mode or when password exists in record
    if (user.password && rawPassword) {
      if (!bcrypt.compareSync(rawPassword, user.password)) {
        throw new AppError('Invalid username/email or password.', 401);
      }
    }

    const token = signJwt(user);

    return {
      token,
      state: gameService.buildClientState(user),
    };
  },

  /**
   * Retrieves current user profile and game state.
   */
  async getProfile(userId) {
    let user = await userRepository.findById(userId);
    if (!user && env.DB_DRIVER === 'firestore') {
      // Auto-provision profile from Firebase Auth record if missing
      try {
        const fbRecord = await getFirebaseAuth().getUser(userId);
        user = await userRepository.create({
          id: userId,
          name: fbRecord.displayName || (fbRecord.email ? fbRecord.email.split('@')[0] : 'Hunter'),
          email: fbRecord.email || '',
        });
      } catch {
        // Record not found
      }
    }

    if (!user) {
      throw new AppError('Hunter account not found.', 401);
    }
    return gameService.buildClientState(user);
  },
};
