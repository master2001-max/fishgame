export const FISH_SPECIES = [
  {
    id: 'snapper',
    name: 'Golden Snapper',
    points: 100,
    rarity: 'Common',
    speedBase: 1.75,
    sizeX: 38,
    sizeY: 18,
    color: '#fbbf24',
    accentColor: '#d97706',
    bellyColor: '#fef3c7',
    glow: 'rgba(251, 191, 36, 0.25)',
    minDepth: 115,
    maxDepth: 250,
    minLevel: 1,
  },
  {
    id: 'tetra',
    name: 'Neon Blue Tetra',
    points: 120,
    rarity: 'Common',
    speedBase: 2.1,
    sizeX: 33,
    sizeY: 15,
    color: '#22d3ee',
    accentColor: '#0284c7',
    bellyColor: '#cffafe',
    glow: 'rgba(34, 211, 238, 0.35)',
    minDepth: 135,
    maxDepth: 320,
    minLevel: 1,
  },
  {
    id: 'barb',
    name: 'Emerald Barb',
    points: 150,
    rarity: 'Uncommon',
    speedBase: 2.0,
    sizeX: 41,
    sizeY: 20,
    color: '#34d399',
    accentColor: '#047857',
    bellyColor: '#d1fae5',
    glow: 'rgba(52, 211, 153, 0.3)',
    minDepth: 170,
    maxDepth: 355,
    minLevel: 1,
  },
  {
    id: 'redfin',
    name: 'Ruby Redfin',
    points: 180,
    rarity: 'Uncommon',
    speedBase: 2.35,
    sizeX: 46,
    sizeY: 21,
    color: '#fb7185',
    accentColor: '#be123c',
    bellyColor: '#ffe4e6',
    glow: 'rgba(251, 113, 133, 0.32)',
    minDepth: 200,
    maxDepth: 385,
    minLevel: 1,
  },
  {
    id: 'angelfish',
    name: 'Violet Angelfish',
    points: 250,
    rarity: 'Rare',
    speedBase: 2.55,
    sizeX: 42,
    sizeY: 25,
    color: '#a78bfa',
    accentColor: '#6d28d9',
    bellyColor: '#ede9fe',
    glow: 'rgba(167, 139, 250, 0.42)',
    minDepth: 245,
    maxDepth: 405,
    minLevel: 1,
  },
  {
    id: 'biolume',
    name: 'Abyssal Biolume',
    points: 400,
    rarity: 'Mythic',
    speedBase: 3.15,
    sizeX: 44,
    sizeY: 19,
    color: '#fde047',
    accentColor: '#06b6d4',
    bellyColor: '#fef9c3',
    glow: 'rgba(253, 224, 71, 0.6)',
    minDepth: 280,
    maxDepth: 415,
    minLevel: 1,
  },
];

export const DIFFICULTY_ORDER = ['Easy', 'Normal', 'Hard'];
export const LEVELS_PER_DIFFICULTY = 6;

export const DIFFICULTY_CONFIG = {
  Easy: {
    name: 'Easy',
    label: 'Calm Reef',
    duration: 90,
    timeLabel: '1.5 min',
    speedLabel: 'Slow',
    marksLabel: 'Low Marks',
    badge: '1.5m · Slow',
    description: '1.5 min timer, slow fish speed, and low target marks.',
    speedMultiplier: 0.65,
    scoreMultiplier: 0.5,
    jellyfishCount: 0,
    zapPenalty: 0,
    dropSpeed: 7.4,
    retractSpeed: 8.4,
    fishCount: 8,
    levelTargets: [350, 500, 650, 850, 1050, 1250],
  },
  Normal: {
    name: 'Normal',
    label: 'Open Trench',
    duration: 60,
    timeLabel: '1 min',
    speedLabel: 'Average Speed',
    marksLabel: 'Average Marks',
    badge: '1m · Average',
    description: '1 min timer, average fish speed, average marks, 1 jellyfish.',
    speedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    jellyfishCount: 1,
    zapPenalty: 75,
    dropSpeed: 8.2,
    retractSpeed: 9.2,
    fishCount: 8,
    levelTargets: [800, 1100, 1400, 1700, 2000, 2300],
  },
  Hard: {
    name: 'Hard',
    label: 'Abyssal Surge',
    duration: 30,
    timeLabel: '30s',
    speedLabel: 'Fast Speed',
    marksLabel: 'High Marks',
    badge: '30s · Fast',
    description: '30s timer, fast fish speed, high marks, 2 jellyfish hazards.',
    speedMultiplier: 1.45,
    scoreMultiplier: 2.0,
    jellyfishCount: 2,
    zapPenalty: 100,
    dropSpeed: 9.5,
    retractSpeed: 10.5,
    fishCount: 9,
    levelTargets: [1400, 1800, 2150, 2500, 2850, 3200],
  },
};

export function normalizeDifficulty(difficulty) {
  if (difficulty === 'Medium' || difficulty === 'Normal') return 'Normal';
  if (difficulty === 'Hard') return 'Hard';
  return 'Easy';
}

export function getLevelTargetMarks(difficulty, level) {
  const safeDiff = normalizeDifficulty(difficulty);
  const conf = DIFFICULTY_CONFIG[safeDiff];
  const idx = Math.max(0, Math.min(LEVELS_PER_DIFFICULTY - 1, (level || 1) - 1));
  return conf.levelTargets[idx];
}

export function getNextStage(difficulty, level) {
  const safeDiff = normalizeDifficulty(difficulty);
  const safeLevel = Math.max(1, Math.min(LEVELS_PER_DIFFICULTY, level || 1));

  if (safeLevel < LEVELS_PER_DIFFICULTY) {
    return { difficulty: safeDiff, level: safeLevel + 1 };
  }
  if (safeDiff === 'Easy') {
    return { difficulty: 'Normal', level: 1 };
  }
  if (safeDiff === 'Normal') {
    return { difficulty: 'Hard', level: 1 };
  }
  return null;
}

export const LURE_STYLES = {
  steel: {
    id: 'steel',
    name: 'Classic Steel',
    lineColor: 'rgba(226, 232, 240, 0.85)',
    hookColor: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.45)',
    previewHex: '#cbd5e1',
  },
  biolum: {
    id: 'biolum',
    name: 'Biolume Cyan',
    lineColor: 'rgba(103, 232, 249, 0.9)',
    hookColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.85)',
    previewHex: '#22d3ee',
  },
  solar: {
    id: 'solar',
    name: 'Solar Gold',
    lineColor: 'rgba(253, 224, 71, 0.9)',
    hookColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.85)',
    previewHex: '#fbbf24',
  },
};

export function getHunterRankTitle(bestScore) {
  if (bestScore >= 3000) return 'Tide Sovereign';
  if (bestScore >= 2200) return 'Abyss Stalker';
  if (bestScore >= 1400) return 'Reef Master';
  if (bestScore >= 600) return 'Wave Tracker';
  return 'Deckhand';
}
