# Asset drop-in guide — going from placeholders to realistic models

The game ships with **procedural placeholder** characters and a **generated**
environment light. Everything is built behind a swap layer so you can replace
placeholders with real assets **without touching engine code** — it's almost
always a one-line data edit.

There is already **one real rigged model wired end-to-end** (Slime By loads a
free animated GLB — see `data/config.js` → `EXAMPLE_MODELS`). Use it as your
working reference, then swap in your own.

---

## TL;DR — swap one character to your own model
1. Export a rigged humanoid from **Mixamo** as **glTF Binary (`.glb`)** with
   the animation clips below baked in.
2. Drop it in `assets/models/`, e.g. `assets/models/slimeby.glb`.
3. Point the character at it — edit `model.glb` in the data file:
   ```js
   // src/game/data/party.js
   model: { glb: '/assets/models/slimeby.glb', body: 0x9dff3c, accent: 0x143b08, build: 'slime', height: 1.85 }
   ```
   (`height` is the target height in metres — the model is **auto-scaled and
   grounded** to it. `body/accent/build` are only used by the procedural
   fallback.)
4. Done. If the file is missing/broken it silently falls back to the placeholder.

To turn the example reference off and use procedural everywhere, set
`EXAMPLE_MODELS.enabled = false` in `data/config.js`.

---

## 1. Character models — what to produce
Format: **glTF 2.0 binary `.glb`**, Y-up, ~real-world scale, humanoid skeleton
(Mixamo standard). Budget for web: ~15–40k tris, one PBR material set
(albedo / normal / roughness / metalness / AO), 1–2k textures. Compress with
**Draco** (meshes) and **KTX2/Basis** (textures) — the loader already supports
both (decoders are pulled from a CDN automatically).

| Slot (`model.glb` lives in…) | Character | Suggested filename |
|---|---|---|
| `data/party.js` | Slime By (hero) | `assets/models/slimeby.glb` |
| `data/party.js` | Riff (ally) | `assets/models/riff.glb` |
| `data/confidants.js` | Mara | `assets/models/mara.glb` |
| `data/confidants.js` | Devon | `assets/models/devon.glb` |
| `data/confidants.js` | Glo | `assets/models/glo.glb` |
| `data/enemies.js` | Unpaid Intern | `assets/models/intern.glb` |
| `data/enemies.js` | Middle Manager | `assets/models/middlemgr.glb` |
| `data/enemies.js` | HR Enforcer | `assets/models/hrenforcer.glb` |
| `data/enemies.js` | Audit Drone | `assets/models/auditbot.glb` |
| `data/enemies.js` | Brand Shill | `assets/models/shill.glb` |
| `data/enemies.js` | Union Buster | `assets/models/saboteur.glb` |
| `data/enemies.js` | The Liquidator (boss) | `assets/models/liquidator.glb` |

## 2. Animation clips — name them so the engine maps them
The loader matches clip names case-insensitively. Bake at least these
(Mixamo names in parentheses work out of the box):

| Engine state | Matches clip names containing |
|---|---|
| `idle`   | idle |
| `walk`   | walk / walking |
| `attack` | attack / punch / slash |
| `cast`   | cast / spell |
| `hit`    | hit / damage / hitreaction |
| `down`   | down / death / fall |

Missing a clip is fine — it falls back to the first clip. **Mixamo tip:** select
your character, add each animation, download as **glTF Binary**, "Without Skin"
for extra clips, then merge (e.g. in Blender) so one `.glb` holds all clips.

## 3. Environments (optional, biggest realism-per-effort win)
Model in Blender / kitbash, export `.glb` with baked PBR textures. Three scenes:
hub plaza, Maxorp Tower interior, combat arena backdrop. (Wiring a loaded
environment GLB into a scene is a small code change — ask and I'll add an
`environment.glb` hook to `Environments.js`.)

## 4. Lighting — drop in a real HDRI (optional)
The engine currently lights via a generated room environment (no file needed).
For a specific mood, put an `.hdr` in `assets/hdri/` and I'll wire
`scene.environment` to load it (one small change in `core/Engine.js`).

## 5. Audio
Replace the synthesized SFX in `core/Engine.js` (`sfx()`), and add music tracks.
Put files in `assets/audio/`. Needed: hub / battle / boss themes + victory
sting; SFX for move, confirm, cancel, hit, crit, weakness, heal, level-up,
all-out.

---

## What the engine already does for realism
- ACES filmic tone mapping + sRGB output (correct color).
- Image-based lighting (reflections/ambient) from a generated environment.
- 2k shadow maps, bloom tuned for PBR, vignette + slight color grade.
- GLTF loader with **Draco + KTX2 + Meshopt** decoders.
- **Auto-fit**: any model is scaled to `height` and grounded — no manual scaling.
- Per-instance skeleton cloning, so repeated enemies animate independently.
