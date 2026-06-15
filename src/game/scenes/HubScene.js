// =============================================================================
//  HubScene — the everyday-life pillar. Explorable night plaza. Walk to kiosks
//  to spend a time block on an activity (raise a social stat or advance a
//  confidant). Calendar overlay on [C]. Infiltrating the Tower also costs time.
//  args: { onActivityResult(result), onConfidant(id), onEnterDungeon() }
// =============================================================================
import * as THREE from 'three';
import { SceneBase } from './SceneBase.js';
import { buildHub } from '../world/Environments.js';
import { assets } from '../world/AssetManager.js';
import { getPartyDef } from '../data/party.js';
import { input } from '../core/Input.js';
import { ui } from '../ui/UI.js';
import { bus } from '../core/EventBus.js';
import { Calendar } from '../systems/Calendar.js';
import { getActivity, DAYS, BLOCK_LABEL, BLOCKS } from '../data/calendar.js';
import { getConfidant } from '../data/confidants.js';

export class HubScene extends SceneBase {
  async enter(args) {
    this.args = args;
    this.menuOpen = false;
    this.engine.clearScene();

    const hub = buildHub();
    this.hub = hub;
    this.engine.scene.add(hub.group);

    this.player = await assets.loadCharacter(getPartyDef('sb'));
    this.player.object3d.position.copy(hub.spawn);
    this.engine.scene.add(this.player.object3d);
    this.engine.camera.position.set(0, 9, 13);
    this.engine.camera.lookAt(0, 1, 0);

    ui.showHUD(this.state);
    ui.setObjective('FREE TIME', 'Walk to a glowing kiosk and press E. Press C for the calendar. Each action costs a time block.');

    this.track(bus.on('input:interact', () => this._interact()));
    this.track(this._bindKey('c', () => this._openCalendar()));
    this.nearZone = null;
  }

  _bindKey(key, fn) {
    const h = (e) => { if (!this.menuOpen && e.key.toLowerCase() === key) fn(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }

  _interact() {
    if (this.menuOpen || !this.nearZone) return;
    const zone = this.nearZone;
    const activity = getActivity(zone.activity);
    const can = Calendar.canDo(this.state, activity);
    const desc = activity.desc + (activity.requires ? `\n(Requires ${activity.requires.stat} Rank ${activity.requires.min})` : '');
    this.menuOpen = true;
    ui.menu({
      title: zone.label,
      sub: desc,
      mag: activity.highlight,
      options: [
        { label: can.ok ? (activity.highlight ? 'INFILTRATE' : 'Spend time here') : `Unavailable`, small: can.ok ? null : can.reason, disabled: !can.ok, value: 'do' },
        { label: 'Not now', value: 'cancel' },
      ],
      onCancel: () => { this.menuOpen = false; },
      onSelect: (v) => {
        this.menuOpen = false;
        if (v !== 'do') return;
        this._doActivity(zone.activity);
      },
    });
  }

  _doActivity(activityId) {
    const result = Calendar.applyActivity(this.state, activityId);
    if (result.dungeon) { this.args.onEnterDungeon?.(); return; }
    ui.showHUD(this.state);
    this.game.save();

    if (result.rankUp) {
      // a confidant ranked up — play their scene (perk applied on scene resolve)
      this.args.onConfidant?.(result.rankUp);
      return;
    }
    // otherwise show a quick result toast then check deadline
    const body = result.messages.join('<br>') || 'Time passes...';
    this.menuOpen = true;
    ui.card({ big: result.statUp ? 'STAT UP' : 'TIME SPENT', body, small: this._dateLabel() }, () => {
      this.menuOpen = false;
      if (result.statUp) this.engine.sfx('rankup');
      this._checkDeadline();
    });
  }

  _checkDeadline() {
    if (Calendar.isDeadlinePassed(this.state)) {
      this.menuOpen = true;
      ui.card({
        big: 'FRIDAY', body: 'The layoffs are signed. There\'s no more time to prepare — the Tower\'s distortion stands now or never. Storm it.',
        small: 'TIME\'S UP',
      }, () => { this.menuOpen = false; this.args.onEnterDungeon?.(); }, 'STORM THE TOWER');
    }
  }

  _dateLabel() {
    const c = Calendar.current(this.state);
    return `${c.day.name.toUpperCase()} · ${c.blockLabel}`;
  }

  _openCalendar() {
    if (this.menuOpen) return;
    this.menuOpen = true;
    const cur = Calendar.current(this.state);
    const options = DAYS.map((d) => {
      const isToday = d.index === this.state.day;
      return {
        label: `${d.name}${d.index === DAYS.length ? ' — DEADLINE' : ''}`,
        meta: isToday ? `▶ ${cur.blockLabel}` : (d.index < this.state.day ? 'done' : ''),
        small: d.dateText,
        disabled: false, value: 'x',
      };
    });
    options.push({ label: 'Close', value: 'close' });
    ui.menu({
      title: 'CALENDAR', sub: 'Each activity or infiltration spends one block (Daytime → Evening → next day).',
      options, onCancel: () => { this.menuOpen = false; }, onSelect: () => { this.menuOpen = false; },
    });
  }

  update(dt) {
    this.player.update(dt);
    if (this.menuOpen) return;

    const ax = input.axis;
    const p = this.player.object3d.position;
    const speed = 7, b = this.hub.bounds;
    if (Math.hypot(ax.x, ax.y) > 0.1) {
      p.x = THREE.MathUtils.clamp(p.x + ax.x * speed * dt, -b, b);
      p.z = THREE.MathUtils.clamp(p.z + ax.y * speed * dt, -b, b);
      this.player.face(Math.atan2(ax.x, ax.y));
      this.player.setAnim('walk');
    } else this.player.setAnim('idle');

    // camera follow
    const cam = this.engine.camera;
    const want = new THREE.Vector3(p.x * 0.5, 9, p.z + 12);
    cam.position.lerp(want, 1 - Math.pow(0.0015, dt));
    cam.lookAt(p.x * 0.5, 1, p.z - 1);

    // nearest kiosk
    let near = null, nd = 3.2;
    for (const z of this.hub.zones) {
      const d = Math.hypot(p.x - z.pos[0], p.z - z.pos[2]);
      const marker = this.hub.markers[z.id];
      if (marker) { marker.userData.ring.material.opacity = 0.3; marker.userData.ring.rotation.z += dt * 0.5; }
      if (d < nd) { nd = d; near = z; }
    }
    this.nearZone = near;
    if (near) {
      this.hub.markers[near.id].userData.ring.material.opacity = 0.8;
      ui.showPrompt(`E — ${near.label}`);
    } else ui.hidePrompt();
  }

  exit() { super.exit(); ui.hidePrompt(); ui.clearObjective(); this.player?.dispose?.(); }
}
