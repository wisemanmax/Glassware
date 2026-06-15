// =============================================================================
//  GameState — single source of truth. Everything serializable lives here so
//  SaveState can snapshot the whole game in one JSON blob.
// =============================================================================
import { PARTY } from '../data/party.js';
import { CONFIDANTS } from '../data/confidants.js';

const STAT_KEYS = ['resolve', 'charm', 'knowledge', 'guts'];

// Points needed to reach the NEXT social-stat rank (index = current rank).
export const STAT_THRESHOLDS = [0, 3, 7, 12, 18, 25];
// Points needed per confidant rank.
export const CONFIDANT_THRESHOLDS = [0, 2, 5, 9];

function freshParty() {
  // runtime copy of each party member with level/xp/hp persisted
  const out = {};
  for (const def of PARTY) {
    out[def.id] = {
      id: def.id,
      level: def.startLevel ?? 1,
      xp: 0,
      hp: def.maxHp,
      sp: def.maxSp,
      skills: [...def.skills],
    };
  }
  return out;
}

function freshConfidants() {
  const out = {};
  for (const c of CONFIDANTS) out[c.id] = { rank: 0, points: 0, metScene: false };
  return out;
}

export function newGame() {
  return {
    version: 1,
    storyProgress: 'intro', // intro | tutorial | hub | dungeon | boss | confidant | ending
    day: 1,
    block: 0, // index into ['day','evening']
    location: 'hub',
    stats: { resolve: 1, charm: 1, knowledge: 1, guts: 1 },
    statPoints: { resolve: 0, charm: 0, knowledge: 0, guts: 0 },
    confidants: freshConfidants(),
    party: freshParty(),
    items: { medigel: 3 },
    flags: {},          // arbitrary story flags
    log: [],            // recent events for UI
  };
}

// ---- stat helpers -----------------------------------------------------------
export function statRank(state, key) { return state.stats[key]; }

export function addStatPoints(state, key, amount) {
  state.statPoints[key] += amount;
  let leveled = false;
  while (
    state.stats[key] < STAT_THRESHOLDS.length - 1 &&
    state.statPoints[key] >= STAT_THRESHOLDS[state.stats[key] + 1]
  ) {
    state.stats[key]++;
    leveled = true;
  }
  return leveled;
}

// ---- confidant helpers ------------------------------------------------------
export function addConfidantPoints(state, id, amount) {
  const c = state.confidants[id];
  if (!c) return false;
  c.points += amount;
  const cap = CONFIDANT_THRESHOLDS.length - 1;
  let ranked = false;
  while (c.rank < cap && c.points >= CONFIDANT_THRESHOLDS[c.rank + 1]) {
    c.rank++;
    ranked = true;
  }
  return ranked;
}

export const STATS = STAT_KEYS;
