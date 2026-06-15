// localStorage save/load for the whole GameState blob.
const KEY = 'slimeby.save.v1';

export const SaveState = {
  save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { console.warn('save failed', e); return false; }
  },
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  has() { return !!localStorage.getItem(KEY); },
  clear() { localStorage.removeItem(KEY); },
};
