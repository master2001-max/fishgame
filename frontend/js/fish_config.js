/**
 * ========================================================
 * FISH CATCHER - DEVELOPER FISH & GAMEPLAY CONFIGURATION
 * File: frontend/js/fish_config.js
 * ========================================================
 * 
 * DEVELOPER GUIDE:
 * 
 * 1. HOW TO CHANGE MARKS (POINTS) FOR A FISH:
 *    Find the fish below and update its 'points' value.
 *    Example: points: 250
 * 
 * 2. HOW TO ADD A BRAND NEW FISH:
 *    Copy any existing fish object below, add it to FISH_SPECIES,
 *    and customize its name, points, speed, colors, and depth.
 *    The game engine automatically spawns and renders it!
 * 
 * 3. HOW TO MAKE A FISH TRIGGER DR. MARC CONRAD'S API RIDDLE:
 *    Set 'isSpecial: true'. When the player's hook touches this fish,
 *    the game automatically pauses and summons a procedural counting riddle!
 * 
 * 4. HOW TO ADJUST SWIMMING DEPTH:
 *    minDepth: pixels from water surface to highest point it can swim.
 *    maxDepth: pixels from water surface to deepest point it can swim.
 * ========================================================
 */

const FISH_SPECIES = [
    {
        id: 'clownfish',
        name: 'Striped Clownfish',
        points: 40,               // DEVELOPER: Marks awarded on catch
        rarity: 'Common',
        isSpecial: false,         // Set true to activate Marc Conrad API puzzle
        speedBase: 1.15,          // Swimming speed
        sizeX: 13,                // Width (hitbox & visual scale)
        sizeY: 6.5,               // Height
        color: '#fb923c',         // Primary body color
        accentColor: '#fdba74',   // Striping color
        bellyColor: '#ffffff',    // Belly highlight
        glow: null,               // No bioluminescent glow
        minDepth: 75,             // Shallow water layer (pixels from surface)
        maxDepth: 190,
    },
    {
        id: 'tang',
        name: 'Azure Tang',
        points: 75,
        rarity: 'Common',
        isSpecial: false,
        speedBase: 1.45,
        sizeX: 15,
        sizeY: 8,
        color: '#38bdf8',
        accentColor: '#0284c7',
        bellyColor: '#bae6fd',
        glow: null,
        minDepth: 100,
        maxDepth: 250,
    },
    {
        id: 'barb',
        name: 'Gilded Barb',
        points: 110,
        rarity: 'Uncommon',
        isSpecial: false,
        speedBase: 1.85,
        sizeX: 17,
        sizeY: 8.5,
        color: '#fbbf24',
        accentColor: '#d97706',
        bellyColor: '#fef3c7',
        glow: 'rgba(251, 191, 36, 0.45)',
        minDepth: 130,
        maxDepth: 310,
    },
    {
        id: 'redfin',
        name: 'Crimson Redfin',
        points: 160,
        rarity: 'Uncommon',
        isSpecial: false,
        speedBase: 2.15,
        sizeX: 19,
        sizeY: 9.5,
        color: '#f43f5e',
        accentColor: '#be123c',
        bellyColor: '#ffe4e6',
        glow: 'rgba(244, 63, 94, 0.45)',
        minDepth: 170,
        maxDepth: 350,
    },
    {
        id: 'angelfish',
        name: 'Phantom Angelfish',
        points: 220,
        rarity: 'Rare',
        isSpecial: false,
        speedBase: 2.55,
        sizeX: 21,
        sizeY: 13,
        color: '#c084fc',
        accentColor: '#7e22ce',
        bellyColor: '#f3e8ff',
        glow: 'rgba(192, 132, 252, 0.6)',
        minDepth: 210,
        maxDepth: 390,
    },
    {
        id: 'biolume',
        name: 'Abyssal Biolume',
        points: 300,
        rarity: 'Mythic',
        isSpecial: false,
        speedBase: 2.85,
        sizeX: 24,
        sizeY: 11,
        color: '#2dd4bf',
        accentColor: '#0f766e',
        bellyColor: '#ccfbf1',
        glow: 'rgba(45, 212, 191, 0.85)',
        minDepth: 260,
        maxDepth: 420,
    },
    {
        // ========================================================
        // SPECIAL FISH: DR. MARC CONRAD'S API RIDDLE CHALLENGER
        // ========================================================
        id: 'oracle',
        name: 'Golden Oracle of Conrad',
        points: 150,              // Base catch points (Bonus +200 marks awarded via API riddle)
        rarity: 'Legendary',
        isSpecial: true,          // AUTOMATICALLY triggers Dr. Marc Conrad's Fish API challenge!
        speedBase: 2.2,           // Smooth, catchable swimming speed
        sizeX: 18,
        sizeY: 9,
        color: '#fbbf24',
        accentColor: '#f59e0b',
        bellyColor: '#fffbeb',
        glow: 'rgba(251, 191, 36, 0.95)',
        minDepth: 160,
        maxDepth: 390,
    },
];

/**
 * Difficulty Configuration Table
 * Controls mission timers, fish population, and hazards.
 */
const DIFFICULTY_CONFIG = {
    Easy: {
        duration: 90,           // 1.5 minutes
        speedMultiplier: 0.65,
        scoreMultiplier: 0.5,
        jellyfishCount: 0,      // Calm reef: no jellyfish
        zapPenalty: 0,
        dropSpeed: 7.4,
        retractSpeed: 9.2,
        fishCount: 9,
    },
    Normal: {
        duration: 60,           // 1.0 minute
        speedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        jellyfishCount: 1,      // 1 pulsing jellyfish hazard
        zapPenalty: 120,        // Penalty marks deducted on electric zap
        dropSpeed: 8.6,
        retractSpeed: 10.4,
        fishCount: 11,
    },
    Hard: {
        duration: 30,           // 30 seconds
        speedMultiplier: 1.45,
        scoreMultiplier: 2.0,
        jellyfishCount: 2,      // 2 dangerous jellyfish hazards
        zapPenalty: 280,
        dropSpeed: 9.8,
        retractSpeed: 11.6,
        fishCount: 13,
    },
};

/**
 * Level Target Marks (Levels 1 to 6)
 */
const LEVEL_TARGET_MARKS = {
    Easy:   [350, 500, 650, 850, 1050, 1250],
    Normal: [800, 1100, 1400, 1700, 2000, 2300],
    Hard:   [1400, 1800, 2150, 2500, 2850, 3200],
};

// Explicitly bind to window for global access across all game modules & developer inspection
if (typeof window !== 'undefined') {
    window.FISH_SPECIES = FISH_SPECIES;
    window.DIFFICULTY_CONFIG = DIFFICULTY_CONFIG;
    window.LEVEL_TARGET_MARKS = LEVEL_TARGET_MARKS;
}
