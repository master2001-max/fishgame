import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

let dbInstance = null;

export function createDefaultProgress() {
  return {
    Easy: { currentLevel: 1, completed: [] },
    Normal: { currentLevel: 1, completed: [] },
    Hard: { currentLevel: 1, completed: [] },
  };
}

export function createDefaultSettings() {
  return {
    music: true,
    sfx: true,
    difficulty: 'Easy',
    lureStyle: 'biolum',
  };
}

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function initDatabase() {
  if (dbInstance) return dbInstance;

  fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
  const db = new DatabaseSync(env.DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      level INTEGER NOT NULL DEFAULT 1,
      score INTEGER NOT NULL DEFAULT 0,
      total_catches INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      progress_json TEXT NOT NULL,
      saved_game_json TEXT DEFAULT NULL,
      settings_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  seedAdminUser(db);
  dbInstance = db;
  return db;
}

function seedAdminUser(db) {
  const existing = db
    .prepare('SELECT id FROM users WHERE LOWER(name) = LOWER(?)')
    .get(env.ADMIN_SEED.name);

  if (existing) return;

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(env.ADMIN_SEED.password, 10);

  db.prepare(`
    INSERT INTO users (
      name, email, password, difficulty, level, score,
      total_catches, games_played, progress_json, saved_game_json,
      settings_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    env.ADMIN_SEED.name,
    env.ADMIN_SEED.email,
    passwordHash,
    'Easy',
    1,
    0,
    0,
    0,
    JSON.stringify(createDefaultProgress()),
    null,
    JSON.stringify(createDefaultSettings()),
    now,
    now
  );
}
