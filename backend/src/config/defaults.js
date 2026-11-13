/**
 * Game Configuration Defaults
 *
 * Location: backend/src/config/defaults.js
 * Where it fits: Configuration & Domain Models.
 *
 * Why: Defines the canonical default progress and settings state for newly enrolled hunters
 * in Cloud Firestore.
 */

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
