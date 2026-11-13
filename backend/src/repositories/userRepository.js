/**
 * User Repository Facade & Factory
 *
 * Location: backend/src/repositories/userRepository.js
 * Where it fits: Data Access Layer boundary.
 *
 * Why: Implements the Dependency Inversion Principle (DIP). The high-level Services
 * (authService, gameService) do not care whether the database is SQLite or Cloud Firestore.
 * This facade forwards all repository calls to the currently active database implementation
 * selected by the `DB_DRIVER` environment variable.
 */

import { env } from '../config/env.js';
import { sqliteUserRepository } from './sqliteUserRepository.js';
import { firestoreUserRepository } from './firestoreUserRepository.js';

export function getActiveRepository() {
  if (env.DB_DRIVER === 'firestore') {
    return firestoreUserRepository;
  }
  return sqliteUserRepository;
}

export const userRepository = {
  findById(id) {
    return getActiveRepository().findById(id);
  },

  findByIdentifier(identifier) {
    return getActiveRepository().findByIdentifier(identifier);
  },

  findByName(name) {
    return getActiveRepository().findByName(name);
  },

  findByEmail(email) {
    return getActiveRepository().findByEmail(email);
  },

  create(userData) {
    return getActiveRepository().create(userData);
  },

  updateMissionOutcome(id, outcome) {
    return getActiveRepository().updateMissionOutcome(id, outcome);
  },

  updateSavedGame(id, savedGame) {
    return getActiveRepository().updateSavedGame(id, savedGame);
  },

  updateSettings(id, settingsPayload) {
    return getActiveRepository().updateSettings(id, settingsPayload);
  },

  findLeaderboard(limit) {
    return getActiveRepository().findLeaderboard(limit);
  },
};
