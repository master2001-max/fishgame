/**
 * Unit Tests: Repository Layer & Dependency Inversion
 *
 * Location: backend/tests/repository.test.js
 * Purpose: Verifies repository abstraction contracts and data mapping.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { userRepository, getActiveRepository } from '../src/repositories/userRepository.js';

describe('Repository Layer (Dependency Inversion)', () => {
  it('should resolve active repository based on DB_DRIVER environment setting', () => {
    const activeRepo = getActiveRepository();
    assert.ok(activeRepo, 'Active repository should be defined');
    assert.strictEqual(typeof activeRepo.findById, 'function');
    assert.strictEqual(typeof activeRepo.create, 'function');
    assert.strictEqual(typeof activeRepo.findLeaderboard, 'function');
  });

  it('should find user by identifier using repository facade', async () => {
    // Queries the migrated admin account in Firestore
    const user = await userRepository.findByIdentifier('admin@fishcatcher.local');
    assert.ok(user, 'User should be found in Firestore');
    assert.strictEqual(user.name, 'admin');
    assert.strictEqual(user.email, 'admin@fishcatcher.local');
    assert.ok(user.progress, 'Progress object should exist');
  });

  it('should retrieve leaderboard rows ordered properly', async () => {
    const rows = await userRepository.findLeaderboard(10);
    assert.ok(Array.isArray(rows), 'Leaderboard should return an array');
    assert.ok(rows.length > 0, 'Leaderboard should contain at least 1 entry');
    assert.strictEqual(rows[0].name, 'admin');
  });
});
