// =============================================================================
//  DialogueScene — generic branching-dialogue beat over a stylized backdrop.
//  args: { treeId, backdrop?, characters?:[{model,x}], onComplete, onCombat, onRankUp }
// =============================================================================
import * as THREE from 'three';
import { SceneBase } from './SceneBase.js';
import { getTree } from '../data/dialogue.js';
import { DialogueRunner } from '../systems/Dialogue.js';
import { assets } from '../world/AssetManager.js';
import { ui } from '../ui/UI.js';

export class DialogueScene extends SceneBase {
  async enter(args) {
    this.args = args;
    this.chars = [];
    this.engine.clearScene();
    this._backdrop(args.backdrop);
    this.engine.camera.position.set(0, 2.2, 7);
    this.engine.camera.lookAt(0, 1.6, 0);

    // optional on-stage characters
    if (args.characters) {
      for (const cdef of args.characters) {
        const c = await assets.loadCharacter(cdef);
        c.object3d.position.set(cdef.x ?? 0, 0, -1);
        c.face(cdef.face ?? 0);
        c.setAnim('idle');
        this.engine.scene.add(c.object3d);
        this.chars.push(c);
      }
    }

    const dlg = ui.dialogue(() => this.runner.advance());
    this.dlg = dlg;
    this.runner = new DialogueRunner(getTree(args.treeId), this.state, {
      onNode: (node) => dlg.setNode(node),
      onChoices: (node, choices) => dlg.showChoices(choices, (i) => this.runner.choose(i)),
      onAction: (action, arg) => this._action(action, arg),
      onEnd: () => this._complete(),
    });
    this.runner.start();
  }

  _backdrop(kind) {
    const g = new THREE.Group();
    // dark gradient handled by scene bg; add a few neon panels for depth
    const colors = kind === 'tower' ? [0xffd23c, 0xff2d8b] : [0x9dff3c, 0xff2d8b, 0x38e8ff];
    for (let i = 0; i < 14; i++) {
      const c = colors[i % colors.length];
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.4 + Math.random(), 3 + Math.random() * 5),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7, transparent: true, opacity: 0.25 }));
      panel.position.set((Math.random() - 0.5) * 24, 2 + Math.random() * 4, -8 - Math.random() * 8);
      panel.rotation.z = (Math.random() - 0.5) * 0.4;
      g.add(panel);
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0d0d14, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    this.engine.scene.add(g); this.bg = g;
  }

  _action(action, arg) {
    this.dlg.close();
    if (action === 'startCombat') { this.args.onCombat?.(arg); }
    else if (action === 'rankUp') { this.args.onRankUp?.(arg); }
    else { this._complete(); }
  }

  _complete() { this.dlg?.close(); this.args.onComplete?.(); }

  update(dt) { for (const c of this.chars) c.update(dt); }
  exit() { super.exit(); this.dlg?.close(); for (const c of this.chars) c.dispose?.(); }
}
