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
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ProceduralCharacter } from './CharacterFactory.js';

// Decoder assets are pulled from the matching three version on jsDelivr so the
// raw (no-build) GitHub Pages deploy works; same URLs are fine through Vite.
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/libs';

const ANIM_ALIASES = {
  idle: ['idle', 'Idle', 'mixamo.com', 'Armature|idle'],
  walk: ['walk', 'Walk', 'walking', 'Walking'],
  attack: ['attack', 'Attack', 'punch', 'Punch', 'slash'],
  hit: ['hit', 'Hit', 'damage', 'HitReaction'],
  down: ['down', 'Death', 'death', 'fall'],
  cast: ['cast', 'Cast', 'spell'],
};

class GLBCharacter {
  constructor(gltf, def = {}) {
    // Wrap in a group so we can auto-fit (scale + ground) ANY model to the
    // target height without disturbing its animation tracks.
    this.object3d = new THREE.Group();
    const inner = gltf.scene;
    this.object3d.add(inner);
    const targetH = def?.model?.height || 1.8;
    const box = new THREE.Box3().setFromObject(inner);
    const size = new THREE.Vector3(); box.getSize(size);
    if (size.y > 0.001) {
      const s = targetH / size.y;
      inner.scale.setScalar(s);
      const box2 = new THREE.Box3().setFromObject(inner);
      const c = new THREE.Vector3(); box2.getCenter(c);
      inner.position.set(-c.x, -box2.min.y, -c.z); // center x/z, feet at y=0
    }
    inner.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        // let PBR materials pick up the scene's image-based lighting
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) { if (m && 'envMapIntensity' in m) m.envMapIntensity = 1.0; }
      }
    });
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
  constructor() { this.cache = new Map(); this.loader = null; }

  // Wire up the GLTF loader with Draco / KTX2 / Meshopt decoders. Call once
  // with the renderer (needed for KTX2 GPU-format detection).
  init(renderer) {
    if (this.loader) return;
    const loader = new GLTFLoader();
    const draco = new DRACOLoader().setDecoderPath(`${THREE_CDN}/draco/`);
    loader.setDRACOLoader(draco);
    try {
      const ktx2 = new KTX2Loader().setTranscoderPath(`${THREE_CDN}/basis/`).detectSupport(renderer);
      loader.setKTX2Loader(ktx2);
    } catch (e) { /* KTX2 optional */ }
    loader.setMeshoptDecoder(MeshoptDecoder);
    this.loader = loader;
  }

  // Returns a Promise<Character>. Procedural is synchronous-but-wrapped.
  async loadCharacter(def) {
    const glb = def?.model?.glb;
    if (glb) {
      if (!this.loader) this.loader = new GLTFLoader(); // fallback if init() skipped
      try {
        const gltf = await this._loadGLB(glb);
        // SkeletonUtils.clone properly duplicates skinned meshes + skeletons so
        // multiple instances of the same model animate independently.
        const inst = cloneSkinned(gltf.scene);
        const char = new GLBCharacter({ scene: inst, animations: gltf.animations }, def);
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
