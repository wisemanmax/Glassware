// =============================================================================
//  DungeonScene — the "Palace": a linear corridor through Maxorp Tower. Walk
//  forward; each segment ends in an encounter trigger; the last is the boss.
//  Progress persists in state.flags.dungeonProgress so we can leave for combat
//  and resume. args: { onTrigger(trigger) }
// =============================================================================
import * as THREE from 'three';
import { SceneBase } from './SceneBase.js';
import { buildDungeon } from '../world/Environments.js';
import { DUNGEON } from '../data/dungeon.js';
import { assets } from '../world/AssetManager.js';
import { getPartyDef } from '../data/party.js';
import { input } from '../core/Input.js';
import { ui } from '../ui/UI.js';

export class DungeonScene extends SceneBase {
  async enter(args) {
    this.args = args;
    this.engine.clearScene();
    this.engine.scene.background = new THREE.Color(0x05050a);

    const d = buildDungeon(DUNGEON);
    this.d = d; this.engine.scene.add(d.group);

    this.progress = this.state.flags.dungeonProgress || 0;
    this.target = d.triggers[this.progress];

    this.player = await assets.loadCharacter(getPartyDef('sb'));
    // resume position: just at the previously cleared trigger, else spawn
    const startZ = this.progress > 0 ? d.triggers[this.progress - 1].z : d.spawn.z;
    this.player.object3d.position.set(0, 0, startZ);
    this.player.face(Math.PI); // face -z (down the corridor)
    this.engine.scene.add(this.player.object3d);

    this.engine.camera.position.set(0, 5.5, startZ + 9);
    this.engine.camera.lookAt(0, 1, startZ - 4);

    ui.setObjective(this.target?.boss ? 'EXECUTIVE SUITE' : 'INFILTRATION',
      this.target ? `Advance to: ${this.target.label}` : 'Clear the floor.');
    this.fired = false;
  }

  update(dt) {
    this.player.update(dt);
    if (this.fired || !this.target) return;

    const ax = input.axis;
    const p = this.player.object3d.position;
    const speed = 7, hw = this.d.halfWidth - 0.6;
    if (Math.hypot(ax.x, ax.y) > 0.1) {
      p.x = THREE.MathUtils.clamp(p.x + ax.x * speed * dt, -hw, hw);
      p.z = THREE.MathUtils.clamp(p.z + ax.y * speed * dt, this.d.endZ + 1, this.d.spawn.z + 1);
      this.player.face(Math.atan2(ax.x, ax.y));
      this.player.setAnim('walk');
    } else this.player.setAnim('idle');

    const cam = this.engine.camera;
    const want = new THREE.Vector3(p.x * 0.3, 5.5, p.z + 9);
    cam.position.lerp(want, 1 - Math.pow(0.002, dt));
    cam.lookAt(p.x * 0.3, 1, p.z - 4);

    // trigger when reaching the segment end
    if (p.z <= this.target.z) {
      this.fired = true;
      ui.hidePrompt(); ui.clearObjective();
      this.player.setAnim('idle');
      this.args.onTrigger?.(this.target, this.progress);
    } else {
      const dist = p.z - this.target.z;
      if (dist < 5) ui.showPrompt(this.target.boss ? 'The Executive Suite looms ahead...' : 'Shadows ahead — keep moving');
      else ui.hidePrompt();
    }
  }

  exit() { super.exit(); ui.hidePrompt(); ui.clearObjective(); this.player?.dispose?.(); }
}
