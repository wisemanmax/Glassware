// =============================================================================
//  SLIME BY — bootstrap + story state machine. Wires the engine, input, UI and
//  scenes into the full vertical loop:
//    title → intro → tutorial → hub (calendar/social) ⇄ dungeon → boss →
//    confidant payoff → cliffhanger.
//  Generic tools: runCombat() and DialogueScene drive the reusable beats.
// =============================================================================
import { Engine } from './core/Engine.js';
import { input } from './core/Input.js';
import { ui } from './ui/UI.js';
import { SaveState } from './core/SaveState.js';
import { newGame } from './core/GameState.js';

import { assets } from './world/AssetManager.js';
import { DialogueScene } from './scenes/DialogueScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { HubScene } from './scenes/HubScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';
import { CombatScene } from './scenes/CombatScene.js';

import { getCard } from './data/story.js';
import { getPartyDef } from './data/party.js';
import { getEnemy } from './data/enemies.js';
import { getEncounter } from './data/dungeon.js';
import { getConfidant } from './data/confidants.js';
import { Relationships } from './systems/Relationships.js';

// helper to build a dialogue stage character def
const stage = (id, model, x, face) => ({ id, model, x, face });

class Game {
  constructor() {
    this.engine = new Engine();
    ui.init(this.engine);
    assets.init(this.engine.renderer); // GLTF loader + Draco/KTX2/Meshopt
    input.bindTouch();
    this.state = newGame();
    this.scene = null;
    this._transitioning = false;
    this.engine.addUpdater((dt) => { input.endFrame(); this.scene?.update(dt); });
    this.engine.start();
    this._boot();
  }

  save() { SaveState.save(this.state); }

  async transitionTo(SceneClass, args = {}) {
    if (this._transitioning) return;
    this._transitioning = true;
    await ui.wipe(() => {
      this.scene?.exit();
      this.scene = null;
      ui.clearUI(); ui.clearFX();
    });
    const s = new SceneClass(this);
    await s.enter(args);
    this.scene = s;
    this._transitioning = false;
  }

  runCombat(encounterId, { banner, onWin, onLose }) {
    this.transitionTo(CombatScene, { encounterId, banner, onWin, onLose });
  }

  // ----------------------------------------------------------- BOOT --------
  _boot() {
    const start = document.getElementById('boot-start');
    const cont = document.getElementById('boot-continue');
    if (SaveState.has()) cont.hidden = false;
    start.onclick = () => { this._hideBoot(); this.state = newGame(); this.beginStory(); };
    cont.onclick = () => { const s = SaveState.load(); if (s) { this.state = s; this._hideBoot(); this._resume(); } };
  }
  _hideBoot() { const b = document.getElementById('boot'); if (b) b.style.display = 'none'; }
  _resume() {
    switch (this.state.storyProgress) {
      case 'hub': return this._toHub(false);
      case 'dungeon': case 'boss': return this._toDungeon();
      case 'ending': return this._toHub(false);
      default: return this.beginStory();
    }
  }

  // ----------------------------------------------------------- STORY -------
  beginStory() {
    this.state.storyProgress = 'intro';
    ui.card(getCard('title'), () => this._intro(), 'BEGIN');
  }

  _intro() {
    this.transitionTo(DialogueScene, {
      treeId: 'intro', backdrop: 'tower',
      characters: [
        stage('ceo', getEnemy('liquidator').model, 2.6, -1.1),
        stage('sb', getPartyDef('sb').model, -2.6, 1.1),
      ],
      onComplete: () => this._toTutorial(),
    });
  }

  _toTutorial() {
    this.state.storyProgress = 'tutorial';
    ui.card(getCard('toTutorial'), () => {
      this.transitionTo(TutorialScene, { onReach: () => this._tutorialFight() });
    });
  }
  _tutorialFight() {
    this.transitionTo(DialogueScene, {
      treeId: 'tutorial_combat', backdrop: 'tower',
      characters: [stage('riff', getPartyDef('riff').model, -2.4, 1.0), stage('sb', getPartyDef('sb').model, 0.4, 0.6)],
      onCombat: () => this.runCombat('tutorial', {
        banner: getEncounter('tutorial').banner,
        onWin: () => this._tutorialWin(),
        onLose: () => this._tutorialFight(),
      }),
    });
  }
  _tutorialWin() {
    this.transitionTo(DialogueScene, {
      treeId: 'tutorial_win', backdrop: 'dark',
      characters: [stage('riff', getPartyDef('riff').model, -1.5, 0.7), stage('sb', getPartyDef('sb').model, 1.5, -0.7)],
      onComplete: () => { this.state.storyProgress = 'hub'; this.save(); this._toHub(true); },
    });
  }

