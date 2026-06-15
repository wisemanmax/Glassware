// Keyboard + on-screen touch input. Exposes a polled axis + edge-triggered keys.
import { bus } from './EventBus.js';

class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // edge this frame
    this.touchAxis = { x: 0, y: 0 };
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!this.keys.has(k)) this.pressed.add(k);
      this.keys.add(k);
      if (k === 'e' || k === ' ' || k === 'enter') bus.emit('input:interact');
      if (k === 'escape') bus.emit('input:cancel');
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  // movement vector (-1..1), combining keys + touch
  get axis() {
    let x = 0, y = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    x += this.touchAxis.x; y += this.touchAxis.y;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  wasPressed(k) { return this.pressed.has(k); }
  endFrame() { this.pressed.clear(); }

  // wire on-screen touch controls (built by UI)
  bindTouch() {
    const el = document.getElementById('touch');
    if (!el) return;
    if (matchMedia('(pointer: coarse)').matches) el.classList.add('enabled');
    el.innerHTML = `
      <div class="touch-pad">
        <div class="touch-btn" data-dir="up"    style="top:0;left:50px">▲</div>
        <div class="touch-btn" data-dir="left"  style="top:50px;left:0">◀</div>
        <div class="touch-btn" data-dir="right" style="top:50px;left:100px">▶</div>
        <div class="touch-btn" data-dir="down"  style="top:100px;left:50px">▼</div>
      </div>
      <div class="touch-a" data-act="interact">OK</div>`;
    const set = (dir, on) => {
      const v = on ? 1 : 0;
      if (dir === 'left') this.touchAxis.x = on ? -1 : 0;
      if (dir === 'right') this.touchAxis.x = on ? 1 : 0;
      if (dir === 'up') this.touchAxis.y = on ? -1 : 0;
      if (dir === 'down') this.touchAxis.y = on ? 1 : 0;
    };
    el.querySelectorAll('[data-dir]').forEach((b) => {
      const dir = b.dataset.dir;
      const down = (e) => { e.preventDefault(); set(dir, true); };
      const up = (e) => { e.preventDefault(); set(dir, false); };
      b.addEventListener('touchstart', down); b.addEventListener('touchend', up);
      b.addEventListener('mousedown', down); b.addEventListener('mouseup', up);
      b.addEventListener('mouseleave', up);
    });
    const a = el.querySelector('[data-act="interact"]');
    a.addEventListener('touchstart', (e) => { e.preventDefault(); bus.emit('input:interact'); });
    a.addEventListener('mousedown', (e) => { e.preventDefault(); bus.emit('input:interact'); });
  }
}

export const input = new Input();
