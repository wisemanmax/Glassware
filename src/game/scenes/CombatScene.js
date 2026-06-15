// =============================================================================
//  CombatScene — wires the Combat engine to 3D actors + the combat HUD/menus.
//  Drives the turn loop, animates events, shows One More / All-Out / popups,
//  and reports win/lose via the handlers passed in.
//  args: { encounterId, banner, onWin(summary), onLose() }
// =============================================================================
import * as THREE from 'three';
import { SceneBase } from './SceneBase.js';
import { Combat } from '../systems/Combat.js';
import { getEncounter } from '../data/dungeon.js';
import { getEnemy } from '../data/enemies.js';
import { assets } from '../world/AssetManager.js';
import { buildArena } from '../world/Environments.js';
import { ui } from '../ui/UI.js';
import { getSkill } from '../data/skills.js';
import { TYPES } from '../data/config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class CombatScene extends SceneBase {
  async enter(args) {
    this.args = args;
    this.combat = new Combat(this.state, getEncounter(args.encounterId));
    this.chars = new Map(); // uid -> Character
    this.busy = true;

    this.engine.clearScene();
    const arena = buildArena();
    this.engine.scene.add(arena.group);
    this.root = arena.group;

    // camera framing
    this.engine.camera.position.set(7.5, 5.5, 9.5);
    this.engine.camera.lookAt(0, 1.2, -0.5);

    // place allies (front-right) and enemies (back-left)
    const allyHomes = [new THREE.Vector3(3.2, 0, 2.2), new THREE.Vector3(5.2, 0, -0.4)];
    const enemyCount = this.combat.enemies.length;
    await this._spawnSide(this.combat.allies, allyHomes, Math.PI * -0.5 - 0.3);
    const enemyHomes = this.combat.enemies.map((e, i) => {
      const spread = (i - (enemyCount - 1) / 2);
      return new THREE.Vector3(-3.5 + (e.boss ? 0 : 0), 0, spread * 2.4);
    });
    await this._spawnSide(this.combat.enemies, enemyHomes, Math.PI * 0.5 + 0.3);

    ui.combatHUD(this.combat.allies);
    if (args.banner) ui.banner(args.banner, 1500);

    this.combat.startBattle();
    await sleep(1300);
    this.busy = false;
    this._loop();
  }

  async _spawnSide(actors, homes, facing) {
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      const char = await assets.loadCharacter({ id: a.id, model: a.model });
      const home = homes[i] || new THREE.Vector3(-4, 0, i * 2);
      char.object3d.position.copy(home);
      char.home = home.clone();
      char.face(facing);
      char.setAnim('idle');
      this.engine.scene.add(char.object3d);
      this.chars.set(a.uid, char);
    }
  }

  charOf(actor) { return this.chars.get(actor.uid); }
  posAbove(actor, dy = 2.6) { const c = this.charOf(actor); const p = c.object3d.position.clone(); p.y += dy; return p; }

  // ---- turn loop -----------------------------------------------------------
  async _loop() {
    if (this._ended) return;
    const actor = this.combat.currentActor();
    if (!actor) { this._loop(); return; }
    ui.setActiveCard(actor.uid);

    if (actor.side === 'ally') {
      this._showActionMenu(actor);
    } else {
      this.busy = true;
      await sleep(550);
      const decision = this.combat.decideEnemy(actor);
      await this._resolve(decision);
    }
  }

  _showActionMenu(actor) {
    const acts = this.combat.availableActions(actor);
    const options = acts.map((a) => {
      if (a.type === 'skills') return { label: 'Skills ▸', value: a };
      if (a.type === 'allout') return { label: a.label, value: a };
      if (a.type === 'attack') return { label: 'Attack', value: a };
      if (a.type === 'guard') return { label: 'Guard', small: 'Halve next damage', value: a };
      if (a.type === 'item') return { label: 'Item', meta: `Medigel x${this.state.items.medigel}`, value: a };
      if (a.type === 'flee') return { label: 'Flee', value: a };
      return { label: a.label, value: a };
    });
    ui.menu({
      title: actor.name, mag: false, options,
      onSelect: (a) => {
        if (a.type === 'skills') return this._showSkillMenu(actor, a.skills);
        if (a.type === 'attack' || a.type === 'skill') return this._pickTarget(actor, a.type === 'attack' ? 'strike' : a.skillId);
        return this._resolve({ type: a.type });
      },
    });
  }

  _showSkillMenu(actor, skills) {
    const options = skills.map((s) => ({
      label: s.label,
      meta: s.skill.costKind === 'sp' ? `${s.skill.cost} SP` : '—',
      small: `${TYPES[s.skill.type].label} · ${s.skill.desc}`,
      disabled: !s.affordable,
      value: s,
    }));
    options.push({ label: '◂ Back', value: null });
    ui.menu({
      title: `${actor.name} — Skills`, options,
      onCancel: () => this._showActionMenu(actor),
      onSelect: (s) => {
        if (!s) return this._showActionMenu(actor);
        const sk = s.skill;
        if (sk.target === 'self' || sk.target === 'all') return this._resolve({ type: 'skill', skillId: sk.id });
        return this._pickTarget(actor, sk.id);
      },
    });
  }

  _pickTarget(actor, skillId) {
    const foes = this.combat.livingEnemies();
    if (foes.length === 1) return this._resolve({ type: skillId === 'strike' ? 'attack' : 'skill', skillId, targetUid: foes[0].uid });
    const options = foes.map((e) => ({
      label: e.name, meta: `HP ${e.hp}`, small: `Weakness: ${TYPES[e.weakness]?.label || '???'}${e.down ? ' · DOWN' : ''}`, value: e.uid,
    }));
    options.push({ label: '◂ Back', value: null });
    ui.menu({
      title: 'Choose target', options,
      onCancel: () => this._showActionMenu(actor),
      onSelect: (uid) => {
        if (!uid) return this._showActionMenu(actor);
        this._resolve({ type: skillId === 'strike' ? 'attack' : 'skill', skillId, targetUid: uid });
      },
    });
  }

  async _resolve(decision) {
    this.busy = true;
    const res = this.combat.act(decision);
    await this._animate(res.events);
    ui.refreshCombatHUD(this.combat.all());

    if (res.over === 'win') return this._win();
    if (res.over === 'lose') return this._lose();
    if (res.over === 'flee') return this._fled();

    if (res.oneMore) { ui.banner('ONE MORE!', 900); this.engine.sfx('weak'); await sleep(700); }

    // next turn
    this.combat.advance();
    this.busy = false;
    this._loop();
  }

  async _animate(events) {
    for (const ev of events) {
      const actorChar = ev.actor && this.charOf(ev.actor);
      switch (ev.kind) {
        case 'cast': {
          const sk = ev.skill;
          if (actorChar) actorChar.setAnim(sk.kind === 'attack' && sk.type === 'phys' ? 'attack' : sk.kind === 'heal' || sk.kind === 'buff' ? 'cast' : 'cast');
          this.engine.sfx(sk.type === 'phys' ? 'hit' : 'select');
          await sleep(260);
          break;
        }
        case 'damage': {
          const tc = this.charOf(ev.target);
          if (ev.missed) { if (tc) ui.popup(this.posAbove(ev.target), 'MISS', 'miss'); break; }
          if (tc) { tc.flashHit(); tc.setAnim(ev.target.alive ? 'hit' : 'down'); }
          if (ev.crit) { ui.burst(this.posAbove(ev.target, 2.2), 'CRIT!'); ui.popup(this.posAbove(ev.target), `${ev.damage}`, 'crit'); this.engine.sfx('crit'); this.engine.doShake(0.85); this.engine.hitStop(90); this.engine.pulseBloom(0.7); ui.flash('#ff2d8b', 160); }
          else if (ev.weakness) { ui.burst(this.posAbove(ev.target, 2.2), 'WEAK!'); ui.popup(this.posAbove(ev.target), `${ev.damage}`, 'weak'); this.engine.sfx('weak'); this.engine.doShake(0.45); this.engine.hitStop(55); ui.flash('#9dff3c', 130); }
          else { ui.popup(this.posAbove(ev.target), `${ev.damage}`, 'dmg'); this.engine.sfx('hit'); this.engine.doShake(0.2); }
          ui.refreshCombatHUD(this.combat.all());
          if (!ev.target.alive && ev.target.side === 'enemy') ui.popup(this.posAbove(ev.target, 1.6), 'DOWN', 'miss');
          await sleep(360);
          break;
        }
        case 'heal': {
          const tc = this.charOf(ev.target);
          if (ev.healed > 0 && tc) { ui.popup(this.posAbove(ev.target), `+${ev.healed}`, 'heal'); }
          this.engine.sfx('heal'); ui.refreshCombatHUD(this.combat.all());
          await sleep(300);
          break;
        }
        case 'buff': { if (actorChar) ui.popup(this.posAbove(ev.actor), 'HYPE↑', 'heal'); this.engine.sfx('heal'); await sleep(250); break; }
        case 'guard': { if (actorChar) ui.popup(this.posAbove(ev.actor), 'GUARD', 'miss'); this.engine.sfx('select'); await sleep(200); break; }
        case 'item': { ui.popup(this.posAbove(ev.actor), `+${ev.healed}`, 'heal'); this.engine.sfx('heal'); ui.refreshCombatHUD(this.combat.all()); await sleep(300); break; }
        case 'noitem': { ui.popup(this.posAbove(ev.actor), 'EMPTY', 'miss'); await sleep(200); break; }
        case 'standup': { const c = this.charOf(ev.actor); c?.setAnim('idle'); ui.popup(this.posAbove(ev.actor), 'recovers', 'miss'); await sleep(250); break; }
        case 'flee': { ui.banner(ev.success ? 'GOT AWAY!' : 'COULDN\'T ESCAPE', 1000); await sleep(700); break; }
        case 'allout-start': { await this._playAllOut(); break; }
        case 'allout-hit': { const tc = this.charOf(ev.target); if (tc) { tc.flashHit(); tc.setAnim(ev.target.alive ? 'hit' : 'down'); } ui.popup(this.posAbove(ev.target), `${ev.damage}`, 'crit'); ui.refreshCombatHUD(this.combat.all()); await sleep(180); break; }
        default: break;
      }
    }
  }

  _playAllOut() {
    return new Promise((resolve) => {
      // dash all living allies toward center, then splash card
      ui.allOut(() => resolve());
      this.engine.pulseBloom(1.3); this.engine.doShake(0.9);
      for (const a of this.combat.livingAllies()) { const c = this.charOf(a); c?.setAnim('attack'); }
    });
  }

  async _win() {
    this._ended = true;
    ui.setActiveCard(null);
    ui.banner('VICTORY', 1600); this.engine.sfx('levelup');
    for (const a of this.combat.livingAllies()) this.charOf(a)?.setAnim('idle');
    await sleep(900);
    const summary = this.combat.resolveVictory();
    // build a results card
    let body = `XP +${summary.xp} to the crew.`;
    if (summary.levelUps.length) {
      this.engine.sfx('levelup');
      body += '<br><br>' + summary.levelUps.map((l) => `★ ${l.name} reached Lv ${l.level}${l.learned.length ? ` — learned ${l.learned.join(', ')}` : ''}`).join('<br>');
    }
    ui.card({ big: 'BATTLE WON', body, small: 'THE OVERFLOW PREVAILS' }, () => {
      this.args.onWin?.(summary);
    });
  }

  async _lose() {
    this._ended = true; ui.setActiveCard(null);
    ui.banner('DOWNED', 1400); this.engine.sfx('down');
    await sleep(900);
    ui.card({ big: 'OPTIMIZED', body: 'The crew goes down. But the movement doesn\'t end here — try again.', small: 'GAME OVER' }, () => {
      this.args.onLose?.();
    }, 'RETRY');
  }

  _fled() {
    this._ended = true; ui.setActiveCard(null);
    this.combat.persist();
    this.args.onLose?.(); // flee returns to where we came from as a soft fail
  }

  update(dt) { for (const c of this.chars.values()) c.update(dt); }

  exit() {
    super.exit();
    ui.clearCombatHUD();
    for (const c of this.chars.values()) c.dispose?.();
    this.chars.clear();
  }
}
