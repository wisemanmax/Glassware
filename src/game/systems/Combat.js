// =============================================================================
//  Combat — turn-based engine. Pure-ish logic: builds runtime actors, computes
//  turn order by agility, resolves actions, and surfaces the P5 soul mechanics:
//    • Hit a WEAKNESS (or crit) → enemy DOWN + the attacker gets a ONE MORE.
//    • All enemies DOWN → ALL-OUT ATTACK becomes available.
//  The scene/UI drives it: currentActor() → act(decision) → returns events to
//  animate → advance(). Engine never touches the DOM or Three.js.
// =============================================================================
import { getSkill } from '../data/skills.js';
import { getEnemy } from '../data/enemies.js';
import { getPartyDef, xpForLevel } from '../data/party.js';

let uid = 0;

function makeAllyActor(def, persisted) {
  const lvl = persisted.level;
  const scale = 1 + (lvl - 1) * 0.12;
  return {
    uid: `a${uid++}`, side: 'ally', id: def.id, name: def.name,
    level: lvl, xp: persisted.xp,
    maxHp: Math.round(def.maxHp * scale), maxSp: Math.round(def.maxSp * scale),
    hp: Math.min(persisted.hp, Math.round(def.maxHp * scale)),
    sp: Math.min(persisted.sp, Math.round(def.maxSp * scale)),
    atk: Math.round(def.atk * scale), def: Math.round(def.def * scale), agi: def.agi,
    weakness: def.weakness, skills: [...persisted.skills],
    model: def.model, alive: true, down: false, guard: false, atkBuff: 1,
  };
}

function makeEnemyActor(def, idx) {
  return {
    uid: `e${uid++}`, side: 'enemy', id: def.id, name: def.name + (idx ? ` ${String.fromCharCode(64 + idx)}` : ''),
    level: 1, maxHp: def.maxHp, hp: def.maxHp, maxSp: 99, sp: 99,
    atk: def.atk, def: def.def, agi: def.agi, weakness: def.weakness,
    skills: [...def.skills], ai: def.ai, xp: def.xp, boss: !!def.boss,
    model: def.model, alive: true, down: false, guard: false, atkBuff: 1,
  };
}

export class Combat {
  constructor(gameState, encounter) {
    this.state = gameState;
    this.encounter = encounter;
    this.allies = [];
    this.enemies = [];
    for (const def of [getPartyDef('sb'), getPartyDef('riff')]) {
      if (!def) continue;
      const actor = makeAllyActor(def, gameState.party[def.id]);
      if (def.id === 'sb') { // apply confidant perk bonuses to the leader
        const f = gameState.flags;
        actor.maxHp += f.bonusHp || 0; actor.hp = Math.min(actor.hp + (f.bonusHp || 0), actor.maxHp);
        actor.maxSp += f.bonusSp || 0; actor.sp = Math.min(actor.sp + (f.bonusSp || 0), actor.maxSp);
        actor.atk += f.bonusAtk || 0;
      }
      this.allies.push(actor);
    }
    const counts = {};
    this.enemies = encounter.enemies.map((eid) => {
      counts[eid] = (counts[eid] || 0) + 1;
      const dups = encounter.enemies.filter((x) => x === eid).length;
      return makeEnemyActor(getEnemy(eid), dups > 1 ? counts[eid] : 0);
    });
    this.round = 0;
    this.queue = [];
    this.qi = 0;
    this.oneMore = false;
    this.canFlee = !encounter.boss;
    this.result = null; // 'win' | 'lose'
  }

  all() { return [...this.allies, ...this.enemies]; }
  livingAllies() { return this.allies.filter((a) => a.alive); }
  livingEnemies() { return this.enemies.filter((e) => e.alive); }
  getActor(uid) { return this.all().find((a) => a.uid === uid); }
  allEnemiesDown() { const e = this.livingEnemies(); return e.length > 0 && e.every((x) => x.down); }

  _buildRound() {
    this.round++;
    // clear guard at round start; downed actors will stand on their own turn
    this.queue = this.all().filter((a) => a.alive).sort((a, b) => b.agi - a.agi);
    this.qi = 0;
  }

  // Returns the actor whose turn it is, or null if the queue is exhausted / over.
  currentActor() {
    if (this.result) return null;
    if (this.qi >= this.queue.length) return null;
    return this.queue[this.qi];
  }

  // Advance to next actor. Handles One More (same actor again) and round rollover.
  advance() {
    if (this.result) return null;
    if (this.oneMore) { this.oneMore = false; return this.currentActor(); }
    this.qi++;
    // skip dead actors
    while (this.qi < this.queue.length && !this.queue[this.qi].alive) this.qi++;
    if (this.qi >= this.queue.length) { this._buildRound(); }
    return this.currentActor();
  }

