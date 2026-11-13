import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { gameService } from './gameService.js';
import { AppError } from '../utils/appError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ userId: user.id, name: user.name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export const authService = {
  register({ name, email, password }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (cleanName.length < 2 || cleanName.length > 32) {
      throw new AppError('Hunter name must be between 2 and 32 characters.', 400);
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new AppError('Please enter a valid email address.', 400);
    }
    if (rawPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters.', 400);
    }

    if (userRepository.findByName(cleanName)) {
      throw new AppError('That hunter name is already taken.', 409);
    }
    if (userRepository.findByEmail(cleanEmail)) {
      throw new AppError('That email is already registered.', 409);
    }

    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const user = userRepository.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
    });

    return {
      token: signToken(user),
      state: gameService.buildClientState(user),
    };
  },

  login({ identifier, password }) {
    const cleanIdentifier = String(identifier || '').trim();
    const rawPassword = String(password || '');

    if (!cleanIdentifier || !rawPassword) {
      throw new AppError('Username/email and password are required.', 400);
    }

    const user = userRepository.findByIdentifier(cleanIdentifier);
    if (!user || !bcrypt.compareSync(rawPassword, user.password)) {
      throw new AppError('Invalid username/email or password.', 401);
    }

    return {
      token: signToken(user),
      state: gameService.buildClientState(user),
    };
  },

  getProfile(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new AppError('Account not found.', 401);
    }
    return gameService.buildClientState(user);
  },
};
