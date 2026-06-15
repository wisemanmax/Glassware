// =============================================================================
//  DIALOGUE — branching trees. Each tree is { startNode, nodes:{id:Node} }.
//  Node: { speaker, side:'left'|'right', text, next?, choices?, action?, actionArg? }
//  choices: [{ text, next, requires?:{stat,min}, effect?:{stat?,amount?,confidant?,rankPoints?,flag?} }]
//  action (fires when node has no `next`/`choices` and is advanced):
//     'endScene' | 'startCombat'(actionArg=encounterId) | 'rankUp'(actionArg=confidantId)
//  Speaker side controls which color the nameplate uses (slime = the hero side).
// =============================================================================
import { BRAND as B } from './config.js';

const corp = B.factions.enemyCorp;
const ceo = B.antagonist.name;

export const DIALOGUE = {
  // ---------------------------------------------------------------- INTRO ----
  intro: {
    start: 'i1',
    nodes: {
      i1: { speaker: ceo, side: 'right', text: `Another quarter, another record. ${corp} doesn't have employees — it has variable costs. And costs... get optimized.`, next: 'i2' },
      i2: { speaker: ceo, side: 'right', text: `By Friday, three thousand people on this block stop being a line on my spreadsheet. Cleanly. Quietly. Legally.`, next: 'i3' },
      i3: { speaker: 'Narration', side: 'right', text: `Below the tower, in a café that's about to be priced out, a slime-green hoodie pulls up over a familiar face.`, next: 'i4' },
      i4: { speaker: B.hero.realName, side: 'left', text: `They ran the math on everybody. Rent, wages, "synergies." Everybody but themselves.`, next: 'i5' },
      i5: { speaker: 'Mara', side: 'right', text: `${B.hero.codename}. You hear that distortion humming off the tower? That's not the AC. That's how he SEES us.`, next: 'i6' },
      i6: { speaker: B.hero.realName, side: 'left', text: B.hero.awakeningLine, next: 'i7' },
      i7: { speaker: 'Narration', side: 'right', text: `A mask of cracked glass forms — then shatters. ${B.hero.codename} steps into their power. The Overflow rises.`, action: 'endScene' },
    },
  },

  // ------------------------------------------------------------- TUTORIAL ----
  tutorial_combat: {
    start: 't1',
    nodes: {
      t1: { speaker: 'Riff', side: 'left', text: `Heads up — a cognition's blocking the way. A shadow of the system. We fight, or we go home.`, next: 't2' },
      t2: { speaker: 'Riff', side: 'left', text: `Everything down here has ONE weakness. Hit it and you get a ONE MORE — a free extra turn. Stack those and we wreck them.`, next: 't3' },
      t3: { speaker: 'Riff', side: 'left', text: `Knock 'em all down and we finish with an ALL-OUT ATTACK. Try Slime By's ACID LASH — that's TECH. Let's see what this thing hates.`, action: 'startCombat', actionArg: 'tutorial' },
    },
  },
  tutorial_win: {
    start: 'w1',
    nodes: {
      w1: { speaker: 'Riff', side: 'left', text: `That's the rhythm. Weakness → One More → All-Out. Now... you've got a life to live before we hit the tower for real.`, next: 'w2' },
      w2: { speaker: 'Riff', side: 'left', text: `Five days till they sign off the layoffs. How you spend your time is up to you. Get stronger, make allies — or charge the tower. Clock's ticking either way.`, action: 'endScene' },
    },
  },

  // --------------------------------------------------------- BOSS FRAMING ----
  boss_intro: {
    start: 'b1',
    nodes: {
      b1: { speaker: 'The Liquidator', side: 'right', text: `Ah. The "talent" that won't downsize quietly. Do you know what I am? I'm the spreadsheet that decides who eats.`, next: 'b2' },
      b2: { speaker: 'The Liquidator', side: 'right', text: `Everyone has a number. Yours is ZERO. Let me show you efficiency.`, next: 'b3' },
      b3: { speaker: B.hero.realName, side: 'left', text: `People aren't your rounding error. Riff — let's audit HIM for once.`, action: 'startCombat', actionArg: 'boss' },
    },
  },
  boss_win: {
    start: 'v1',
    nodes: {
      v1: { speaker: 'The Liquidator', side: 'right', text: `Impossible... my margins... I was only following the... the incentives...`, next: 'v2' },
      v2: { speaker: B.hero.realName, side: 'left', text: `The incentives were a choice. Confess it. Out loud. To everyone you "optimized."`, next: 'v3' },
      v3: { speaker: 'Narration', side: 'right', text: `The shadow dissolves into a torrent of shredded contracts. Somewhere up in the tower, a man at a desk starts, inexplicably, to sweat.`, action: 'endScene' },
    },
  },

  // ----------------------------------- CONFIDANT: MARA (branching scene) ----
  mara_r1: {
    start: 'm1',
    nodes: {
      m1: { speaker: 'Mara', side: 'right', text: `So you really did it. Walked into that distortion and walked back out. Most people just... accept the layoffs. Why don't you?`,
        choices: [
          { text: `Because someone has to be unreasonable.`, next: 'm2a' },
          { text: `Because I've got nothing left to lose.`, next: 'm2b' },
          { text: `[Guts 2] Because fear is just a budget line I refuse to pay.`, requires: { stat: 'guts', min: 2 }, next: 'm2c', effect: { confidant: 'mara', rankPoints: 1 } },
        ],
      },
      m2a: { speaker: 'Mara', side: 'right', text: `Unreasonable. Hah. I organized a warehouse on "unreasonable." It works — until they make an example of you.`, next: 'm3' },
      m2b: { speaker: 'Mara', side: 'right', text: `Don't say that. You've got the whole block. You've got me. That's not nothing.`, next: 'm3' },
      m2c: { speaker: 'Mara', side: 'right', text: `...Okay. THAT one I'm writing down. You sound like me ten years and one broken strike ago. I'm in.`, next: 'm3' },
      m3: { speaker: 'Mara', side: 'right', text: `Here. Standing order, on the house, forever. Caffeine's a labor right. Now go be unreasonable — I've got your back from the counter.`, action: 'rankUp', actionArg: 'mara' },
    },
  },
  mara_r2: {
    start: 'm1',
    nodes: {
      m1: { speaker: 'Mara', side: 'right', text: `I pulled some old organizer contacts. They taught me a trick for keeping a crew on their feet when the bosses come swinging.`, next: 'm2' },
      m2: { speaker: 'Mara', side: 'right', text: `Solidarity's not a metaphor down there. Take it. Use it when one of you is about to drop.`, action: 'rankUp', actionArg: 'mara' },
    },
  },
  mara_r3: {
    start: 'm1',
    nodes: {
      m1: { speaker: 'Mara', side: 'right', text: `Whatever happens in that tower — you didn't make me brave again. You reminded me I never stopped. Go finish it.`, action: 'rankUp', actionArg: 'mara' },
    },
  },

  // -------------------------------------------------- CONFIDANT: DEVON ------
  devon_r1: {
    start: 'd1',
    nodes: {
      d1: { speaker: 'Devon', side: 'right', text: `I built the model that ranks people for "release." I can't unbuild it. But I can hand you the keys.`,
        choices: [
          { text: `Then you're already one of us.`, next: 'd2' },
          { text: `[Knowledge 2] Show me the methodology — every assumption.`, requires: { stat: 'knowledge', min: 2 }, next: 'd2k', effect: { confidant: 'devon', rankPoints: 1 } },
        ],
      },
      d2: { speaker: 'Devon', side: 'right', text: `Maybe. Maybe I'm just a coward with a conscience and good timing.`, next: 'd3' },
      d2k: { speaker: 'Devon', side: 'right', text: `You actually read it. Nobody reads it. The assumptions ARE the crime — and you just found the seam I missed.`, next: 'd3' },
      d3: { speaker: 'Devon', side: 'right', text: `Take this access pattern. It'll cut your recovery time between fights. Less time bleeding, more time exposing them.`, action: 'rankUp', actionArg: 'devon' },
    },
  },
  devon_r2: {
    start: 'd1',
    nodes: {
      d1: { speaker: 'Devon', side: 'right', text: `If you can make the market FEEL what they did, the distortion buckles. I weaponized a panic indicator. It's ugly. It works.`, action: 'rankUp', actionArg: 'devon' },
    },
  },
  devon_r3: {
    start: 'd1',
    nodes: {
      d1: { speaker: 'Devon', side: 'right', text: `I'm done hiding. When you make him confess, I testify. Here's everything I've got — every weak point, exposed.`, action: 'rankUp', actionArg: 'devon' },
    },
  },

  // --------------------------------------------------- CONFIDANT: GLO -------
  glo_r1: {
    start: 'g1',
    nodes: {
      g1: { speaker: 'Glo', side: 'right', text: `A heist is a verse. The movement needs a hook people can't get out of their heads. Get on the mic — I'll catch the magic.`, action: 'rankUp', actionArg: 'glo' },
    },
  },
  glo_r2: {
    start: 'g1',
    nodes: {
      g1: { speaker: 'Glo', side: 'right', text: `The track's done. It's already on every phone on the block. When you walk into that tower, you're not alone — you're the chorus.`, action: 'rankUp', actionArg: 'glo' },
    },
  },
};

export function getTree(id) { return DIALOGUE[id]; }
