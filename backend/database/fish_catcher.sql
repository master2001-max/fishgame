-- =======================================================
-- Fish Catcher Database Schema (MySQL / XAMPP)
-- Database Name: fish_catcher
-- Module: CIS045-3 Distributed Service Architectures
-- =======================================================

CREATE DATABASE IF NOT EXISTS `fish_catcher`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fish_catcher`;

-- -------------------------------------------------------
-- Table: users
-- Stores registered player identities, credentials,
-- cumulative statistics, sequential level progress, and game settings.
-- -------------------------------------------------------
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `difficulty` VARCHAR(20) NOT NULL DEFAULT 'Easy',
  `level` INT NOT NULL DEFAULT 1,
  `score` INT NOT NULL DEFAULT 0,
  `total_catches` INT NOT NULL DEFAULT 0,
  `games_played` INT NOT NULL DEFAULT 0,
  `progress` TEXT NOT NULL,
  `settings` TEXT NOT NULL,
  `saved_game` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: scores
-- Dedicated table for public leaderboard indexing and high scores.
-- Maintains a 1-to-1 relationship with the users table.
-- -------------------------------------------------------
CREATE TABLE `scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `difficulty` VARCHAR(20) NOT NULL DEFAULT 'Easy',
  `level` INT NOT NULL DEFAULT 1,
  `total_catches` INT NOT NULL DEFAULT 0,
  `games_played` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_leaderboard` (`score` DESC, `total_catches` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Sample Seed Data for Testing and Viva Demonstration
-- Passwords are hashed with password_hash('Password123', PASSWORD_BCRYPT)
-- Default test account: hunter@ocean.io / Password123
-- -------------------------------------------------------
INSERT INTO `users` (
  `id`, `name`, `email`, `password`, `difficulty`, `level`, `score`, `total_catches`, `games_played`, `progress`, `settings`, `saved_game`
) VALUES
(
  1,
  'NautilusExplorer',
  'hunter@ocean.io',
  '$2y$10$olRHl8VDGy4ZlinBJc83NeYaGyDbJc4RzIdTrnXjzrwxdkTDDqamS',
  'Normal',
  3,
  2450,
  18,
  5,
  '{"Easy":{"currentLevel":6,"completed":[1,2,3,4,5,6]},"Normal":{"currentLevel":3,"completed":[1,2]},"Hard":{"currentLevel":1,"completed":[]}}',
  '{"music":true,"sfx":true,"difficulty":"Normal","lureStyle":"biolum"}',
  NULL
),
(
  2,
  'AbyssMaster',
  'abyss@ocean.io',
  '$2y$10$olRHl8VDGy4ZlinBJc83NeYaGyDbJc4RzIdTrnXjzrwxdkTDDqamS',
  'Hard',
  4,
  3800,
  29,
  8,
  '{"Easy":{"currentLevel":6,"completed":[1,2,3,4,5,6]},"Normal":{"currentLevel":6,"completed":[1,2,3,4,5,6]},"Hard":{"currentLevel":4,"completed":[1,2,3]}}',
  '{"music":true,"sfx":true,"difficulty":"Hard","lureStyle":"solar"}',
  NULL
),
(
  3,
  'CoralDrifter',
  'coral@ocean.io',
  '$2y$10$olRHl8VDGy4ZlinBJc83NeYaGyDbJc4RzIdTrnXjzrwxdkTDDqamS',
  'Easy',
  2,
  950,
  7,
  2,
  '{"Easy":{"currentLevel":2,"completed":[1]},"Normal":{"currentLevel":1,"completed":[]},"Hard":{"currentLevel":1,"completed":[]}}',
  '{"music":true,"sfx":true,"difficulty":"Easy","lureStyle":"steel"}',
  NULL
);

INSERT INTO `scores` (
  `user_id`, `name`, `score`, `difficulty`, `level`, `total_catches`, `games_played`
) VALUES
(2, 'AbyssMaster', 3800, 'Hard', 4, 29, 8),
(1, 'NautilusExplorer', 2450, 'Normal', 3, 18, 5),
(3, 'CoralDrifter', 950, 'Easy', 2, 7, 2);
