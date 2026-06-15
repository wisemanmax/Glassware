// =============================================================================
//  CharacterFactory — procedural low-poly rigged humanoid PLACEHOLDER.
//  Builds a jointed figure from primitives with named limbs so we can animate
//  idle / walk / attack / hit / down poses. This sits behind AssetManager: the
//  moment a character def has `model.glb`, AssetManager returns a real GLTF
//  (with AnimationMixer) instead and NOTHING else in the game changes.
//
//  Public Character API (shared by GLB + procedural so scenes are model-agnostic):
//    .object3d            THREE.Object3D root
//    .setAnim(name)       'idle'|'walk'|'attack'|'hit'|'down'|'cast'
//    .update(dt)          advance animation
//    .face(angleY)        turn to face a yaw
//    .flashHit()          quick damage flash
// =============================================================================
import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.6, metalness: opts.metal ?? 0.1, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.ei ?? 1, flatShading: true });
}

export class ProceduralCharacter {
  constructor(def) {
    this.def = def;
    const m = def.model || {};
    this.bodyColor = m.body ?? 0x9dff3c;
    this.accent = m.accent ?? 0x111122;
    this.build = m.build ?? 'casual';
    this.height = m.height ?? 1.8;
    this.object3d = new THREE.Group();
    this.parts = {};
    this._t = 0;
    this.anim = 'idle';
    this._animTime = 0;
    this._build();
  }

  _box(w, h, d, color, opts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  _build() {
    const s = this.height / 1.8; // scale factor
    const root = this.object3d;
    const isBoss = this.build === 'boss';
    const isDrone = this.build === 'drone';
    const isSlime = this.build === 'slime';

    // pelvis/root group at hip height
    const hip = new THREE.Group();
    hip.position.y = 0.9 * s;
    root.add(hip);
    this.parts.hip = hip;

    // torso
    const torsoColor = this.bodyColor;
    const torso = this._box(0.62 * s, 0.7 * s, 0.34 * s, torsoColor, { emissive: isSlime ? this.bodyColor : 0x000000, ei: isSlime ? 0.25 : 1 });
    torso.position.y = 0.42 * s;
    hip.add(torso);
    this.parts.torso = torso;

    // chest accent stripe (brand seam)
    const stripe = this._box(0.2 * s, 0.5 * s, 0.36 * s, this.accent);
    stripe.position.set(0, 0.42 * s, 0.001);
    hip.add(stripe);

    // head
    const headGrp = new THREE.Group();
    headGrp.position.y = 0.95 * s;
    hip.add(headGrp);
    this.parts.head = headGrp;
    const head = this._box(0.4 * s, 0.42 * s, 0.4 * s, isSlime ? this.bodyColor : 0xd9c2a6, { emissive: isSlime ? this.bodyColor : 0x000000, ei: isSlime ? 0.35 : 1, rough: isSlime ? 0.3 : 0.7 });
    headGrp.add(head);
    // glowing eyes (signature)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9dff3c, emissiveIntensity: 2.2 });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08 * s, 0.06 * s, 0.04 * s), eyeMat);
      eye.position.set(sx * 0.1 * s, 0.02 * s, 0.2 * s);
      headGrp.add(eye);
    }
    // build-specific headgear
    if (this.build === 'punk') {
      const hawk = this._box(0.06 * s, 0.22 * s, 0.34 * s, this.bodyColor, { emissive: this.bodyColor, ei: 0.6 });
      hawk.position.y = 0.3 * s; headGrp.add(hawk);
    } else if (this.build === 'suit') {
      const hat = this._box(0.46 * s, 0.06 * s, 0.46 * s, 0x111111); hat.position.y = 0.24 * s; headGrp.add(hat);
    } else if (isSlime) {
      const hood = this._box(0.5 * s, 0.3 * s, 0.5 * s, this.accent); hood.position.set(0, 0.16 * s, -0.02 * s); headGrp.add(hood);
    }

    // arms (shoulder groups so we can swing/attack)
    this.parts.arms = {};
    for (const side of ['l', 'r']) {
      const sx = side === 'l' ? -1 : 1;
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * 0.42 * s, 0.62 * s, 0);
      hip.add(shoulder);
      const upper = this._box(0.16 * s, 0.42 * s, 0.16 * s, torsoColor);
      upper.position.y = -0.2 * s; shoulder.add(upper);
      const hand = this._box(0.18 * s, 0.18 * s, 0.18 * s, this.accent);
      hand.position.y = -0.46 * s; shoulder.add(hand);
      this.parts.arms[side] = shoulder;
    }