  startBattle() { this._buildRound(); return this.currentActor(); }

  availableActions(actor) {
    const acts = [{ type: 'attack', label: 'Attack', skillId: 'strike' }];
    const skills = [];
    for (const sid of actor.skills) {
      if (sid === 'strike') continue;
      const sk = getSkill(sid); if (!sk) continue;
      const affordable = sk.costKind === 'sp' ? actor.sp >= sk.cost : true;
      skills.push({ type: 'skill', skillId: sid, label: sk.name, skill: sk, affordable });
    }
    acts.push({ type: 'skills', label: 'Skills', skills });
    acts.push({ type: 'guard', label: 'Guard' });
    acts.push({ type: 'item', label: 'Item' });
    if (this.canFlee) acts.push({ type: 'flee', label: 'Flee' });
    if (this.allEnemiesDown()) acts.unshift({ type: 'allout', label: '★ ALL-OUT ATTACK ★', special: true });
    return acts;
  }

  // Core damage math. Returns { damage, weakness, crit, missed, healed }.
  _resolveHit(attacker, defender, skill) {
    if (skill.kind === 'heal') {
      const amt = skill.target === 'self' || skill.power < 5
        ? Math.round(skill.power) // flat-ish for small
        : Math.round(skill.power);
      const heal = Math.round(skill.power);
      const before = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + heal);
      return { healed: defender.hp - before };
    }
    // accuracy: small whiff chance, more if target faster (mental defense flavor)
    const missChance = 0.05;
    if (Math.random() < missChance) return { missed: true };

