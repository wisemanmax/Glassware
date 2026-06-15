// =============================================================================
//  SLIME BY — BRAND & LORE HOOKS
// =============================================================================
//  This is the ONE file to make the game yours. Everything below is a
//  placeholder you can overwrite without touching engine code. Names, voice,
//  factions, colors, and the awakening line all read from here.
//
//  Drop real 3D models: put a `.glb` path on a character def in party.js /
//  enemies.js / confidants.js (field `model.glb`). The AssetManager prefers it
//  automatically and falls back to the procedural placeholder when absent.
// =============================================================================

export const BRAND = {
  hero: {
    codename: 'Slime By',        // the public/brand name
    realName: 'SB',              // what allies call them
    // The line SB says at the awakening moment (stepping into their power):
    awakeningLine: "You ran the numbers on everyone but yourself. My turn.",
    tagline: 'Saving the world from corporate America.',
  },

  // Signature color identity — dark with bright accents (NOT P5 red).
  // Acid-slime green primary, hot magenta secondary, on deep ink.
  colors: {
    ink:      '#0a0a0f',   // base background
    panel:    '#141420',   // UI panel fill
    slime:    '#9dff3c',   // PRIMARY accent (acid-slime green)
    magenta:  '#ff2d8b',   // SECONDARY accent
    cyan:     '#38e8ff',   // tertiary / tech type
    bone:     '#f4f4f8',   // text
    danger:   '#ff3b3b',
  },

  // Damage-type identity (color + label) — used by combat UI.
  damageTypes: {
    phys:   { label: 'PHYS',   color: '#f4f4f8' },
    tech:   { label: 'TECH',   color: '#38e8ff' },
    mental: { label: 'MENTAL', color: '#b06bff' },
    fire:   { label: 'FIRE',   color: '#ff7a3c' },
  },

  // Faction / antagonist placeholders — rename freely.
  factions: {
    crew: 'The Overflow',          // SB's rebel collective
    enemyCorp: 'Maxorp',           // the conglomerate
    enemyCorpLong: 'Maxorp Global Holdings',
  },

  antagonist: {
    name: 'Hugh Mungus',           // the CEO
    title: 'CEO, Maxorp Global Holdings',
    palaceName: 'The Maxorp Tower of Endless Growth',
    distortion: 'sees every human being as a line item to be optimized away',
  },

  // Voice notes for writers (used as a comment hint in dialogue authoring).
  voice: 'Dry, defiant, working-class wit. Punches up, never down. Slime puns earned, never forced.',
};

// Convenience exports
export const C = BRAND.colors;
export const TYPES = BRAND.damageTypes;
