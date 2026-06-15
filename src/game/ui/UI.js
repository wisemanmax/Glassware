// =============================================================================
//  UI — DOM layer. Comic-panel menus, dialogue, combat HUD, floating popups,
//  All-Out splash, story cards, transitions. Projects 3D world positions to the
//  screen for popups via the engine camera.
// =============================================================================
import * as THREE from 'three';
import { input } from '../core/Input.js';
import { bus } from '../core/EventBus.js';
import { STATS } from '../core/GameState.js';

const $ui = () => document.getElementById('ui');
const $fx = () => document.getElementById('fx');

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

class UIManager {
  init(engine) { this.engine = engine; this._v = new THREE.Vector3(); }

  // ---- generic helpers ----
  clearUI() { $ui().innerHTML = ''; }
  clearFX() { $fx().innerHTML = ''; }

  worldToScreen(pos) {
    this._v.copy(pos).project(this.engine.camera);
    return { x: (this._v.x * 0.5 + 0.5) * innerWidth, y: (-this._v.y * 0.5 + 0.5) * innerHeight };
  }

  // ---------------------------------------------------------------- HUD ----
  showHUD(state) {
    let hud = document.getElementById('hud');
    if (!hud) { hud = el('div'); hud.id = 'hud'; $ui().appendChild(hud); }
    const dayNames = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
    const block = ['DAYTIME', 'EVENING'][state.block] || '';
    const pips = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
    hud.innerHTML = `
      <div class="hud-date">${dayNames[state.day] || 'DAY ' + state.day}<small>${block}</small></div>
      <div class="hud-stats">
        ${STATS.map((s) => `<div class="stat-chip">${s.slice(0, 3).toUpperCase()}<b>${state.stats[s]}</b><span class="pips">${pips(state.stats[s])}</span></div>`).join('')}
      </div>`;
  }
  hideHUD() { document.getElementById('hud')?.remove(); }

  setObjective(title, text) {
    let o = document.getElementById('objective');
    if (!o) { o = el('div'); o.id = 'objective'; $ui().appendChild(o); }
    o.innerHTML = `<b>${title}</b>${text}`;
  }
  clearObjective() { document.getElementById('objective')?.remove(); }

  showPrompt(text) {
    let p = document.getElementById('prompt');
    if (!p) { p = el('div'); p.id = 'prompt'; $ui().appendChild(p); }
    p.textContent = text;
  }
  hidePrompt() { document.getElementById('prompt')?.remove(); }

