// =============================================================================
//  TutorialScene — teaches movement: walk Slime By down a neon path to a marker
//  (a lurking "cognition"). Reaching it fires the combat tutorial.
//  args: { onReach() }
// =============================================================================
import * as THREE from 'three';
import { SceneBase } from './SceneBase.js';
import { assets } from '../world/AssetManager.js';
import { getPartyDef } from '../data/party.js';
import { input } from '../core/Input.js';
import { ui } from '../ui/UI.js';
import { bus } from '../core/EventBus.js';

export class TutorialScene extends SceneBase {
  async enter(args) {
    this.args = args;
    this.engine.clearScene();
    this.triggered = false;

    // platform path
    const g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 40), new THREE.MeshStandardMaterial({ color: 0x121220, roughness: 0.7, flatShading: true }));
    floor.position.set(0, -0.2, -12); floor.receiveShadow = true; g.add(floor);
    for (let i = 0; i < 10; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0x9dff3c, emissive: 0x9dff3c, emissiveIntensity: 1 }));
      line.position.set(0, 0.05, 2 - i * 3.4); g.add(line);
    }
    // goal marker
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.7, 24), new THREE.MeshBasicMaterial({ color: 0xff2d8b, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.06, -22); g.add(ring);
    this.marker = new THREE.Vector3(0, 0, -22); this.ring = ring;
    // a shadow lurking at the marker
    const shadow = await assets.loadCharacter({ id: 'tut_intern', model: { body: 0x6b6b8a, accent: 0x222230, build: 'drone', height: 1.6 } });
    shadow.object3d.position.set(0, 0, -23.5); shadow.face(0); shadow.setAnim('idle');
    this.engine.scene.add(shadow.object3d); this.shadow = shadow;

    this.engine.scene.add(g); this.bg = g;

    // player
    this.player = await assets.loadCharacter(getPartyDef('sb'));
    this.player.object3d.position.set(0, 0, 2);
    this.engine.scene.add(this.player.object3d);
    this.engine.camera.position.set(0, 7, 11);
    this.engine.camera.lookAt(0, 1, 0);

    ui.setObjective('TUTORIAL', 'Use WASD / arrows to walk to the magenta ring.');
    this.track(bus.on('input:interact', () => this._tryTrigger()));
  }

  _tryTrigger() {
    if (this.triggered) return;
    if (this.player.object3d.position.distanceTo(this.marker) < 2.2) {
      this.triggered = true; ui.hidePrompt(); ui.clearObjective();
      this.args.onReach?.();
    }
  }

  update(dt) {
    if (this.triggered) { this.player.update(dt); this.shadow.update(dt); return; }
    const ax = input.axis;
    const speed = 6;
    const p = this.player.object3d.position;
    if (Math.hypot(ax.x, ax.y) > 0.1) {
      p.x = THREE.MathUtils.clamp(p.x + ax.x * speed * dt, -3.4, 3.4);
      p.z = THREE.MathUtils.clamp(p.z + ax.y * speed * dt, -21, 3);
      this.player.face(Math.atan2(ax.x, ax.y));
      this.player.setAnim('walk');
    } else this.player.setAnim('idle');

    // camera follow
    const cam = this.engine.camera;
    const want = new THREE.Vector3(p.x * 0.4, 7, p.z + 9);
    cam.position.lerp(want, 1 - Math.pow(0.001, dt));
    cam.lookAt(p.x * 0.4, 1, p.z);

    // proximity prompt
    const near = p.distanceTo(this.marker) < 2.2;
    if (near) ui.showPrompt('Press E / Space — Investigate'); else ui.hidePrompt();
    this.ring.rotation.z += dt;
    this.player.update(dt); this.shadow.update(dt);
  }

  exit() { super.exit(); ui.hidePrompt(); ui.clearObjective(); this.player?.dispose?.(); this.shadow?.dispose?.(); }
}
