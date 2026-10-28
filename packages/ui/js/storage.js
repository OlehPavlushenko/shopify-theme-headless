/**
 * Browser storage that never throws (private mode, blocked site data, a full quota): localStorage,
 * or sessionStorage with { session: true }. Callers keep working without it (the value then lasts
 * for the page only, or not at all).
 *
 *   get(key, { session }) → the stored string, or null
 *   set(key, value, { session }) → true when stored
 *   getJSON(key, fallback = null, { session }) → the parsed value; fallback when missing or unreadable
 *   setJSON(key, value, { session }) → true when stored
 */
const area = (session) => (session ? sessionStorage : localStorage);

export function get(key, { session = false } = {}) {
  try {
    return area(session).getItem(key);
  } catch {
    return null;
  }
}

export function set(key, value, { session = false } = {}) {
  try {
    area(session).setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function getJSON(key, fallback = null, options) {
  const text = get(key, options);
  if (text === null) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value, options) {
  try {
    return set(key, JSON.stringify(value), options);
  } catch {
    return false;
  }
}
