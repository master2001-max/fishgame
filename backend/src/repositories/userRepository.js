import {
  createDefaultProgress,
  createDefaultSettings,
  getDb,
} from '../db/database.js';

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    difficulty: row.difficulty,
    level: row.level,
    score: row.score,
    totalCatches: row.total_catches,
    gamesPlayed: row.games_played,
    progress: parseJson(row.progress_json, createDefaultProgress()),
    savedGame: parseJson(row.saved_game_json, null),
    settings: parseJson(row.settings_json, createDefaultSettings()),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepository = {
  findById(id) {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    return mapUserRow(row);
  },

  findByIdentifier(identifier) {
    const row = getDb()
      .prepare(
        'SELECT * FROM users WHERE LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?)'
      )
      .get(identifier, identifier);
    return mapUserRow(row);
  },

  findByName(name) {
    const row = getDb()
      .prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)')
      .get(name);
    return mapUserRow(row);
  },

  findByEmail(email) {
    const row = getDb()
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email);
    return mapUserRow(row);
  },

  create({ name, email, passwordHash }) {
    const now = new Date().toISOString();
    const progress = createDefaultProgress();
    const settings = createDefaultSettings();

    const result = getDb()
      .prepare(`
        INSERT INTO users (
          name, email, password, difficulty, level, score,
          total_catches, games_played, progress_json, saved_game_json,
          settings_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        name,
        email,
        passwordHash,
        'Easy',
        1,
        0,
        0,
        0,
        JSON.stringify(progress),
        null,
        JSON.stringify(settings),
        now,
        now
      );

    return this.findById(Number(result.lastInsertRowid));
  },

  updateMissionOutcome(
    id,
    { difficulty, level, score, totalCatches, gamesPlayed, progress }
  ) {
    const now = new Date().toISOString();
    getDb()
      .prepare(`
        UPDATE users
        SET difficulty = ?,
            level = ?,
            score = ?,
            total_catches = ?,
            games_played = ?,
            progress_json = ?,
            saved_game_json = NULL,
            updated_at = ?
        WHERE id = ?
      `)
      .run(
        difficulty,
        level,
        score,
        totalCatches,
        gamesPlayed,
        JSON.stringify(progress),
        now,
        id
      );

    return this.findById(id);
  },

  updateSavedGame(id, savedGame) {
    const now = new Date().toISOString();
    getDb()
      .prepare(`
        UPDATE users
        SET saved_game_json = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(savedGame ? JSON.stringify(savedGame) : null, now, id);

    return this.findById(id);
  },

  updateSettings(id, { settings, difficulty, level }) {
    const now = new Date().toISOString();
    getDb()
      .prepare(`
        UPDATE users
        SET settings_json = ?,
            difficulty = ?,
            level = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(JSON.stringify(settings), difficulty, level, now, id);

    return this.findById(id);
  },

  findLeaderboard() {
    return getDb()
      .prepare(`
        SELECT id, name, difficulty, level, score, total_catches, games_played, updated_at
        FROM users
        ORDER BY score DESC, total_catches DESC, id ASC
      `)
      .all();
  },
};
