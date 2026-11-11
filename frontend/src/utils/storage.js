import {
  LEVELS_PER_DIFFICULTY,
  SEEDED_HUNTERS,
  getHunterRankTitle,
  normalizeDifficulty,
} from './gameConfig.js';

const STORAGE_KEYS = {
  SETTINGS: 'fishcatcher_settings_v2',
  USER: 'fishcatcher_user_v2',
  STATS: 'fishcatcher_stats_v2',
  PROGRESS: 'fishcatcher_progress_v1',
};

export const DEFAULT_SETTINGS = {
  music: true,
  sfx: true,
  difficulty: 'Easy',
  lureStyle: 'biolum',
};

export const DEFAULT_STATS = {
  bestScore: 0,
  totalCatches: 0,
  gamesPlayed: 0,
};

export const DEFAULT_PROGRESS = {
  completed: {
    Easy: [],
    Normal: [],
    Hard: [],
  },
};

function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function loadSettings() {
  const loaded = safeRead(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...loaded,
    difficulty: normalizeDifficulty(loaded.difficulty),
  };
}

export function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, {
    ...settings,
    difficulty: normalizeDifficulty(settings.difficulty),
  });
}

export function loadUser() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.USER) || '';
  } catch {
    return '';
  }
}

export function saveUser(username) {
  try {
    if (username) {
      window.localStorage.setItem(STORAGE_KEYS.USER, username);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadStats() {
  const loaded = safeRead(STORAGE_KEYS.STATS, DEFAULT_STATS);
  return {
    bestScore: Number(loaded.bestScore) || 0,
    totalCatches: Number(loaded.totalCatches) || 0,
    gamesPlayed: Number(loaded.gamesPlayed) || 0,
  };
}

export function recordGameStats({ score, catches }) {
  const prev = loadStats();
  const next = {
    bestScore: Math.max(prev.bestScore, score),
    totalCatches: prev.totalCatches + catches,
    gamesPlayed: prev.gamesPlayed + 1,
  };
  safeWrite(STORAGE_KEYS.STATS, next);
  return {
    stats: next,
    isNewHighScore: score > prev.bestScore && score > 0,
  };
}

export function loadProgress() {
  const raw = safeRead(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
  const completed = raw.completed || {};
  const sanitizeList = (list) =>
    Array.isArray(list)
      ? [...new Set(list.filter((n) => Number.isInteger(n) && n >= 1 && n <= LEVELS_PER_DIFFICULTY))]
      : [];
  return {
    completed: {
      Easy: sanitizeList(completed.Easy),
      Normal: sanitizeList(completed.Normal),
      Hard: sanitizeList(completed.Hard),
    },
  };
}

export function markLevelCompleted(difficulty, level) {
  const safeDiff = normalizeDifficulty(difficulty);
  const safeLevel = Math.max(1, Math.min(LEVELS_PER_DIFFICULTY, level));
  const prev = loadProgress();
  const list = prev.completed[safeDiff] || [];
  if (list.includes(safeLevel)) {
    return prev;
  }
  const next = {
    completed: {
      ...prev.completed,
      [safeDiff]: [...list, safeLevel].sort((a, b) => a - b),
    },
  };
  safeWrite(STORAGE_KEYS.PROGRESS, next);
  return next;
}

export function getNextIncompleteLevel(progress, difficulty) {
  const safeDiff = normalizeDifficulty(difficulty);
  const completed = progress?.completed?.[safeDiff] || [];
  for (let lv = 1; lv <= LEVELS_PER_DIFFICULTY; lv++) {
    if (!completed.includes(lv)) return lv;
  }
  return 1;
}

export function getRankedLeaderboard(currentUsername, currentBestScore) {
  const playerName = (currentUsername || 'Guest Hunter').trim();
  const normalizedPlayer = playerName.toLowerCase();

  const entries = SEEDED_HUNTERS.map((h) => ({ ...h, isCurrentUser: false }));
  const existingIdx = entries.findIndex(
    (entry) => entry.name.toLowerCase() === normalizedPlayer
  );

  if (existingIdx >= 0) {
    entries[existingIdx] = {
      ...entries[existingIdx],
      score: Math.max(entries[existingIdx].score, currentBestScore),
      isCurrentUser: true,
    };
  } else {
    entries.push({
      name: playerName,
      score: currentBestScore,
      title: getHunterRankTitle(currentBestScore),
      isCurrentUser: true,
    });
  }

  entries.sort((a, b) => b.score - a.score);

  return entries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}
