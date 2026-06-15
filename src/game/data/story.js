// =============================================================================
//  STORY CARDS — full-screen splash cards (intro title, act breaks, ending).
//  Rendered by UI.showCard(). Plain content, easy to rewrite.
// =============================================================================
import { BRAND as B } from './config.js';

export const CARDS = {
  title: {
    big: 'SLIME BY',
    body: B.hero.tagline,
    small: 'A VERTICAL SLICE · PRESS ON',
  },
  toTutorial: {
    big: 'THE METAVERSE OF WORK',
    body: 'A distortion bleeds off Maxorp Tower — a cognitive world where the company\'s contempt takes shape. Learn to move. Learn to fight.',
    small: 'TUTORIAL',
  },
  toHub: {
    big: 'FIVE DAYS',
    body: 'The layoffs are signed Friday. Until then, your time is the only resource you fully control. Spend it well.',
    small: 'EVERYDAY LIFE',
  },
  toDungeon: {
    big: 'INFILTRATION',
    body: `You slip into the cognitive Tower. Reach the Executive Suite. Force the Liquidator to account for what it has "optimized."`,
    small: 'THE PALACE',
  },
  // ----------------------------------------------------- CLIFFHANGER -------
  ending: {
    big: 'CHANGE OF HEART?',
    body: `The Liquidator is gone — but somewhere above, ${B.antagonist.name} just woke in a cold sweat with a confession half-formed on his lips. The Overflow has a name now. And ${B.factions.enemyCorpLong} has nine more floors of distortion... and a board meeting on Monday.`,
    small: 'TO BE CONTINUED — SLIME BY WILL RETURN',
  },
};

export function getCard(id) { return CARDS[id]; }
