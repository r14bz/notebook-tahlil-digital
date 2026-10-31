const STORAGE_KEYS = Object.freeze({
  page: 'tahlil-page',
  pageLayout: 'etahlil-page-layout-v1',
  theme: 'etahlil-theme'
});

// Memory fallback keeps preferences usable for the current session when browser
// storage is blocked (for example, in a restrictive/private browsing context).
const memoryPreferences = new Map();

export function readPreference(key, fallback = null) {
  const storageKey = STORAGE_KEYS[key] || key;
  try {
    const value = localStorage.getItem(storageKey);
    if (value !== null) {
      memoryPreferences.set(storageKey, value);
      return value;
    }
  } catch {
    // Continue with the in-memory copy below.
  }
  return memoryPreferences.has(storageKey) ? memoryPreferences.get(storageKey) : fallback;
}

export function writePreference(key, value) {
  const storageKey = STORAGE_KEYS[key] || key;
  const serialized = String(value);
  memoryPreferences.set(storageKey, serialized);
  try {
    localStorage.setItem(storageKey, serialized);
    return true;
  } catch {
    return false;
  }
}

export function readJsonPreference(key, fallback = {}) {
  try {
    const value = readPreference(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeJsonPreference(key, value) {
  try {
    return writePreference(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
