import { SEEDED_HUNTERS, getHunterRankTitle } from './gameConfig.js';

const STORAGE_KEYS = {
  SETTINGS: 'fishcatcher_settings_v2',
  USER: 'fishcatcher_user_v2',
  STATS: 'fishcatcher_stats_v2',
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
  bestCombo: 0,
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
  return safeRead(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, settings);
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
  return safeRead(STORAGE_KEYS.STATS, DEFAULT_STATS);
}

export function recordGameStats({ score, catches, bestCombo }) {
  const prev = loadStats();
  const next = {
    bestScore: Math.max(prev.bestScore, score),
    totalCatches: prev.totalCatches + catches,
    gamesPlayed: prev.gamesPlayed + 1,
    bestCombo: Math.max(prev.bestCombo, bestCombo),
  };
  safeWrite(STORAGE_KEYS.STATS, next);
  return {
    stats: next,
    isNewHighScore: score > prev.bestScore && score > 0,
  };
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
