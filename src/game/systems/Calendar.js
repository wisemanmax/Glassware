// =============================================================================
//  Calendar — time as a resource. Tracks day + block, spends a block on an
//  activity, applies its effect, and advances time. Day 5 evening = deadline.
// =============================================================================
import { DAYS, BLOCKS, BLOCK_LABEL, getActivity } from '../data/calendar.js';
import { addStatPoints } from '../core/GameState.js';
import { Relationships } from './Relationships.js';

export const Calendar = {
  current(state) {
    const day = DAYS.find((d) => d.index === state.day) || DAYS[DAYS.length - 1];
    return { day, block: BLOCKS[state.block], blockLabel: BLOCK_LABEL[BLOCKS[state.block]] };
  },

  // Is this activity selectable right now? (block availability + stat gate)
  canDo(state, activity) {
    const block = BLOCKS[state.block];
    if (!activity.blocks.includes(block)) return { ok: false, reason: `Only available in ${activity.blocks.map((b) => BLOCK_LABEL[b]).join(' / ')}` };
    if (activity.requires) {
      const have = state.stats[activity.requires.stat];
      if (have < activity.requires.min) return { ok: false, reason: `Requires ${activity.requires.stat} Rank ${activity.requires.min}` };
    }
    return { ok: true };
  },

  // Apply an activity's effect. Returns a summary for UI: { messages:[], statUp, rankUp, perk, dungeon }.
  applyActivity(state, activityId) {
    const a = getActivity(activityId);
    const out = { messages: [], statUp: false, rankUp: null, perk: null, dungeon: false };
    if (!a) return out;
    const e = a.effect;
    if (e.flag === 'enterDungeon') { out.dungeon = true; this.advance(state); return out; }

    if (e.stat && e.amount) {
      const leveled = addStatPoints(state, e.stat, e.amount);
      out.messages.push(`${e.stat.toUpperCase()} +${e.amount}`);
      if (leveled) { out.statUp = true; out.messages.push(`${e.stat.toUpperCase()} ranked up to ${state.stats[e.stat]}!`); }
    }
    if (e.confidant && e.rankPoints) {
      const res = Relationships.addPoints(state, e.confidant, e.rankPoints);
      out.messages.push(`Bond with ${res.name} +${e.rankPoints}`);
      if (res.rankedUp) { out.rankUp = e.confidant; out.perk = res.perk; }
    }
    this.advance(state);
    return out;
  },

  // Advance one time block; roll to next day after evening.
  advance(state) {
    state.block++;
    if (state.block >= BLOCKS.length) { state.block = 0; state.day++; }
  },

  isDeadlinePassed(state) { return state.day > DAYS.length; },
  isFinalBlock(state) { return state.day === DAYS.length && state.block === BLOCKS.length - 1; },
};
