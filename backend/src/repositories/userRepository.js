/**
 * User Repository Facade
 *
 * Location: backend/src/repositories/userRepository.js
 * Where it fits: Data Access Layer boundary.
 *
 * Why: Implements the Dependency Inversion Principle (DIP). Services (authService, gameService)
 * interact with this repository contract, decoupling domain logic from the underlying
 * Cloud Firestore SDK calls.
 */

import { firestoreUserRepository } from './firestoreUserRepository.js';

export const userRepository = firestoreUserRepository;
export const getActiveRepository = () => firestoreUserRepository;
