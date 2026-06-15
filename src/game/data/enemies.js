// =============================================================================
//  ENEMIES — "shadows" of corporate roles. Each has exactly ONE weakness so the
//  One More mechanic always has a target. ai: 'aggressive' | 'tactical'.
// =============================================================================
export const ENEMIES = {
  intern: {
    id: 'intern', name: 'Unpaid Intern', maxHp: 28, atk: 9, def: 4, agi: 8,
    weakness: 'tech', xp: 8, ai: 'aggressive', skills: ['e_slash'],
    model: { glb: null, body: 0x6b6b8a, accent: 0x222230, build: 'drone', height: 1.6 },
  },
  middlemgr: {
    id: 'middlemgr', name: 'Middle Manager', maxHp: 44, atk: 12, def: 7, agi: 7,
    weakness: 'mental', xp: 14, ai: 'tactical', skills: ['e_slash', 'e_audit'],
    model: { glb: null, body: 0x9a7b3c, accent: 0x2a210f, build: 'suit', height: 1.75 },
  },
  hrenforcer: {
    id: 'hrenforcer', name: 'HR Enforcer', maxHp: 52, atk: 13, def: 8, agi: 9,
    weakness: 'fire', xp: 16, ai: 'tactical', skills: ['e_slash', 'e_quota'],
    model: { glb: null, body: 0x4a8ac0, accent: 0x0f2233, build: 'suit', height: 1.8 },
  },
  auditbot: {
    id: 'auditbot', name: 'Audit Drone', maxHp: 36, atk: 11, def: 10, agi: 11,
    weakness: 'tech', xp: 12, ai: 'aggressive', skills: ['e_audit'],
    model: { glb: null, body: 0x888899, accent: 0x1b1b22, build: 'drone', height: 1.5 },
  },
  shill: {
    id: 'shill', name: 'Brand Shill', maxHp: 40, atk: 12, def: 6, agi: 12,
    weakness: 'mental', xp: 13, ai: 'aggressive', skills: ['e_slash', 'e_audit'],
    model: { glb: null, body: 0xff7a3c, accent: 0x33180a, build: 'casual', height: 1.7 },
  },
  saboteur: {
    id: 'saboteur', name: 'Union Buster', maxHp: 58, atk: 14, def: 9, agi: 8,
    weakness: 'fire', xp: 18, ai: 'tactical', skills: ['e_slash', 'e_quota'],
    model: { glb: null, body: 0x556070, accent: 0x14181f, build: 'suit', height: 1.9 },
  },

  // --- MINI-BOSS: shadow of an exploitative executive ---
  liquidator: {
    id: 'liquidator', name: 'The Liquidator', boss: true,
    maxHp: 220, atk: 17, def: 11, agi: 10,
    weakness: 'mental', xp: 80, ai: 'tactical',
    skills: ['e_slash', 'e_quota', 'e_audit', 'e_bonus'],
    model: { glb: null, body: 0xffd23c, accent: 0x33260a, build: 'boss', height: 2.6 },
    intro: 'Shadow of Maxorp\'s Chief Restructuring Officer — it turns people into severance lines.',
  },
};

export function getEnemy(id) { return ENEMIES[id]; }
