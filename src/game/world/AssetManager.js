// =============================================================================
//  AssetManager — the asset-swap layer. ONE entry point, loadCharacter(def):
//   - if def.model.glb is set → load the GLB, wrap an AnimationMixer, map
//     Mixamo-style clip names (idle/walk/attack/hit) to setAnim().
//   - otherwise → return a ProceduralCharacter placeholder.
//  Both expose the SAME Character interface, so scenes never branch on which.
//  Swapping a placeholder for a real model = set `model.glb` on the def. Done.
// =============================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ProceduralCharacter } from './CharacterFactory.js';

const ANIM_ALIASES = {
  idle: ['idle', 'Idle', 'mixamo.com', 'Armature|idle'],
  walk: ['walk', 'Walk', 'walking', 'Walking'],
  attack: ['attack', 'Attack', 'punch', 'Punch', 'slash'],
  hit: ['hit', 'Hit', 'damage', 'HitReaction'],
  down: ['down', 'Death', 'death', 'fall'],
  cast: ['cast', 'Cast', 'spell'],
};

class GLBCharacter {
  constructor(gltf) {
    this.object3d = gltf.scene;
    this.object3d.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    this.clips = gltf.animations || [];
    this.current = null;
  }
  _find(name) {
    const aliases = ANIM_ALIASES[name] || [name];
    for (const a of aliases) {
      const clip = this.clips.find((c) => c.name.toLowerCase().includes(a.toLowerCase()));
      if (clip) return clip;
    }
    return this.clips[0] || null;
  }
  setAnim(name) {
    const clip = this._find(name);
    if (!clip) return;
    const action = this.mixer.clipAction(clip);
    if (this.current === action) return;
    this.current?.fadeOut(0.2);
    action.reset().fadeIn(0.2).play();
    this.current = action;
  }
  face(angleY) { this.object3d.rotation.y = angleY; }
  flashHit() {} // GLB hit flash left to material setup
  update(dt) { this.mixer.update(dt); }
  dispose() { this.object3d.traverse((o) => o.geometry?.dispose?.()); }
}

class AssetManagerImpl {
  constructor() { this.loader = new GLTFLoader(); this.cache = new Map(); }

  // Returns a Promise<Character>. Procedural is synchronous-but-wrapped.
  async loadCharacter(def) {
    const glb = def?.model?.glb;
    if (glb) {
      try {
        const gltf = await this._loadGLB(glb);
        // clone scene so multiple instances don't share transforms
        const inst = gltf.scene.clone(true);
        const char = new GLBCharacter({ scene: inst, animations: gltf.animations });
        char.setAnim('idle');
        return char;
      } catch (e) {
        console.warn(`GLB load failed for ${def.id} (${glb}), using placeholder.`, e);
      }
    }
    return new ProceduralCharacter(def);
  }

  _loadGLB(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    const p = new Promise((res, rej) => this.loader.load(url, res, undefined, rej));
    this.cache.set(url, p);
    return p;
  }
}

export const assets = new AssetManagerImpl();
