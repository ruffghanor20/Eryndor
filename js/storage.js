export const SAVE_KEY = "rpg_texto_v4_aaa_save";

export function saveToStorage(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadFromStorage() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearStorage() {
  localStorage.removeItem(SAVE_KEY);
}
