// =============================================================================
//  Relationships — social stats + confidant ranks + perk application.
//  Perks are the mechanical reward per rank; applied directly to GameState so
//  they persist (new combat skill / max-HP-SP / stat boost / recovery discount).
// =============================================================================
import { addConfidantPoints } from '../core/GameState.js';
import { getConfidant } from '../data/confidants.js';

export const Relationships = {
  // Add bond points; if a new rank is reached, return the rank's perk (so the
  // caller can play the rank-up scene). Perk is applied when the scene resolves.
  addPoints(state, confidantId, points) {
    const def = getConfidant(confidantId);
    const before = state.confidants[confidantId].rank;
    const rankedUp = addConfidantPoints(state, confidantId, points);
    const after = state.confidants[confidantId].rank;
    let perk = null, sceneId = null;
    if (rankedUp) {
      const rankDef = def.ranks.find((r) => r.rank === after);
      perk = rankDef?.perk || null;
      sceneId = rankDef?.sceneId || null;
    }
    return { name: def.name, rankedUp, rank: after, perk, sceneId, def };
  },

  // Apply a perk's mechanical effect to the game state.
  applyPerk(state, perk) {
    if (!perk) return;
    if (perk.type === 'skill') {
      // grant the new combat skill to Slime By
      if (!state.party.sb.skills.includes(perk.value)) state.party.sb.skills.push(perk.value);
    } else if (perk.type === 'buff') {
      const [key, delta] = parseBuff(perk.value);
      if (key === 'sp') { /* max handled at combat-build via def; bump current */ state.party.sb.sp += delta; state.flags.bonusSp = (state.flags.bonusSp || 0) + delta; }
      else if (key === 'hp') { state.party.sb.hp += delta; state.flags.bonusHp = (state.flags.bonusHp || 0) + delta; }
      else if (key === 'atk') { state.flags.bonusAtk = (state.flags.bonusAtk || 0) + delta; }
      else if (['resolve', 'charm', 'knowledge', 'guts'].includes(key)) { state.stats[key] = Math.min(5, state.stats[key] + delta); }
    } else if (perk.type === 'discount') {
      state.flags.recoveryDiscount = Math.max(state.flags.recoveryDiscount || 0, perk.value);
    }
  },

  perkForRank(confidantId, rank) {
    const def = getConfidant(confidantId);
    return def?.ranks.find((r) => r.rank === rank) || null;
  },
};

function parseBuff(value) {
  // formats: 'sp+10', 'guts+1', 'atk+2'
  const m = value.match(/^([a-z]+)\+(\d+)$/);
  return m ? [m[1], parseInt(m[2], 10)] : [value, 0];
}
