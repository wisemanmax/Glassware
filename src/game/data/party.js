// =============================================================================
//  PARTY — Slime By + one ally for the slice. Data-driven stats + learnsets.
//  `model` drives the procedural CharacterFactory; set `model.glb` to a path to
//  swap in a real rigged GLB (AssetManager handles the rest).
// =============================================================================
export const PARTY = [
  {
    id: 'sb',
    name: 'Slime By',
    role: 'leader',
    startLevel: 1,
    maxHp: 70, maxSp: 40, atk: 14, def: 9, agi: 12,
    weakness: null, // the hero has no exploitable weakness
    model: { glb: null, body: 0x9dff3c, accent: 0x143b08, build: 'slime', height: 1.85 },
    skills: ['strike', 'acidlash', 'ooze'],
    learnset: [
      { level: 2, skillId: 'dissolve' },
      { level: 4, skillId: 'overload' },
    ],
  },
  {
    id: 'riff',
    name: 'Riff',
    role: 'ally',
    startLevel: 1,
    maxHp: 58, maxSp: 46, atk: 12, def: 7, agi: 14,
    weakness: 'fire',
    model: { glb: null, body: 0xff2d8b, accent: 0x2a0a18, build: 'punk', height: 1.78 },
    skills: ['strike', 'feedback', 'amppush', 'rally'],
    learnset: [
      { level: 3, skillId: 'encore' },
    ],
  },
];

export function getPartyDef(id) { return PARTY.find((p) => p.id === id); }

// XP needed to reach the next level (index = current level).
export const XP_CURVE = [0, 12, 30, 56, 90, 140, 200];
export function xpForLevel(level) { return XP_CURVE[level] ?? (200 + (level - 6) * 80); }
