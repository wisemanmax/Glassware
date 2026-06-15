# SLIME BY — *Saving the World from Corporate America*

A playable **vertical slice** of a Persona 5–inspired turn-based JRPG, built with
**Three.js / WebGL** and plain ES modules. Two pillars, weighted equally:
stylized turn-based combat in corporate "dungeons," and a social-sim daily-life
loop (calendar, social stats, confidants). You play **Slime By (SB)**, exposing
and dismantling the conglomerate *Maxorp*.

> This repo previously hosted the *Wiseforge* landing page (still on its own
> files/branch). The game lives entirely under **`src/game/`** and is the entry
> point of `index.html` on this branch. See **`PLAN.md`** for the design
> contract, data schemas, and the honest scope cuts.

## Run it

```bash
npm install
npm run dev        # Vite dev server → open the printed localhost URL
# or, for a production build:
npm run build      # outputs dist/
npm run preview    # serve the built game
```

Open in a modern desktop browser. **Controls:** `WASD` / arrows to move ·
`E` / `Space` / `Enter` to interact & advance dialogue · click menu buttons ·
`C` opens the calendar in the hub · `Esc` backs out of submenus. On-screen
touch controls appear automatically on touch devices.

## The full loop (start → finish)

1. **Intro cutscene** — SB and the Maxorp antagonist; the awakening moment.
2. **Tutorial** — walk to the marker, then a scripted fight that teaches
   *weakness → One More → All-Out Attack*.
3. **Hub** — explorable night plaza, a 5-day calendar in Daytime/Evening blocks.
   Spend each block on an activity (raise a social stat) or a confidant hangout.
4. **Dungeon** — the Maxorp Tower "Palace": a linear corridor with 3 encounters.
5. **Mini-boss** — *The Liquidator*, shadow of an exploitative executive.
6. **Confidant scene** — branching, stat-gated dialogue with a rank-up perk
   (reached in the hub, e.g. hanging with Mara at the café).
7. **Cliffhanger** — the change-of-heart card.

> **Tension by design:** infiltrating the Tower also costs a time block, so
> progress and daily life compete for the same five days.

## Project map — where to add content

Everything is **data-driven**. Logic lives in `systems/` + `scenes/`; content
lives in `data/`. Adding an enemy/skill/confidant/day/line is a *data* edit.

```
src/game/
  main.js                # story state machine wiring the scenes together
  core/                  # Engine (render/postfx/loop/SFX), Input, EventBus,
                         #   GameState (save-shaped state), SaveState (localStorage)
  world/                 # AssetManager (GLB↔procedural swap), CharacterFactory,
                         #   Environments (hub / dungeon / arena builders)
  systems/               # Combat, Calendar, Relationships, Dialogue (pure logic)
  scenes/                # Dialogue, Tutorial, Hub, Dungeon, Combat scenes
  ui/UI.js               # comic-panel DOM UI: menus, dialogue, HUD, popups, cards
  data/
    config.js            # ★ BRAND HOOKS ★ — names, colors, factions, voice
    skills.js  enemies.js  party.js  confidants.js
    calendar.js  dialogue.js  dungeon.js  story.js
```

### Make it yours
- **Branding / lore:** edit `src/game/data/config.js` (hero name, awakening
  line, signature colors, faction + antagonist names, writer voice notes).
- **Real 3D models:** set `model.glb` to a `.glb` URL on any character def in
  `party.js` / `enemies.js` / `confidants.js`. `AssetManager.loadCharacter()`
  loads it with an `AnimationMixer` (Mixamo-style clip names auto-mapped) and
  otherwise falls back to the built-in procedural humanoid — a one-line swap,
  no systems changes. (See the "honesty" section of `PLAN.md`.)
- **More content:** add entries to the `data/` files; add a confidant rank by
  adding a `ranks[]` entry + a dialogue tree; add a day to `calendar.js`.

## Combat at a glance
HP + SP · basic attack / skills / guard / item / flee · 4 damage types
(Physical, Tech, Mental, Fire) · one weakness per enemy · **One More** on
weakness/crit · **All-Out Attack** splash when all foes are down · party of two
(SB + Riff) · agility turn order · XP + level-up with learned skills.

## Presentation
High-contrast jagged comic-panel UI with diagonal transitions; signature palette
(deep ink + acid-slime green + hot magenta); UnrealBloom + vignette/color-grade
postprocessing; synthesized menu/hit SFX; screen-shake on crits; "BAM/WEAK/CRIT"
hit pop-ups; the All-Out Attack splash card.

## Tech
Three.js `0.184` (+ `examples/jsm` postprocessing & GLTFLoader), bundled by Vite.
No game framework. Save state persists to `localStorage` (`slimeby.save.v1`).
