/**
 * Firestore User Repository Implementation
 *
 * Location: backend/src/repositories/firestoreUserRepository.js
 * Where it fits: Data Access Layer. Implements the UserRepository contract for Google Cloud Firestore.
 *
 * Why: Encapsulates all Firestore queries so the Services layer (business logic) remains
 * completely agnostic to the database implementation. This adheres directly to the
 * Dependency Inversion Principle (DIP) and Single Responsibility Principle (SRP).
 */

import { getFirestore } from '../config/firebase.js';
import { createDefaultProgress, createDefaultSettings } from '../db/database.js';

function mapDocToUser(id, data) {
  if (!data) return null;
  return {
    id,
    name: data.name,
    email: data.email,
    password: data.password || '',
    difficulty: data.difficulty || 'Easy',
    level: Number(data.level) || 1,
    score: Number(data.score) || 0,
    totalCatches: Number(data.totalCatches) || 0,
    gamesPlayed: Number(data.gamesPlayed) || 0,
    progress: data.progress || createDefaultProgress(),
    savedGame: data.savedGame || null,
    settings: data.settings || createDefaultSettings(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export const firestoreUserRepository = {
  /**
   * Finds a user by their Firebase UID or custom ID.
   */
  async findById(id) {
    if (!id) return null;
    const db = getFirestore();
    const docSnap = await db.collection('users').doc(String(id)).get();
    if (!docSnap.exists) return null;
    return mapDocToUser(docSnap.id, docSnap.data());
  },

  /**
   * Finds a user by either username or email (case-insensitive).
   */
  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const byEmail = await this.findByEmail(clean);
    if (byEmail) return byEmail;
    return this.findByName(clean);
  },

  /**
   * Finds a user by display name (case-insensitive lookup).
   */
  async findByName(name) {
    if (!name) return null;
    const clean = String(name).trim().toLowerCase();
    const db = getFirestore();
    const querySnap = await db
      .collection('users')
      .where('nameLower', '==', clean)
      .limit(1)
      .get();

    if (querySnap.empty) return null;
    const firstDoc = querySnap.docs[0];
    return mapDocToUser(firstDoc.id, firstDoc.data());
  },

  /**
   * Finds a user by email address (case-insensitive).
   */
  async findByEmail(email) {
    if (!email) return null;
    const clean = String(email).trim().toLowerCase();
    const db = getFirestore();
    const querySnap = await db
      .collection('users')
      .where('emailLower', '==', clean)
      .limit(1)
      .get();

    if (querySnap.empty) return null;
    const firstDoc = querySnap.docs[0];
    return mapDocToUser(firstDoc.id, firstDoc.data());
  },

  /**
   * Creates a new user document in the 'users' collection.
   * Also seeds an entry in the 'scores' collection for leaderboard indexing.
   */
  async create({ id, name, email, passwordHash = '' }) {
    const db = getFirestore();
    const now = new Date().toISOString();
    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // Use provided UID or auto-generate a document ref
    const docRef = id ? db.collection('users').doc(String(id)) : db.collection('users').doc();
    const userId = docRef.id;

    const userData = {
      name: cleanName,
      nameLower: cleanName.toLowerCase(),
      email: cleanEmail,
      emailLower: cleanEmail,
      password: passwordHash,
      difficulty: 'Easy',
      level: 1,
      score: 0,
      totalCatches: 0,
      gamesPlayed: 0,
      progress: createDefaultProgress(),
      savedGame: null,
      settings: createDefaultSettings(),
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(userData);

    // Seed empty score entry in the 'scores' collection
    await db.collection('scores').doc(userId).set({
      userId,
      id: userId,
      name: cleanName,
      score: 0,
      difficulty: 'Easy',
      level: 1,
      totalCatches: 0,
      gamesPlayed: 0,
      updatedAt: now,
    });

    return mapDocToUser(userId, userData);
  },

  /**
   * Updates user stats after completing a mission and mirrors to 'scores' collection.
   */
  async updateMissionOutcome(
    id,
    { difficulty, level, score, totalCatches, gamesPlayed, progress }
  ) {
    const db = getFirestore();
    const now = new Date().toISOString();
    const userRef = db.collection('users').doc(String(id));

    const updatePayload = {
      difficulty,
      level,
      score,
      totalCatches,
      gamesPlayed,
      progress,
      savedGame: null,
      updatedAt: now,
    };

    await userRef.set(updatePayload, { merge: true });

    // Also update leaderboard scores collection
    const userDoc = await userRef.get();
    const currentName = userDoc.data()?.name || 'Hunter';

    await db.collection('scores').doc(String(id)).set(
      {
        userId: String(id),
        id: String(id),
        name: currentName,
        score,
        difficulty,
        level,
        totalCatches,
        gamesPlayed,
        updatedAt: now,
      },
      { merge: true }
    );

    // Clear active session in gameSessions collection
    await db.collection('gameSessions').doc(String(id)).delete().catch(() => {});

    return this.findById(id);
  },

  /**
   * Updates in-progress pause state snapshot in both 'users' and 'gameSessions'.
   */
  async updateSavedGame(id, savedGame) {
    const db = getFirestore();
    const now = new Date().toISOString();
    const userRef = db.collection('users').doc(String(id));

    await userRef.set(
      {
        savedGame: savedGame || null,
        updatedAt: now,
      },
      { merge: true }
    );

    const sessionRef = db.collection('gameSessions').doc(String(id));
    if (savedGame) {
      await sessionRef.set({
        userId: String(id),
        ...savedGame,
        savedAt: now,
      });
    } else {
      await sessionRef.delete().catch(() => {});
    }

    return this.findById(id);
  },

  /**
   * Updates settings such as audio toggles and selected lure style.
   */
  async updateSettings(id, { settings, difficulty, level }) {
    const db = getFirestore();
    const now = new Date().toISOString();
    const userRef = db.collection('users').doc(String(id));

    await userRef.set(
      {
        settings,
        difficulty,
        level,
        updatedAt: now,
      },
      { merge: true }
    );

    return this.findById(id);
  },

  /**
   * Fetches the top hunters for the public leaderboard from the 'scores' collection.
   */
  async findLeaderboard(limit = 50) {
    const db = getFirestore();
    const querySnap = await db
      .collection('scores')
      .orderBy('score', 'desc')
      .limit(limit)
      .get();

    return querySnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: d.id || doc.id,
        name: d.name || 'Hunter',
        difficulty: d.difficulty || 'Easy',
        level: Number(d.level) || 1,
        score: Number(d.score) || 0,
        total_catches: Number(d.totalCatches) || 0,
        games_played: Number(d.gamesPlayed) || 0,
        updated_at: d.updatedAt || new Date().toISOString(),
      };
    });
  },
};
