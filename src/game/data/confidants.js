// =============================================================================
//  CONFIDANTS — relationships. Each rank has a scene (dialogue tree id) and a
//  mechanical perk granted on reaching it. perk.type: 'skill'|'discount'|'buff'.
//  Slice content: 3 confidants, low rank cap, one scripted rank-up scene each.
// =============================================================================
export const CONFIDANTS = [
  {
    id: 'mara',
    name: 'Mara',
    title: 'The Barista / Ex-Organizer',
    color: 0x38e8ff,
    maxRank: 3,
    model: { glb: null, body: 0x38e8ff, accent: 0x0f2a33, build: 'casual', height: 1.7 },
    blurb: 'Runs the café below your place. Knows every worker on the block — and every grudge.',
    ranks: [
      { rank: 1, sceneId: 'mara_r1', perk: { type: 'buff', value: 'sp+10', desc: 'Mara keeps you caffeinated: +10 max SP for Slime By.' } },
      { rank: 2, sceneId: 'mara_r2', perk: { type: 'skill', value: 'union', desc: 'Learn UNION STRONG — heal the whole crew mid-fight.' } },
      { rank: 3, sceneId: 'mara_r3', perk: { type: 'buff', value: 'guts+1', desc: 'Her resolve rubs off: +1 Guts.' } },
    ],
  },
  {
    id: 'devon',
    name: 'Devon',
    title: 'The Whistleblower',
    color: 0xff7a3c,
    maxRank: 3,
    model: { glb: null, body: 0xff7a3c, accent: 0x33180a, build: 'suit', height: 1.82 },
    blurb: 'A Maxorp analyst who saw the spreadsheets. Wants out — and wants them exposed.',
    ranks: [
      { rank: 1, sceneId: 'devon_r1', perk: { type: 'discount', value: 0.2, desc: 'Insider info: 20% better recovery between fights.' } },
      { rank: 2, sceneId: 'devon_r2', perk: { type: 'skill', value: 'shortsell', desc: 'Learn SHORT SELL — weaponized market panic (mental).' } },
      { rank: 3, sceneId: 'devon_r3', perk: { type: 'buff', value: 'atk+2', desc: 'Devon\'s intel exposes weak points: +2 attack.' } },
    ],
  },
  {
    id: 'glo',
    name: 'Glo',
    title: 'The Producer',
    color: 0xff2d8b,
    maxRank: 2,
    model: { glb: null, body: 0xff2d8b, accent: 0x2a0a18, build: 'punk', height: 1.74 },
    blurb: 'Slime By\'s music collaborator. Believes the movement needs an anthem, not just a heist.',
    ranks: [
      { rank: 1, sceneId: 'glo_r1', perk: { type: 'buff', value: 'charm+1', desc: 'The booth confidence: +1 Charm.' } },
      { rank: 2, sceneId: 'glo_r2', perk: { type: 'buff', value: 'hp+12', desc: 'The anthem hits: +12 max HP for Slime By.' } },
    ],
  },
];

export function getConfidant(id) { return CONFIDANTS.find((c) => c.id === id); }
