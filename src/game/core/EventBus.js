// Tiny pub/sub used to decouple systems, scenes and UI.
class EventBus {
  constructor() { this.map = new Map(); }
  on(evt, fn) {
    if (!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn) {
    const off = this.on(evt, (...a) => { off(); fn(...a); });
    return off;
  }
  off(evt, fn) { this.map.get(evt)?.delete(fn); }
  emit(evt, ...args) { this.map.get(evt)?.forEach((fn) => fn(...args)); }
}

export const bus = new EventBus();