    // legs
    this.parts.legs = {};
    if (!isDrone && !isSlime) {
      for (const side of ['l', 'r']) {
        const sx = side === 'l' ? -1 : 1;
        const hipJoint = new THREE.Group();
        hipJoint.position.set(sx * 0.18 * s, 0.06 * s, 0);
        hip.add(hipJoint);
        const leg = this._box(0.2 * s, 0.5 * s, 0.2 * s, this.accent);
        leg.position.y = -0.28 * s; hipJoint.add(leg);
        const foot = this._box(0.22 * s, 0.1 * s, 0.3 * s, 0x0a0a0f);
        foot.position.set(0, -0.55 * s, 0.05 * s); hipJoint.add(foot);
        this.parts.legs[side] = hipJoint;
      }
    } else if (isSlime) {
      // slime "base" instead of legs — a blobby skirt
      const base = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 0.9 * s, 8), mat(this.bodyColor, { emissive: this.bodyColor, ei: 0.3, rough: 0.25 }));
      base.position.y = -0.45 * s; base.castShadow = true; hip.add(base);
      this.parts.slimeBase = base;
      hip.position.y = 0.95 * s;
    } else if (isDrone) {
      // floating drone — single hover ring, no legs
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35 * s, 0.07 * s, 8, 16), mat(0x38e8ff, { emissive: 0x38e8ff, ei: 0.8 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.2 * s; hip.add(ring);
      this.parts.ring = ring;
    }

    if (isBoss) {
      // shoulder pads + crown of coins for the executive boss
      for (const sx of [-1, 1]) {
        const pad = this._box(0.36 * s, 0.18 * s, 0.4 * s, 0xffd23c, { emissive: 0x553f00, metal: 0.6, rough: 0.3 });
        pad.position.set(sx * 0.5 * s, 0.66 * s, 0); hip.add(pad);
      }
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.3 * s, 0.18 * s, 6), mat(0xffd23c, { emissive: 0x554000, metal: 0.7, rough: 0.2 }));
      crown.position.y = 0.34 * s; headGrp.add(crown);
    }

    // shadow contact (cheap blob)
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.5 * s, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; root.add(blob);

    this._collectMats();
  }

  _collectMats() {
    this._mats = [];
    this.object3d.traverse((o) => {
      if (o.material && o.material.emissive !== undefined) {
        o.material.userData.baseEmissive = o.material.emissive.clone();
        this._mats.push(o.material);
      }
    });
  }

  setAnim(name) { if (this.anim !== name) { this.anim = name; this._animTime = 0; } }
  face(angleY) { this.object3d.rotation.y = angleY; }

  flashHit() { this._flash = 0.25; }

  update(dt) {
    this._t += dt;
    this._animTime += dt;
    const t = this._t;
    const hip = this.parts.hip;
    const { arms, legs } = this.parts;

    // reset rotations we drive
    if (this.anim === 'idle') {
      const bob = Math.sin(t * 2) * 0.03;
      hip.position.y = (this.parts.slimeBase ? 0.95 : 0.9) * (this.height / 1.8) + bob;
      if (arms) { arms.l.rotation.x = Math.sin(t * 2) * 0.08; arms.r.rotation.x = -Math.sin(t * 2) * 0.08; arms.l.rotation.z = 0.08; arms.r.rotation.z = -0.08; }
      if (legs?.l) { legs.l.rotation.x = 0; legs.r.rotation.x = 0; }
      if (this.parts.slimeBase) this.parts.slimeBase.scale.set(1 + bob * 0.3, 1 - bob * 0.3, 1 + bob * 0.3);
      if (this.parts.ring) this.parts.ring.rotation.z = t * 2;
    } else if (this.anim === 'walk') {
      const sw = Math.sin(t * 9);
      hip.position.y = (this.parts.slimeBase ? 0.95 : 0.9) * (this.height / 1.8) + Math.abs(Math.sin(t * 9)) * 0.06;
      if (legs?.l) { legs.l.rotation.x = sw * 0.7; legs.r.rotation.x = -sw * 0.7; }
      if (arms) { arms.l.rotation.x = -sw * 0.5; arms.r.rotation.x = sw * 0.5; }
      if (this.parts.slimeBase) this.parts.slimeBase.position.y = -0.45 * (this.height / 1.8) + Math.abs(sw) * 0.08;
      if (this.parts.ring) this.parts.ring.rotation.z = t * 6;
    } else if (this.anim === 'attack') {
      // quick forward lunge of right arm
      const p = Math.min(1, this._animTime / 0.35);
      const swing = Math.sin(p * Math.PI) ;
      if (arms) { arms.r.rotation.x = -2.2 * swing; }
      hip.rotation.x = -0.15 * swing;
      if (this._animTime > 0.4) this.setAnim('idle');
    } else if (this.anim === 'cast') {
      const p = Math.min(1, this._animTime / 0.5);
      const raise = Math.sin(p * Math.PI);
      if (arms) { arms.l.rotation.x = -2.4 * raise; arms.r.rotation.x = -2.4 * raise; }
      hip.position.y += raise * 0.05;
      if (this._animTime > 0.55) this.setAnim('idle');
    } else if (this.anim === 'hit') {
      const p = Math.min(1, this._animTime / 0.3);
      hip.rotation.x = Math.sin(p * Math.PI) * 0.3;
      if (this._animTime > 0.3) this.setAnim('idle');
    } else if (this.anim === 'down') {
      hip.rotation.x = 1.2;
      hip.position.y = 0.4 * (this.height / 1.8);
    }

    // hit flash: ramp emissive toward red, then restore each material's base
    if (this._flash > 0) {
      this._flash -= dt;
      const k = Math.max(0, this._flash / 0.25);
      for (const m of this._mats) m.emissive.setRGB(k, k * 0.2, k * 0.2);
      if (this._flash <= 0) for (const m of this._mats) m.emissive.copy(m.userData.baseEmissive);
    }
  }

  dispose() {
    this.object3d.traverse((o) => { o.geometry?.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
  }
}
