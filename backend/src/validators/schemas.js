/**
 * Central Zod Validation Schemas
 *
 * Location: backend/src/validators/schemas.js
 * Where it fits: Validation layer. Used by validateBody middleware across routes.
 *
 * Why: Single Source of Truth for API request formats, enforcing types, lengths,
 * and valid enumerations to ensure high data integrity in Firestore.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Hunter name is required' })
    .trim()
    .min(2, 'Hunter name must be at least 2 characters')
    .max(32, 'Hunter name cannot exceed 32 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
});

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Username or email is required' })
    .trim()
    .min(1, 'Username or email is required'),
  password: z.string().optional(),
});

export const completeMissionSchema = z.object({
  difficulty: z.enum(['Easy', 'Normal', 'Hard', 'Medium']),
  level: z.number().int().min(1).max(6),
  score: z.number().min(0),
  catches: z.number().int().min(0),
  won: z.boolean(),
});

export const saveSessionSchema = z.object({
  difficulty: z.enum(['Easy', 'Normal', 'Hard', 'Medium']),
  level: z.number().int().min(1).max(6),
  score: z.number().min(0),
  catches: z.number().int().min(0),
  timeLeft: z.number().min(1),
});

export const updateSettingsSchema = z.object({
  music: z.boolean().optional(),
  sfx: z.boolean().optional(),
  difficulty: z.enum(['Easy', 'Normal', 'Hard', 'Medium']).optional(),
  lureStyle: z.enum(['steel', 'biolum', 'solar']).optional(),
});

export const puzzleVerifySchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  answer: z.coerce.number().int().min(0, 'Answer must be a non-negative number').max(99),
});
