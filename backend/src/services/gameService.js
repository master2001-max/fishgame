import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';

export const DIFFICULTIES = ['Easy', 'Normal', 'Hard'];
export const MAX_LEVEL = 6;

export function normalizeDifficulty(difficulty) {
  if (difficulty === 'Normal' || difficulty === 'Medium') return 'Normal';
  if (difficulty === 'Hard') return 'Hard';
  return 'Easy';
}

export function getHunterRankTitle(bestScore) {
  if (bestScore >= 3000) return 'Tide Sovereign';
  if (bestScore >= 2200) return 'Abyss Stalker';
  if (bestScore >= 1400) return 'Reef Master';
  if (bestScore >= 600) return 'Wave Tracker';
  return 'Deckhand';
}

function normalizeProgress(progress) {
  const normalized = {};
  for (const diff of DIFFICULTIES) {
    const entry = progress?.[diff] || {};
    const completed = Array.isArray(entry.completed)
      ? [...new Set(entry.completed.filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_LEVEL))].sort((a, b) => a - b)
      : [];
    const rawCurrent = Number(entry.currentLevel) || 1;
    const currentLevel = Math.max(1, Math.min(MAX_LEVEL, rawCurrent));
    normalized[diff] = { currentLevel, completed };
  }
  return normalized;
}

export const gameService = {
  buildClientState(user) {
    const progress = normalizeProgress(user.progress);
    const activeDifficulty = normalizeDifficulty(user.settings?.difficulty || user.difficulty);
    const currentLevel = progress[activeDifficulty].currentLevel;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        difficulty: activeDifficulty,
        level: currentLevel,
        score: user.score,
      },
      stats: {
        bestScore: user.score,
        totalCatches: user.totalCatches,
        gamesPlayed: user.gamesPlayed,
      },
      progress,
      settings: {
        music: Boolean(user.settings?.music ?? true),
        sfx: Boolean(user.settings?.sfx ?? true),
        difficulty: activeDifficulty,
        lureStyle: user.settings?.lureStyle || 'biolum',
      },
      savedGame: user.savedGame || null,
    };
  },

  completeMission(userId, { difficulty, level, score, catches, won }) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const safeDifficulty = normalizeDifficulty(difficulty);
    const numericLevel = Number(level);
    const safeScore = Math.max(0, Math.floor(Number(score) || 0));
    const safeCatches = Math.max(0, Math.floor(Number(catches) || 0));

    const progress = normalizeProgress(user.progress);
    const diffProgress = progress[safeDifficulty];

    // Enforce level-by-level progression: player cannot skip ahead
    if (!Number.isInteger(numericLevel) || numericLevel !== diffProgress.currentLevel) {
      throw new AppError(
        `Must play ${safeDifficulty} sequentially. Current level is ${diffProgress.currentLevel}.`,
        400
      );
    }

    const prevBest = user.score;
    const nextBest = Math.max(prevBest, safeScore);

    if (won) {
      if (!diffProgress.completed.includes(numericLevel)) {
        diffProgress.completed = [...diffProgress.completed, numericLevel].sort((a, b) => a - b);
      }
      if (numericLevel < MAX_LEVEL) {
        diffProgress.currentLevel = numericLevel + 1;
      }
    }

    const updatedUser = userRepository.updateMissionOutcome(userId, {
      difficulty: safeDifficulty,
      level: diffProgress.currentLevel,
      score: nextBest,
      totalCatches: user.totalCatches + safeCatches,
      gamesPlayed: user.gamesPlayed + 1,
      progress,
    });

    return {
      state: this.buildClientState(updatedUser),
      isNewHighScore: safeScore > prevBest && safeScore > 0,
    };
  },

  saveGameSession(userId, { difficulty, level, score, catches, timeLeft }) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const safeDifficulty = normalizeDifficulty(difficulty);
    const progress = normalizeProgress(user.progress);
    const expectedLevel = progress[safeDifficulty].currentLevel;
    const numericLevel = Number(level);

    if (!Number.isInteger(numericLevel) || numericLevel !== expectedLevel) {
      throw new AppError('Cannot save session for a locked or invalid level.', 400);
    }

    const cleanTimeLeft = Math.max(1, Math.floor(Number(timeLeft) || 0));
    const snapshot = {
      difficulty: safeDifficulty,
      level: numericLevel,
      score: Math.max(0, Math.floor(Number(score) || 0)),
      catches: Math.max(0, Math.floor(Number(catches) || 0)),
      timeLeft: cleanTimeLeft,
      savedAt: new Date().toISOString(),
    };

    const updatedUser = userRepository.updateSavedGame(userId, snapshot);
    return this.buildClientState(updatedUser);
  },

  clearGameSession(userId) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const updatedUser = userRepository.updateSavedGame(userId, null);
    return this.buildClientState(updatedUser);
  },

  updateSettings(userId, incomingSettings) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const progress = normalizeProgress(user.progress);
    const nextDifficulty = normalizeDifficulty(
      incomingSettings?.difficulty || user.settings?.difficulty || user.difficulty
    );
    const nextLevel = progress[nextDifficulty].currentLevel;

    const nextSettings = {
      music: Boolean(incomingSettings?.music ?? user.settings?.music ?? true),
      sfx: Boolean(incomingSettings?.sfx ?? user.settings?.sfx ?? true),
      difficulty: nextDifficulty,
      lureStyle: incomingSettings?.lureStyle || user.settings?.lureStyle || 'biolum',
    };

    const updatedUser = userRepository.updateSettings(userId, {
      settings: nextSettings,
      difficulty: nextDifficulty,
      level: nextLevel,
    });

    return this.buildClientState(updatedUser);
  },

  getLeaderboard(currentUserId) {
    const rows = userRepository.findLeaderboard();
    return rows.map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      name: row.name,
      score: row.score,
      difficulty: row.difficulty,
      level: row.level,
      totalCatches: row.total_catches,
      gamesPlayed: row.games_played,
      title: getHunterRankTitle(row.score),
      isCurrentUser: row.id === currentUserId,
    }));
  },
};
