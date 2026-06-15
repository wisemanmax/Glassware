# Slime By — Vertical Slice Plan

A turn-based JRPG inspired by Persona 5's two-pillar structure (stylized dungeon
combat + social-sim daily life), built with **Three.js / WebGL**, plain ES
modules, served by Vite. Protagonist: **Slime By (SB)**. Theme: dismantling
corporate exploitation — grounded, satirical, socially pointed.

This document is the contract for the slice: what ships, what's stubbed, and the
data schemas. **Read the "Scope cuts & honesty" section — it flags where the
brief exceeds realistic POC scope and proposes the leaner cut I actually built.**

---

## 1. File / module structure

```
index.html                      # game shell: canvas + DOM UI root + import of main.js
src/game/
  main.js                       # bootstrap: engine + state machine + scene wiring
  style.css                     # P5-flavored comic-panel UI (high contrast, diagonal)
  core/
    Engine.js                   # renderer, camera, lights, postprocessing, RAF loop, shake
    Input.js                    # keyboard + on-screen touch d-pad / buttons
    EventBus.js                 # tiny pub/sub used across systems
    SaveState.js                # localStorage save/load of the whole game state
    GameState.js                # the single source-of-truth state object + helpers
  world/
    AssetManager.js             # GLTF loader + procedural fallback behind ONE interface
    CharacterFactory.js         # procedural low-poly rigged humanoid (placeholder rig)
    Environments.js             # low-poly hub + dungeon geometry builders
  systems/
    Combat.js                   # turn-based engine: turn order, One More, All-Out, AI
    Calendar.js                 # days + time blocks, spend-a-block, tension model
    Relationships.js            # social stats + confidant ranks + perks
    Dialogue.js                 # branching dialogue runner (data-driven trees)
  scenes/
    SceneBase.js                # lifecycle: enter()/exit()/update(dt) contract
    IntroScene.js               # opening cutscene (SB + corporate antagonist)
    TutorialScene.js            # teaches movement, then a scripted combat
    HubScene.js                 # explorable 3D everyday-life hub + calendar + activity
    DungeonScene.js             # corporate HQ "palace": linear level + 2-3 encounters
    CombatScene.js              # combat arena + CombatUI overlay (entered from above)
    DialogueScene.js            # full-screen confidant scene wrapper
    EndingScene.js              # cliffhanger card
  ui/
    UI.js                       # DOM helpers: panels, menus, popups, transitions, cards
  data/                         # ALL content is data-driven (no logic in these)
    config.js                   # *** SB BRAND HOOKS *** colors, names, voice, factions
    skills.js                   # skill defs (type, cost, power, target)
    enemies.js                  # enemy defs (stats, weakness, AI, skills, xp)
    party.js                    # SB + ally defs, level curve, learnsets
    confidants.js               # confidant defs + per-rank scene + mechanical perk
    calendar.js                 # day schedule, time blocks, activities, events
    dialogue.js                 # dialogue trees (intro, tutorial, confidant, ending)
    dungeon.js                  # dungeon layout, encounter placement, mini-boss
    story.js                    # cutscene/card scripts
README.md                       # run instructions + "where to add content" map
```

Design rule enforced throughout: **logic in `systems/` & `scenes/`, content in
`data/`.** Adding an enemy, skill, confidant, day, or dialogue line is a data
edit, never a code edit.

---

## 2. Data schemas

### Combat
```js
// skills.js
Skill = { id, name, type:'phys'|'tech'|'mental'|'fire', cost,           // SP (phys uses HP%)
          power, target:'one'|'all'|'self', kind:'attack'|'buff'|'heal', desc }

// enemies.js
Enemy = { id, name, maxHp, atk, def, weakness:type, xp,
          skills:[skillId], ai:'aggressive'|'tactical', model }

// party.js
Actor = { id, name, model, maxHp, maxSp, atk, def, agi,                 // agi -> turn order
          weakness:type|null, learnset:[{level, skillId}], skills:[id] }
// runtime combat actor extends Actor with: hp, sp, down, guard, level, xp, alive
```

### Calendar / time
```js
// calendar.js
Day   = { index, label, blocks:['day','evening'], events:[eventId] }
Block run-time: { dayIndex, block, spent:false }
Activity = { id, label, location, blocks:['day'|'evening'], desc,
             effect:{ stat?, amount?, confidant?, rankPoints?, flag? },
             requires?:{ stat, min } }                                  // gating
```

### Relationships / social
```js
SocialStats = { resolve, charm, knowledge, guts }   // 0..5 ranks, points accrue
// confidants.js
Confidant = { id, name, title, color, maxRank, model,
              ranks:[{ rank, sceneId, perk:{ type:'skill'|'discount'|'buff', value, desc } }] }
// runtime: { rank, points }
```

### Dialogue (branching)
```js
// dialogue.js  — a tree is a map of nodes
Node = { id, speaker, portrait, text,
         choices?:[{ text, next, requires?:{stat,min}, effect?:{...} }],
         next?:nodeId,                       // linear advance
         action?:'startCombat'|'endScene'|'rankUp'|... , actionArg? }
```

### Save state
Single serializable object: `{ day, block, stats, confidants, party(level/xp/hp),
flags, location, storyProgress }` → JSON in `localStorage`.

---

## 3. Asset list

