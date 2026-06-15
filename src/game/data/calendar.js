// =============================================================================
//  CALENDAR — 5 in-game days, two blocks each (Daytime / Evening).
//  Activities cost one block. Some are gated by a social stat rank.
//  Choosing to infiltrate the HQ also consumes a block (real time tension).
// =============================================================================
export const BLOCKS = ['day', 'evening'];
export const BLOCK_LABEL = { day: 'Daytime', evening: 'Evening' };

export const DAYS = [
  { index: 1, label: 'MON', name: 'Monday', dateText: 'JUN 15' },
  { index: 2, label: 'TUE', name: 'Tuesday', dateText: 'JUN 16' },
  { index: 3, label: 'WED', name: 'Wednesday', dateText: 'JUN 17' },
  { index: 4, label: 'THU', name: 'Thursday', dateText: 'JUN 18' },
  { index: 5, label: 'FRI', name: 'Friday', dateText: 'JUN 19 — DEADLINE' },
];

// Activities available in the hub. effect applies on completion.
export const ACTIVITIES = [
  {
    id: 'study', label: 'Study at the library', icon: '📚',
    desc: 'Read up on corporate law and labor history. (+Knowledge)',
    blocks: ['day', 'evening'], location: 'library',
    effect: { stat: 'knowledge', amount: 2 },
  },
  {
    id: 'gym', label: 'Hit the gym', icon: '🥊',
    desc: 'Train your body for the infiltration. (+Guts)',
    blocks: ['day', 'evening'], location: 'gym',
    effect: { stat: 'guts', amount: 2 },
  },
  {
    id: 'busk', label: 'Busk in the plaza', icon: '🎤',
    desc: 'Perform a Slime By set for the crowd. (+Charm)',
    blocks: ['day', 'evening'], location: 'stage',
    effect: { stat: 'charm', amount: 2 },
  },
  {
    id: 'meditate', label: 'Steel yourself', icon: '🔥',
    desc: 'Sit with what\'s coming. (+Resolve)',
    blocks: ['evening'], location: 'apartment',
    effect: { stat: 'resolve', amount: 2 },
  },
  // confidant hangouts — advance a relationship
  {
    id: 'cafe', label: 'Hang at the café (Mara)', icon: '☕',
    desc: 'Spend time with Mara. (Advances Confidant)',
    blocks: ['day', 'evening'], location: 'cafe',
    effect: { confidant: 'mara', rankPoints: 2, stat: 'resolve', amount: 1 },
  },
  {
    id: 'rooftop', label: 'Meet Devon on the roof', icon: '🌃',
    desc: 'Devon has intel to share. (Advances Confidant)',
    blocks: ['evening'], location: 'rooftop',
    effect: { confidant: 'devon', rankPoints: 2, stat: 'knowledge', amount: 1 },
    requires: { stat: 'knowledge', min: 2 }, // gated: must read up first
  },
  {
    id: 'studio', label: 'Studio session (Glo)', icon: '🎧',
    desc: 'Cut a track with Glo. (Advances Confidant)',
    blocks: ['day', 'evening'], location: 'studio',
    effect: { confidant: 'glo', rankPoints: 2, stat: 'charm', amount: 1 },
  },
  // the dungeon — the other pillar, also costs a block
  {
    id: 'infiltrate', label: '▶ INFILTRATE MAXORP TOWER', icon: '🏢',
    desc: 'Enter the Palace. This consumes a time block — and there\'s no turning back today.',
    blocks: ['day', 'evening'], location: 'dungeon',
    effect: { flag: 'enterDungeon' },
    highlight: true,
  },
];

export function getActivity(id) { return ACTIVITIES.find((a) => a.id === id); }
