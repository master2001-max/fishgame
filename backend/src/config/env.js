import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'fishcatcher-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || path.join(BACKEND_ROOT, 'data', 'fishcatcher.db'),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ADMIN_SEED: {
    name: 'admin',
    email: 'admin@fishcatcher.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
};