    const isWeak = defender.weakness && defender.weakness === skill.type;
    let crit = Math.random() < (attacker.boss ? 0.06 : 0.1);
    const typeMult = isWeak ? 1.6 : 1.0;
    const critMult = crit ? 1.8 : 1.0;
    const variance = 0.88 + Math.random() * 0.24;
    const defFactor = 1 - defender.def / (defender.def + 32);
    let dmg = skill.power * attacker.atk * attacker.atkBuff * typeMult * critMult * defFactor * variance;
    if (defender.guard) dmg *= 0.45;
    dmg = Math.max(1, Math.round(dmg));
    defender.hp = Math.max(0, defender.hp - dmg);
    if (defender.hp === 0) { defender.alive = false; defender.down = false; }
    else if (isWeak || crit) defender.down = true;
    return { damage: dmg, weakness: isWeak, crit };
  }

  // Execute a player/AI decision. Returns { events:[...], oneMore, over }.
  // decision: { type, skillId?, targetUid? }
  act(decision) {
    const actor = this.currentActor();
    const events = [];
    if (!actor) return { events, over: this.result };

    // a downed actor stands at the start of its turn and loses the action
    if (actor.down) {
      actor.down = false; actor.guard = false;
      events.push({ kind: 'standup', actor });
      return { events, oneMore: false, over: this._checkOver() };
    }
    actor.guard = false;

    let gotOneMore = false;

    if (decision.type === 'guard') {
      actor.guard = true;
      events.push({ kind: 'guard', actor });

    } else if (decision.type === 'flee') {
      const ok = Math.random() < 0.6;
      events.push({ kind: 'flee', actor, success: ok });
      if (ok) this.result = 'flee';

    } else if (decision.type === 'item') {
      if (this.state.items.medigel > 0) {
        this.state.items.medigel--;
        const heal = 35;
        const before = actor.hp; actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        events.push({ kind: 'item', actor, healed: actor.hp - before });
      } else {
        events.push({ kind: 'noitem', actor });
      }

    } else if (decision.type === 'allout') {
      events.push({ kind: 'allout-start' });
      for (const e of this.livingEnemies()) {
        const dmg = Math.round((actor.atk * 2.4 + 20) * (0.9 + Math.random() * 0.3) * (e.boss ? 0.6 : 1));
        e.hp = Math.max(0, e.hp - dmg);
        e.down = false;
        if (e.hp === 0) e.alive = false;
        events.push({ kind: 'allout-hit', target: e, damage: dmg });
      }

    } else { // attack or skill
      const skill = getSkill(decision.type === 'attack' ? 'strike' : decision.skillId);
      // pay cost
      if (skill.costKind === 'sp') actor.sp = Math.max(0, actor.sp - skill.cost);
      events.push({ kind: 'cast', actor, skill });

      if (skill.kind === 'heal') {
        if (skill.target === 'all') {
          for (const a of this.livingAllies()) { const r = this._resolveHit(actor, a, skill); events.push({ kind: 'heal', target: a, ...r }); }
        } else {
          const r = this._resolveHit(actor, actor, skill);
          events.push({ kind: 'heal', target: actor, ...r });
        }
      } else if (skill.kind === 'buff') {
        actor.atkBuff = Math.min(1.6, actor.atkBuff + (skill.power - 1));
        events.push({ kind: 'buff', actor, skill });
      } else {
        // attack: gather targets
        const foes = actor.side === 'ally' ? this.livingEnemies() : this.livingAllies();
        let targets;
        if (skill.target === 'all') targets = foes;
        else {
          const t = this.getActor(decision.targetUid);
          targets = [t && t.alive ? t : foes[0]];
        }
        let anyWeakOrCrit = false;
        for (const tgt of targets) {
          if (!tgt || !tgt.alive) continue;
          const r = this._resolveHit(actor, tgt, skill);
          events.push({ kind: 'damage', actor, target: tgt, skill, ...r });
          if (r.weakness || r.crit) anyWeakOrCrit = true;
        }
        // ONE MORE: a weakness/crit grants the attacker another action
        if (anyWeakOrCrit && !this._checkOver()) gotOneMore = true;
      }
    }

    this.oneMore = gotOneMore;
    return { events, oneMore: gotOneMore, over: this._checkOver(), alloutAvailable: this.allEnemiesDown() };
  }

  // Enemy AI decision (basic heuristics).
  decideEnemy(actor) {
    if (actor.down) return { type: 'guard' }; // will be turned into stand-up by act()
    const targets = this.livingAllies();
    if (targets.length === 0) return { type: 'guard' };
    const lowSelf = actor.hp / actor.maxHp < 0.35;

    // boss: heal when low, AoE when crew healthy, else target weakest
    if (actor.boss && lowSelf && actor.skills.includes('e_bonus') && Math.random() < 0.5) {
      return { type: 'skill', skillId: 'e_bonus' };
    }
    const usable = actor.skills.filter((s) => s !== 'e_bonus');
    let skillId;
    if (actor.ai === 'tactical') {
      // prefer hitting an ally's weakness if a matching skill exists
      const weakTarget = targets.find((t) => t.weakness && usable.some((s) => getSkill(s)?.type === t.weakness));
      if (weakTarget) {
        skillId = usable.find((s) => getSkill(s)?.type === weakTarget.weakness);
        return { type: 'skill', skillId, targetUid: weakTarget.uid };
      }
      // sometimes AoE
      const aoe = usable.find((s) => getSkill(s)?.target === 'all');
      if (aoe && Math.random() < 0.4) return { type: 'skill', skillId: aoe };
    }
    skillId = usable[Math.floor(Math.random() * usable.length)] || 'e_slash';
    // target the lowest-HP ally
    const target = targets.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    return { type: 'skill', skillId, targetUid: target.uid };
  }

  _checkOver() {
    if (this.result) return this.result;
    if (this.livingEnemies().length === 0) this.result = 'win';
    else if (this.livingAllies().length === 0) this.result = 'lose';
    return this.result;
  }

  // On victory: award XP, level up, persist HP/SP back to gameState. Returns
  // a summary { xp, levelUps:[{name, level, learned:[skillName]}] }.
  resolveVictory() {
    const xpGain = this.enemies.reduce((s, e) => s + e.xp, 0);
    const levelUps = [];
    for (const a of this.allies) {
      const persisted = this.state.party[a.id];
      persisted.xp += xpGain;
      const def = getPartyDef(a.id);
      let leveled = null;
      while (persisted.xp >= xpForLevel(persisted.level)) {
        persisted.xp -= xpForLevel(persisted.level);
        persisted.level++;
        leveled = leveled || { name: a.name, level: persisted.level, learned: [] };
        leveled.level = persisted.level;
        // learn skills for this level
        for (const ls of def.learnset) {
          if (ls.level === persisted.level && !persisted.skills.includes(ls.skillId)) {
            persisted.skills.push(ls.skillId);
            leveled.learned.push(getSkill(ls.skillId).name);
          }
        }
      }
      if (leveled) levelUps.push(leveled);
      // persist current HP/SP (clamped to new max via makeAllyActor next time)
      persisted.hp = a.hp; persisted.sp = a.sp;
    }
    return { xp: xpGain, levelUps };
  }

  // Persist HP/SP after a flee or non-victory transition.
  persist() {
    for (const a of this.allies) {
      const p = this.state.party[a.id];
      p.hp = Math.max(1, a.hp); p.sp = a.sp;
    }
  }
}
