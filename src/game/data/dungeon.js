// =============================================================================
//  DUNGEON — the Maxorp Tower "Palace". A short LINEAR level: the player walks
//  a corridor of segments; encounter triggers fire combat; the final segment is
//  the mini-boss. Encounters reference enemy ids from enemies.js.
// =============================================================================
export const ENCOUNTERS = {
  tutorial: { id: 'tutorial', enemies: ['intern'], banner: 'COGNITION BLOCKING THE WAY' },
  e1:       { id: 'e1', enemies: ['intern', 'auditbot'], banner: 'SECURITY SHADOWS' },
  e2:       { id: 'e2', enemies: ['middlemgr', 'intern'], banner: 'MANAGEMENT LAYER' },
  e3:       { id: 'e3', enemies: ['hrenforcer', 'auditbot'], banner: 'COMPLIANCE WALL' },
  boss:     { id: 'boss', enemies: ['liquidator'], banner: 'THE LIQUIDATOR', boss: true },
};

// Linear path through the tower. Each segment is a stretch of corridor; some
// have an encounter trigger at their end, the last triggers the boss framing.
export const DUNGEON = {
  id: 'maxorp_tower',
  name: 'Maxorp Tower of Endless Growth',
  // z-progression: player walks from z=0 toward negative z through segments.
  segments: [
    { id: 's0', label: 'Lobby — "Welcome, Asset"', length: 18, encounter: null },
    { id: 's1', label: 'Open-Plan Floor', length: 18, encounter: 'e1' },
    { id: 's2', label: 'Performance Review Wing', length: 18, encounter: 'e2' },
    { id: 's3', label: 'Compliance Gauntlet', length: 18, encounter: 'e3' },
    { id: 's4', label: 'Executive Suite', length: 14, encounter: 'boss', dialogue: 'boss_intro' },
  ],
};

export function getEncounter(id) { return ENCOUNTERS[id]; }
