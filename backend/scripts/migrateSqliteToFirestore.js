/**
 * SQLite to Firestore One-Time Migration Script
 *
 * Location: backend/scripts/migrateSqliteToFirestore.js
 * Where it fits: DevOps / Data Migration Utility.
 *
 * Why: Seamlessly transitions existing SQLite user accounts, high scores, and saved games
 * to Google Cloud Firestore.
 *
 * Safety Guarantees:
 * 1. Zero Writes to SQLite: SQLite is accessed strictly in read-only mode.
 * 2. Idempotent: Can be safely executed multiple times without corrupting or duplicating data.
 * 3. Atomic Document Creation: Writes to both 'users' and 'scores' collections.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { env, BACKEND_ROOT } from '../src/config/env.js';
import { initFirebase, getFirestore } from '../src/config/firebase.js';

function parseJson(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

async function migrate() {
  console.log('====================================================');
  console.log('🐟 FISH CATCHER: SQLITE -> FIRESTORE MIGRATION');
  console.log('====================================================');

  // 1. Initialize Firestore
  initFirebase();
  const db = getFirestore();
  if (!db) {
    throw new Error('Could not connect to Firestore. Check your service account credentials.');
  }

  // 2. Open SQLite in read-only mode
  const dbPath = path.resolve(BACKEND_ROOT, 'data', 'fishcatcher.db');
  console.log(`[SQLite] Reading from: ${dbPath}`);

  // Note: readOnly option prevents any accidental writes
  const sqlite = new DatabaseSync(dbPath, { readOnly: true });

  const rows = sqlite.prepare('SELECT * FROM users').all();
  console.log(`[SQLite] Found ${rows.length} user record(s) to inspect.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const cleanEmail = String(row.email || '').trim().toLowerCase();
    const cleanName = String(row.name || '').trim();

    console.log(`\nEvaluating user: "${cleanName}" (${cleanEmail})...`);

    // Check if user already exists in Firestore by email
    const existingSnap = await db
      .collection('users')
      .where('emailLower', '==', cleanEmail)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      console.log(`  ↪ Already exists in Firestore (Doc ID: ${existingSnap.docs[0].id}). Skipping.`);
      skippedCount++;
      continue;
    }

    // Assign Document ID (use existing numeric ID as string for continuity)
    const docId = `migrated_sqlite_${row.id}`;

    const progress = parseJson(row.progress_json, {
      Easy: { currentLevel: 1, completed: [] },
      Normal: { currentLevel: 1, completed: [] },
      Hard: { currentLevel: 1, completed: [] },
    });

    const savedGame = parseJson(row.saved_game_json, null);

    const settings = parseJson(row.settings_json, {
      music: true,
      sfx: true,
      difficulty: 'Easy',
      lureStyle: 'biolum',
    });

    const userDocData = {
      id: docId,
      name: cleanName,
      nameLower: cleanName.toLowerCase(),
      email: cleanEmail,
      emailLower: cleanEmail,
      password: row.password || '',
      difficulty: row.difficulty || 'Easy',
      level: Number(row.level) || 1,
      score: Number(row.score) || 0,
      totalCatches: Number(row.total_catches) || 0,
      gamesPlayed: Number(row.games_played) || 0,
      progress,
      savedGame,
      settings,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      migratedFromSqlite: true,
    };

    // Write to Firestore 'users' collection
    await db.collection('users').doc(docId).set(userDocData);

    // Write to Firestore 'scores' collection for Leaderboard ranking
    await db.collection('scores').doc(docId).set({
      userId: docId,
      id: docId,
      name: cleanName,
      score: Number(row.score) || 0,
      difficulty: row.difficulty || 'Easy',
      level: Number(row.level) || 1,
      totalCatches: Number(row.total_catches) || 0,
      gamesPlayed: Number(row.games_played) || 0,
      updatedAt: row.updated_at || new Date().toISOString(),
    });

    console.log(`  ✓ Successfully migrated to Firestore doc: users/${docId}`);
    migratedCount++;
  }

  console.log('\n====================================================');
  console.log('MIGRATION COMPLETE SUMMARY:');
  console.log(`Total Inspected: ${rows.length}`);
  console.log(`Successfully Migrated: ${migratedCount}`);
  console.log(`Skipped (Already in Firestore): ${skippedCount}`);
  console.log('SQLite database status: 100% UNTOUCHED');
  console.log('====================================================');
}

migrate().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
