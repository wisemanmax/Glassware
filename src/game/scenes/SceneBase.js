// Scene lifecycle contract. Scenes get the Game (engine, state, ui) on enter.
export class SceneBase {
  constructor(game) { this.game = game; this.engine = game.engine; this.state = game.state; this._disposables = []; }
  // override
  async enter(args) {}
  update(dt) {}
  exit() { this._disposables.forEach((d) => d?.()); this._disposables = []; }
  track(unsub) { this._disposables.push(unsub); }
}
