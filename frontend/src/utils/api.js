import { getAuthToken } from './storage';

const API_BASE = '/api';

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || 'Request failed.');
    err.status = response.status;
    throw err;
  }

  return data;
}

export const authApi = {
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me() {
    return request('/auth/me');
  },
};

export const gameApi = {
  getState() {
    return request('/game/state');
  },

  completeMission(payload) {
    return request('/game/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  saveSession(payload, { keepalive = false } = {}) {
    return request('/game/save-session', {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive,
    });
  },

  clearSession() {
    return request('/game/save-session', {
      method: 'DELETE',
    });
  },

  updateSettings(settings) {
    return request('/game/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getLeaderboard() {
    return request('/game/leaderboard');
  },

  // Third-Party Interoperability: Marc Conrad Fish Game API
  getPuzzleChallenge() {
    return request('/game/puzzle/challenge');
  },

  verifyPuzzle(payload) {
    return request('/game/puzzle/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
