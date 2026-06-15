// =============================================================================
//  Environments — low-poly geometry builders for the hub plaza, the dungeon
//  corridor, and the combat arena. Each returns a THREE.Group + metadata
//  (spawn point, interaction zones / segment markers) for the scene to use.
// =============================================================================
import * as THREE from 'three';

function pbrMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.9, metalness: opts.metal ?? 0.0, flatShading: true, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.ei ?? 1 });
}
function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pbrMat(color, opts));
  m.castShadow = true; m.receiveShadow = true; return m;
}

// ---------------------------------------------------------------- HUB -------
// A small night plaza: ground, café, stage, gym sign, library, with neon
// interaction "kiosks" the player walks up to. Returns interaction zones.
export function buildHub() {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), pbrMat(0x16161f, { rough: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);

  // wet-street reflection strips
  for (let i = -2; i <= 2; i++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 50), pbrMat(0x9dff3c, { emissive: 0x274d10, ei: 0.5 }));
    strip.rotation.x = -Math.PI / 2; strip.position.set(i * 4, 0.02, 0); strip.material.opacity = 0.4; strip.material.transparent = true;
    g.add(strip);
  }

  // surrounding buildings (skybox-ish silhouette)
  const ringColors = [0x1b1b28, 0x222232, 0x14141d];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 26 + Math.random() * 8;
    const h = 8 + Math.random() * 26;
    const b = box(3 + Math.random() * 3, h, 3 + Math.random() * 3, ringColors[i % 3]);
    b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    // lit windows
    const winCount = Math.floor(h / 3);
    for (let w = 0; w < winCount; w++) {
      if (Math.random() < 0.5) continue;
      const win = box(0.4, 0.4, 0.05, Math.random() < 0.5 ? 0x9dff3c : 0xff2d8b, { emissive: Math.random() < 0.5 ? 0x9dff3c : 0xff2d8b, ei: 1.5 });
      win.position.set((Math.random() - 0.5) * 2, -h / 2 + 2 + w * 3, 1.6);
      b.add(win);
    }
    g.add(b);
  }

  // central Maxorp tower looming in the distance (the dungeon target)
  const tower = box(7, 60, 7, 0x0d0d14, { emissive: 0x111118 });
  tower.position.set(0, 30, -34); g.add(tower);
  const towerLogo = box(5, 5, 0.3, 0xffd23c, { emissive: 0xffd23c, ei: 1.2 });
  towerLogo.position.set(0, 40, -30.3); g.add(towerLogo);

  // interaction kiosks: { id, label, position, color }
  const zones = [
    { id: 'cafe', label: 'Mara\'s Café', activity: 'cafe', pos: [-8, 0, -4], color: 0x38e8ff },
    { id: 'stage', label: 'Plaza Stage', activity: 'busk', pos: [8, 0, -4], color: 0xff2d8b },
    { id: 'gym', label: 'The Gym', activity: 'gym', pos: [-10, 0, 6], color: 0xff7a3c },
    { id: 'library', label: 'Public Library', activity: 'study', pos: [10, 0, 6], color: 0x9dff3c },
    { id: 'studio', label: 'Glo\'s Studio', activity: 'studio', pos: [0, 0, 10], color: 0xff2d8b },
    { id: 'tower', label: 'Maxorp Tower Entrance', activity: 'infiltrate', pos: [0, 0, -12], color: 0xffd23c },
  ];

  const markers = {};
  for (const z of zones) {
    const kiosk = new THREE.Group();
    const base = box(1.6, 0.4, 1.6, 0x0a0a0f, { emissive: z.color, ei: 0.15 });
    base.position.y = 0.2; kiosk.add(base);
    const pole = box(0.3, 2.6, 0.3, 0x222230); pole.position.y = 1.5; kiosk.add(pole);
    const sign = box(2.4, 1.1, 0.2, 0x111118, { emissive: z.color, ei: 0.4 }); sign.position.y = 3; kiosk.add(sign);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.9, 24), new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; kiosk.add(ring);
    kiosk.position.set(z.pos[0], 0, z.pos[2]);
    kiosk.userData.zone = z;
    kiosk.userData.ring = ring;
    g.add(kiosk);
    markers[z.id] = kiosk;
  }

  return { group: g, zones, markers, spawn: new THREE.Vector3(0, 0, 4), bounds: 22 };
}

// -------------------------------------------------------------- DUNGEON -----
// Linear corridor assembled from segment definitions. Walls + floor + neon
// trim + a "boss door". Returns per-segment trigger z positions.
export function buildDungeon(dungeonDef) {
  const g = new THREE.Group();
  const segLen = 18;
  let z = 0;
  const triggers = []; // { encounter, dialogue, z, label }

  const floorMat = pbrMat(0x101019, { rough: 0.7, metal: 0.2 });
  const wallMat = pbrMat(0x1a1426, { rough: 0.8 });

  dungeonDef.segments.forEach((seg, i) => {
    const len = seg.length || segLen;
    const cz = z - len / 2;
    // floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, len), floorMat);
    floor.position.set(0, -0.2, cz); floor.receiveShadow = true; g.add(floor);
    // walls
    for (const sx of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, len), wallMat);
      wall.position.set(sx * 4.25, 3, cz); wall.receiveShadow = true; wall.castShadow = true; g.add(wall);
      // neon trim line
      const trim = box(0.1, 0.15, len, i === dungeonDef.segments.length - 1 ? 0xffd23c : 0x9dff3c, { emissive: i === dungeonDef.segments.length - 1 ? 0xffd23c : 0x9dff3c, ei: 1.4 });
      trim.position.set(sx * 4, 1.4, cz); g.add(trim);
    }
    // corporate "art" panels
    if (i > 0) {
      const panel = box(2.4, 1.6, 0.1, 0x222232, { emissive: 0xffd23c, ei: 0.12 });
      panel.position.set(-3.7, 3.4, cz); panel.rotation.y = Math.PI / 2; g.add(panel);
    }
    // segment trigger at the far end
    triggers.push({ index: i, z: z - len + 1.5, encounter: seg.encounter, dialogue: seg.dialogue, label: seg.label, boss: seg.encounter === 'boss' });
    z -= len;
  });

  // boss door at the very end
  const door = box(6, 6, 0.6, 0x0a0a0f, { emissive: 0xffd23c, ei: 0.3 });
  door.position.set(0, 3, z - 0.5); g.add(door);

  return { group: g, triggers, spawn: new THREE.Vector3(0, 0, -2), endZ: z, halfWidth: 3.4 };
}

// --------------------------------------------------------------- ARENA ------
// Combat arena: a stylized disc the camera frames. Returns slot positions.
export function buildArena() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.4, 32), pbrMat(0x141420, { rough: 0.6 }));
  disc.position.y = -0.2; disc.receiveShadow = true; g.add(disc);
  // glowing edge
  const edge = new THREE.Mesh(new THREE.TorusGeometry(9, 0.12, 8, 48), pbrMat(0x9dff3c, { emissive: 0x9dff3c, ei: 1.3 }));
  edge.rotation.x = Math.PI / 2; edge.position.y = 0.05; g.add(edge);
  // halftone-ish backdrop dots
  for (let i = 0; i < 40; i++) {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.2 + Math.random() * 0.4, 12), new THREE.MeshBasicMaterial({ color: 0xff2d8b, transparent: true, opacity: 0.15 }));
    dot.position.set((Math.random() - 0.5) * 30, 1 + Math.random() * 10, -14);
    g.add(dot);
  }
  return { group: g };
}