  // ------------------------------------------------------------- MENU ------
  // options: [{ label, meta, small, disabled, value }]. onSelect(value, index).
  // Returns a close() fn. Keyboard + mouse navigable. Modal (locks movement).
  menu({ title, options, mag = false, onSelect, onCancel = null, sub = null }) {
    const overlay = el('div', 'overlay');
    const menu = el('div', 'menu');
    menu.appendChild(el('div', `menu-head${mag ? ' mag' : ''}`, title));
    const body = el('div', 'menu-body');
    if (sub) body.appendChild(el('div', '', `<div style="font-size:12px;opacity:.7;margin-bottom:10px">${sub}</div>`));
    const list = el('div', 'btn-list');
    let sel = options.findIndex((o) => !o.disabled); if (sel < 0) sel = 0;
    const btns = options.map((o, i) => {
      const b = el('button', `btn${o.disabled ? ' disabled' : ''}`);
      b.innerHTML = `${o.meta ? `<span class="meta">${o.meta}</span>` : ''}${o.label}${o.small ? `<small>${o.small}</small>` : ''}`;
      b.addEventListener('mouseenter', () => { if (!o.disabled) setSel(i); });
      b.addEventListener('click', () => { if (!o.disabled) confirm(i); });
      list.appendChild(b);
      return b;
    });
    body.appendChild(list); menu.appendChild(body); overlay.appendChild(menu); $ui().appendChild(overlay);

    const setSel = (i) => { sel = i; btns.forEach((b, j) => b.classList.toggle('sel', j === i)); };
    setSel(sel);
    const move = (d) => {
      let i = sel;
      do { i = (i + d + options.length) % options.length; } while (options[i].disabled && i !== sel);
      setSel(i); this.engine?.sfx('move');
    };
    const confirm = (i) => { if (options[i].disabled) return; this.engine?.sfx('confirm'); close(); onSelect?.(options[i].value ?? i, i); };
    const key = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) { e.preventDefault(); move(-1); }
      else if (['arrowdown', 's'].includes(k)) { e.preventDefault(); move(1); }
      else if (['enter', ' ', 'e'].includes(k)) { e.preventDefault(); confirm(sel); }
      else if (k === 'escape' && onCancel) { e.preventDefault(); this.engine?.sfx('cancel'); close(); onCancel(); }
    };
    const wasEnabled = input.enabled; input.enabled = false;
    window.addEventListener('keydown', key);
    const close = () => { window.removeEventListener('keydown', key); overlay.remove(); input.enabled = wasEnabled; };
    return close;
  }

  // ---------------------------------------------------------- DIALOGUE -----
  // Shows the box; clicking / interacting advances. node: {speaker, side, text}.
  // Returns { setNode(node), showChoices(choices, onChoose), close() }.
  dialogue(onAdvance) {
    let wrap = document.getElementById('dialogue');
    if (!wrap) { wrap = el('div'); wrap.id = 'dialogue'; $ui().appendChild(wrap); }
    wrap.innerHTML = `
      <div class="dlg-box">
        <div class="dlg-speaker"></div>
        <div class="dlg-text"></div>
        <div class="dlg-next">▼</div>
      </div>`;
    const box = wrap.querySelector('.dlg-box');
    const speaker = wrap.querySelector('.dlg-speaker');
    const textEl = wrap.querySelector('.dlg-text');
    const nextEl = wrap.querySelector('.dlg-next');
    let typing = null, fullText = '', choicesOpen = false;

    const type = (txt) => {
      fullText = txt; textEl.textContent = ''; nextEl.style.display = 'none';
      let i = 0; clearInterval(typing);
      typing = setInterval(() => {
        textEl.textContent = txt.slice(0, ++i);
        if (i >= txt.length) { clearInterval(typing); typing = null; nextEl.style.display = choicesOpen ? 'none' : 'block'; }
      }, 16);
    };
    const finishTyping = () => { if (typing) { clearInterval(typing); typing = null; textEl.textContent = fullText; nextEl.style.display = choicesOpen ? 'none' : 'block'; return true; } return false; };

    const setNode = (node) => {
      choicesOpen = false;
      const existing = wrap.querySelector('.dlg-choices'); existing?.remove();
      speaker.textContent = node.speaker || '';
      speaker.className = 'dlg-speaker' + (node.side === 'left' ? ' slime' : '');
      box.style.display = 'block';
      type(node.text || '');
    };

    const showChoices = (choices, onChoose) => {
      choicesOpen = true; nextEl.style.display = 'none';
      const old = wrap.querySelector('.dlg-choices'); old?.remove();
      const cwrap = el('div', 'dlg-choices');
      choices.forEach((c, i) => {
        const b = el('button', `btn${c.locked ? ' disabled' : ''}`);
        b.innerHTML = c.locked ? `🔒 ${c.text}` : c.text;
        b.addEventListener('click', () => { if (!c.locked) { this.engine?.sfx('confirm'); onChoose(i); } });
        cwrap.appendChild(b);
      });
      wrap.appendChild(cwrap);
    };

    const click = () => { if (choicesOpen) return; if (!finishTyping()) { this.engine?.sfx('select'); onAdvance?.(); } };
    box.addEventListener('click', click);
    const onInteract = () => { if (document.getElementById('dialogue')) click(); };
    const busUnsub = bus.on('input:interact', onInteract);

    const close = () => { clearInterval(typing); busUnsub(); wrap.remove(); };
    return { setNode, showChoices, close, finishTyping };
  }

  // ----------------------------------------------------- COMBAT HUD --------
  combatHUD(actors) {
    let hud = document.getElementById('combat-hud');
    if (!hud) { hud = el('div'); hud.id = 'combat-hud'; $ui().appendChild(hud); }
    hud.innerHTML = '';
    this._cards = {};
    for (const a of actors) {
      const card = el('div', 'actor-card');
      card.innerHTML = `
        <div class="name">${a.name}<span class="lvl">Lv ${a.level}</span></div>
        <div class="bar hp"><i></i><span class="lab">HP ${a.hp}/${a.maxHp}</span></div>
        <div class="bar sp"><i></i><span class="lab">SP ${a.sp}/${a.maxSp}</span></div>`;
      hud.appendChild(card);
      this._cards[a.uid] = card;
      this._updateCard(a);
    }
  }
  _updateCard(a) {
    const card = this._cards?.[a.uid]; if (!card) return;
    const hp = card.querySelector('.bar.hp > i'); const sp = card.querySelector('.bar.sp > i');
    hp.style.transform = `scaleX(${Math.max(0, a.hp / a.maxHp)})`;
    sp.style.transform = `scaleX(${Math.max(0, a.sp / a.maxSp)})`;
    card.querySelector('.bar.hp .lab').textContent = `HP ${a.hp}/${a.maxHp}`;
    card.querySelector('.bar.sp .lab').textContent = `SP ${a.sp}/${a.maxSp}`;
    card.style.opacity = a.alive ? 1 : 0.4;
  }
  refreshCombatHUD(actors) { for (const a of actors) this._updateCard(a); }
  setActiveCard(uid) { Object.entries(this._cards || {}).forEach(([u, c]) => c.classList.toggle('active', u === uid)); }
  clearCombatHUD() { document.getElementById('combat-hud')?.remove(); this._cards = null; }

  // ----------------------------------------------------- POPUPS / FX -------
  popup(worldPos, text, cls = 'dmg') {
    const { x, y } = this.worldToScreen(worldPos);
    const p = el('div', `popup ${cls}`, text);
    p.style.left = x + 'px'; p.style.top = y + 'px';
    $fx().appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
  burst(worldPos, word) {
    const { x, y } = this.worldToScreen(worldPos);
    const b = el('div', 'burst', word);
    b.style.left = x + 'px'; b.style.top = y + 'px';
    $fx().appendChild(b);
    setTimeout(() => b.remove(), 520);
  }
  flash(color = '#ffffff', dur = 180) {
    const f = el('div'); f.className = 'screenflash';
    f.style.background = color; f.style.animationDuration = dur + 'ms';
    $fx().appendChild(f);
    setTimeout(() => f.remove(), dur);
  }
  banner(text, dur = 1400) {
    const b = el('div', 'banner', text); $fx().appendChild(b);
    setTimeout(() => b.remove(), dur);
    return b;
  }
  allOut(onDone) {
    const ao = el('div'); ao.id = 'allout';
    ao.innerHTML = `<div class="ao-word">ALL-OUT<br>ATTACK!</div><div class="ao-sub">THE OVERFLOW</div>`;
    $fx().appendChild(ao);
    this.engine?.sfx('allout'); this.engine?.doShake(0.8);
    setTimeout(() => { ao.remove(); onDone?.(); }, 1100);
  }

  // ----------------------------------------------------- STORY CARD --------
  card({ big, body, small }, onContinue, btnLabel = 'CONTINUE') {
    const screen = el('div', 'card-screen');
    screen.innerHTML = `
      <div class="big">${big}</div>
      <div class="body">${body}</div>
      <div class="small">${small || ''}</div>`;
    const btn = el('button'); btn.textContent = btnLabel;
    btn.style.cssText = 'pointer-events:auto;margin-top:10px;font-family:Archivo Black;font-size:18px;color:#0a0a0f;background:#9dff3c;border:none;padding:12px 40px;cursor:pointer;transform:skewX(-8deg);box-shadow:0 8px 0 rgba(0,0,0,.55)';
    btn.addEventListener('click', () => { this.engine?.sfx('confirm'); screen.remove(); onContinue?.(); });
    screen.appendChild(btn);
    $fx().appendChild(screen);
    return screen;
  }

  // ----------------------------------------------------- TRANSITION --------
  wipe(midCb) {
    return new Promise((resolve) => {
      let w = document.getElementById('wipe');
      if (!w) { w = el('div'); w.id = 'wipe'; document.getElementById('game-root').appendChild(w); }
      w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
      setTimeout(() => { midCb?.(); }, 300);
      setTimeout(() => resolve(), 600);
    });
  }
}

export const ui = new UIManager();