| Asset | Slice approach | Swap path |
|---|---|---|
| SB + ally + 3 confidants + enemies + boss | **Procedural low-poly rigged humanoids** (`CharacterFactory`) — distinct silhouettes/palettes per character | Drop a `.glb` path into the character def; `AssetManager.loadCharacter()` prefers GLB, falls back to procedural. One-line swap. |
| Idle / walk / attack / hit / down "anims" | Procedural bone wobble + tween poses on the placeholder rig; AnimationMixer used automatically when a real GLB+clips is provided | Mixamo-compatible: GLTF clips auto-played by name. |
| Hub + dungeon environments | Low-poly built in code (`Environments.js`) | — |
| Audio (menu blips, crit, hit, BGM) | WebAudio-synthesized SFX (no binary assets needed); BGM optional drone | Replace synth calls with `Audio()` files. |
| UI / comic FX (BAM popups, all-out splash, vignette, bloom) | DOM + CSS + Three postprocessing (UnrealBloom, vignette) | — |
| Fonts | Google Fonts (already loaded) + system | — |

No binary art is required to run the slice — it is self-contained and offline-safe
after `npm install`.

---

## 4. Vertical loop (what's playable start→finish)

1. **Intro cutscene** — SB + the conglomerate antagonist (Maxorp / CEO "Mr. Hugh
   Mungus" placeholder), establishes the distortion + awakening hook.
2. **Tutorial** — walk SB to a marker (teaches movement/camera), then a scripted
   1-enemy fight teaching attack / weakness / One More / All-Out.
3. **Hub** — small explorable 3D plaza, one in-game day, calendar UI, choose ONE
   activity per time block (raises a social stat OR advances a confidant). A
   "Head to the HQ" trigger consumes a block → real time tension.
4. **Dungeon** — Maxorp HQ "palace": short linear corridor, **2–3 encounters**.
5. **Mini-boss** — "The Liquidator," shadow of an exploitative executive.
6. **Confidant scene** — branching dialogue, stat-gated options, rank-up + perk.
7. **Cliffhanger card** — ending splash teasing the next target.

The loop is connected by `GameState` + the state machine in `main.js`.

---

## 5. Combat feature checklist (from brief)
- [x] HP + SP, basic attack, 3–4 skills, guard, item, flee
- [x] 4 damage types: Physical / Tech / Mental / Fire
- [x] One weakness per enemy; weakness hit ⇒ **One More** (extra action)
- [x] All enemies downed ⇒ **All-Out Attack** with stylized splash card
- [x] Party of 2 (SB + ally), turn order by agility, basic enemy AI, win/lose
- [x] XP + level-up, skills learned on level-up (no persona collection)

## 6. Social-sim checklist
- [x] Calendar, 5 days, Daytime/Evening blocks
- [x] 4 social stats (Resolve, Charm, Knowledge, Guts)
- [x] Activities raise stats; some dialogue options gated by stat rank
- [x] 3 confidants with rank-up scene + mechanical perk per rank
- [x] Time-as-resource: one activity per block; dungeon spends time too

---

## 7. P5-flavored presentation
- High-contrast jagged comic-panel UI, diagonal menu slide transitions (CSS).
- **SB signature palette (proposed):** deep ink `#0a0a0f` base, **acid-slime
  green `#9dff3c`** primary accent, **hot magenta `#ff2d8b`** secondary — dark
  with bright accents, slime-coded, distinct from P5 red.
- Menu SFX (synth), screen-shake on crits, comic "BAM!" hit pop-ups, All-Out
  Attack splash card. Velvet-room analog: **cut** (see below).

---

## 8. Scope cuts & honesty (where the brief exceeds POC reality)

**Biggest risk the brief itself names — rigged 3D humanoids from scratch.**
Hand-authoring production-quality rigged, skinned, animated humans in Three.js in
one session is not realistic and would eat the entire budget while starving the
*systems* (which are the actual proof of concept). **Cut taken:** procedural
low-poly humanoids with a simple animated joint hierarchy, built behind an
`AssetManager` interface whose `loadCharacter(def)` returns a GLB (with
AnimationMixer + Mixamo clips) the moment a `.glb` path exists on the def — so
real models are a one-line, per-character drop-in with zero systems rework.
This is exactly the fallback the brief authorizes, made explicit.

Other deliberate cuts (systems built extensible, content kept slice-sized):
- **Velvet Room analog: cut.** Pure flavor, high cost, no mechanical payoff in a
  slice. The menu/save layer leaves room to add it later.
- **Item system: minimal.** One healing item type wired through the full combat
  item flow, rather than an inventory/economy.
- **Enemy AI: basic** (aggressive vs. tactical heuristics), not utility/planner AI.
- **Animations:** keyframed/procedural poses, not blended locomotion state machines.
- **Calendar:** 5 days of real choices, not weeks; events are slice-sized.
- **Confidant ranks:** each confidant reaches a low rank cap with one scripted
  rank-up scene, demonstrating the loop rather than 10 ranks of content.
- **Audio:** synthesized, no licensed music/SFX.
- **No mobile-perfect UX**, but on-screen controls are included as a plus.

Everything cut is a *content/volume* cut, not a *systems* cut: the engines for
combat, calendar, relationships, and dialogue are general and data-driven.

---

## 9. Build milestones (commit points)
1. Plan + scaffold + engine boot (black screen → lit scene + loop).  ← this commit area
2. Asset/character factory + environments + hub exploration.
3. Combat engine + combat scene + One More + All-Out + level-up.
4. Calendar + relationships + dialogue systems.
5. Scene wiring: intro → tutorial → hub → dungeon → boss → confidant → ending.
6. Presentation polish (postprocessing, comic FX, SFX) + README + brand hooks.
