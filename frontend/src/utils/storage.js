const TOKEN_KEY = 'fishcatcher_auth_token';

const LEGACY_KEYS = [
  'fishcatcher_settings_v2',
  'fishcatcher_user_v2',
  'fishcatcher_stats_v2',
  'fishcatcher_progress_v1',
];

export function clearLegacyTempData() {
  try {
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getAuthToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthToken() {
  setAuthToken('');
}
