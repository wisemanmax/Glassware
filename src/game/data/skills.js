// =============================================================================
//  SKILLS — data-driven. type: phys|tech|mental|fire. Add a skill = add an
//  entry here, then reference its id in a learnset (party.js) or enemy (enemies.js).
//  phys skills cost a % of max HP; others cost SP. power scales with user atk.
// =============================================================================
export const SKILLS = {
  // --- basic / shared ---
  strike:   { id: 'strike',   name: 'Strike',        type: 'phys',   cost: 0,  costKind: 'free', power: 1.0, target: 'one', kind: 'attack', desc: 'Basic physical attack.' },

  // --- Slime By ---
  acidlash: { id: 'acidlash', name: 'Acid Lash',     type: 'tech',   cost: 6,  costKind: 'sp',   power: 1.4, target: 'one', kind: 'attack', desc: 'Corrosive tech jolt. Hits TECH weakness.' },
  dissolve: { id: 'dissolve', name: 'Dissolve',      type: 'tech',   cost: 14, costKind: 'sp',   power: 1.1, target: 'all', kind: 'attack', desc: 'Splash all foes with corrosive slime.' },
  ooze:     { id: 'ooze',     name: 'Ooze Mend',     type: 'phys',   cost: 8,  costKind: 'sp',   power: 26,  target: 'self', kind: 'heal', desc: 'Reabsorb mass to restore HP.' },
  overload: { id: 'overload', name: 'Overload',      type: 'tech',   cost: 20, costKind: 'sp',   power: 2.2, target: 'one', kind: 'attack', desc: 'Massive tech surge. (Unlocks lv4)' },

  // --- Riff (ally) ---
  feedback: { id: 'feedback', name: 'Feedback',      type: 'mental', cost: 7,  costKind: 'sp',   power: 1.4, target: 'one', kind: 'attack', desc: 'Mind-splitting noise. Hits MENTAL weakness.' },
  amppush:  { id: 'amppush',  name: 'Amp Push',      type: 'fire',   cost: 9,  costKind: 'sp',   power: 1.5, target: 'one', kind: 'attack', desc: 'Overdriven heat blast. Hits FIRE weakness.' },
  rally:    { id: 'rally',    name: 'Rally',         type: 'phys',   cost: 10, costKind: 'sp',   power: 1.25,target: 'self', kind: 'buff', desc: 'Hype the crew: +25% attack this fight.' },
  encore:   { id: 'encore',   name: 'Encore',        type: 'mental', cost: 18, costKind: 'sp',   power: 1.0, target: 'all', kind: 'attack', desc: 'Mental shockwave hits all foes.' },

  // --- confidant-granted ---
  shortsell:{ id: 'shortsell',name: 'Short Sell',    type: 'mental', cost: 12, costKind: 'sp',   power: 1.9, target: 'one', kind: 'attack', desc: 'Confidant skill: weaponized market panic.' },
  union:    { id: 'union',    name: 'Union Strong',  type: 'phys',   cost: 14, costKind: 'sp',   power: 40,  target: 'all', kind: 'heal', desc: 'Confidant skill: heal the whole crew.' },

  // --- enemy skills ---
  e_slash:  { id: 'e_slash',  name: 'Pink Slip',     type: 'phys',   cost: 0,  costKind: 'free', power: 1.0, target: 'one', kind: 'attack', desc: 'Layoff strike.' },
  e_audit:  { id: 'e_audit',  name: 'Hostile Audit', type: 'mental', cost: 0,  costKind: 'free', power: 1.2, target: 'one', kind: 'attack', desc: 'Demoralizing scrutiny.' },
  e_quota:  { id: 'e_quota',  name: 'Quota Crush',   type: 'phys',   cost: 0,  costKind: 'free', power: 1.3, target: 'all', kind: 'attack', desc: 'Crush the whole crew with demands.' },
  e_bonus:  { id: 'e_bonus',  name: 'Golden Parachute', type: 'fire', cost: 0, costKind: 'free', power: 30,  target: 'self', kind: 'heal', desc: 'The boss heals itself with a bonus.' },
};

export function getSkill(id) { return SKILLS[id]; }