  // ----------------------------------------------------------- HUB ---------
  _toHub(showCard) {
    this.state.storyProgress = 'hub';
    this.save();
    const go = () => this.transitionTo(HubScene, {
      onEnterDungeon: () => this._toDungeon(),
      onConfidant: (id) => this._confidantScene(id),
    });
    if (showCard) ui.card(getCard('toHub'), go); else go();
  }

  _confidantScene(id) {
    const rank = this.state.confidants[id].rank;
    const rankDef = Relationships.perkForRank(id, rank);
    const conf = getConfidant(id);
    if (!rankDef) return this._toHub(false);
    this.transitionTo(DialogueScene, {
      treeId: rankDef.sceneId, backdrop: 'plaza',
      characters: [stage(id, conf.model, 1.0, -0.6), stage('sb', getPartyDef('sb').model, -2.4, 0.6)],
      onRankUp: () => {
        Relationships.applyPerk(this.state, rankDef.perk);
        this.save();
        this.engine.sfx('rankup');
        ui.banner('RANK UP!', 1400);
        setTimeout(() => ui.card({ big: `${conf.name.toUpperCase()} · RANK ${rank}`, body: rankDef.perk.desc, small: 'CONFIDANT BOND' }, () => this._toHub(false)), 250);
      },
      onComplete: () => this._toHub(false),
    });
  }

  // --------------------------------------------------------- DUNGEON -------
  _toDungeon() {
    this.state.storyProgress = 'dungeon';
    if (this.state.flags.dungeonProgress == null) this.state.flags.dungeonProgress = 0;
    this.save();
    const enter = () => this.transitionTo(DungeonScene, { onTrigger: (trig, idx) => this._dungeonTrigger(trig, idx) });
    if (!this.state.flags.enteredDungeonOnce) { this.state.flags.enteredDungeonOnce = true; ui.card(getCard('toDungeon'), enter, 'INFILTRATE'); }
    else enter();
  }

  _dungeonTrigger(trig, idx) {
    if (trig.boss) {
      this.transitionTo(DialogueScene, {
        treeId: trig.dialogue, backdrop: 'tower',
        characters: [stage('liq', getEnemy('liquidator').model, 1.4, -0.4), stage('sb', getPartyDef('sb').model, -2.4, 0.5)],
        onCombat: () => this.runCombat('boss', {
          banner: getEncounter('boss').banner,
          onWin: () => { this.state.flags.dungeonProgress = idx + 1; this.save(); this._bossWin(); },
          onLose: () => this._retryDungeon(),
        }),
      });
    } else {
      this.runCombat(trig.encounter, {
        banner: getEncounter(trig.encounter).banner,
        onWin: () => { this.state.flags.dungeonProgress = idx + 1; this.save(); this._toDungeon(); },
        onLose: () => this._retryDungeon(),
      });
    }
  }

  _retryDungeon() {
    // soft fail: patch the crew up and resume the same segment
    for (const id in this.state.party) {
      const def = getPartyDef(id);
      if (!def) continue;
      this.state.party[id].hp = def.maxHp + (id === 'sb' ? (this.state.flags.bonusHp || 0) : 0);
      this.state.party[id].sp = def.maxSp + (id === 'sb' ? (this.state.flags.bonusSp || 0) : 0);
    }
    this._toDungeon();
  }

  _bossWin() {
    this.state.storyProgress = 'boss';
    this.save();
    this.transitionTo(DialogueScene, {
      treeId: 'boss_win', backdrop: 'tower',
      characters: [stage('liq', getEnemy('liquidator').model, 1.4, -0.4), stage('sb', getPartyDef('sb').model, -2.4, 0.5)],
      onComplete: () => this._ending(),
    });
  }

  // --------------------------------------------------------- ENDING --------
  _ending() {
    this.state.storyProgress = 'ending';
    this.save();
    ui.card(getCard('ending'), () => {
      ui.card({
        big: 'SLICE COMPLETE',
        body: 'You played the full loop: cutscene → tutorial → social-sim day → infiltration → mini-boss → confidant payoff → cliffhanger.<br><br>Every system is data-driven and extensible. Open <b>src/game/data/config.js</b> to drop in your Slime By branding, names, and (via <b>model.glb</b>) real rigged 3D models.',
        small: 'THANKS FOR PLAYING',
      }, () => this._restart(), 'NEW GAME');
    }, 'CONTINUE');
  }

  _restart() { SaveState.clear(); location.reload(); }
}

window.addEventListener('DOMContentLoaded', () => { window.__game = new Game(); });
