const STORAGE_KEYS = Object.freeze({
  page: 'tahlil-page',
  pageLayout: 'etahlil-page-layout-v1',
  theme: 'etahlil-theme'
});

export function readPreference(key, fallback = null) {
  try {
    const value = localStorage.getItem(STORAGE_KEYS[key] || key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function writePreference(key, value) {
  try {
    localStorage.setItem(STORAGE_KEYS[key] || key, String(value));
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
