// =============================================================================
//  Dialogue — branching tree runner. Walks nodes, enforces stat-gated choices,
//  applies choice effects to GameState, and fires node actions (endScene,
//  startCombat, rankUp). UI-agnostic: callers pass render/handler callbacks.
// =============================================================================
import { addStatPoints } from '../core/GameState.js';
import { Relationships } from './Relationships.js';

export class DialogueRunner {
  constructor(tree, state, handlers = {}) {
    this.tree = tree;
    this.state = state;
    this.h = handlers; // { onNode(node), onChoices(node, choices), onAction(action, arg, node), onEnd() }
    this.nodeId = tree.start;
  }

  start() { this._render(); return this; }

  node() { return this.tree.nodes[this.nodeId]; }

  _render() {
    const node = this.node();
    if (!node) { this.h.onEnd?.(); return; }
    if (node.choices) {
      // filter/annotate choices by stat requirement
      const choices = node.choices.map((c) => ({
        ...c,
        locked: c.requires ? this.state.stats[c.requires.stat] < c.requires.min : false,
      }));
      this.h.onNode?.(node);
      this.h.onChoices?.(node, choices);
    } else {
      this.h.onNode?.(node);
    }
  }

  // advance a linear node (no choices). If it has an action, fire it.
  advance() {
    const node = this.node();
    if (!node) return;
    if (node.choices) return; // must choose
    if (node.action) { this.h.onAction?.(node.action, node.actionArg, node); return; }
    if (node.next) { this.nodeId = node.next; this._render(); }
    else { this.h.onEnd?.(); }
  }

  choose(index) {
    const node = this.node();
    if (!node?.choices) return;
    const choice = node.choices[index];
    if (!choice) return;
    if (choice.requires && this.state.stats[choice.requires.stat] < choice.requires.min) return; // locked
    this._applyEffect(choice.effect);
    if (choice.action) { this.h.onAction?.(choice.action, choice.actionArg, node); return; }
    if (choice.next) { this.nodeId = choice.next; this._render(); }
    else { this.h.onEnd?.(); }
  }

  goto(nodeId) { this.nodeId = nodeId; this._render(); }

  _applyEffect(effect) {
    if (!effect) return;
    if (effect.stat && effect.amount) addStatPoints(this.state, effect.stat, effect.amount);
    if (effect.confidant && effect.rankPoints) Relationships.addPoints(this.state, effect.confidant, effect.rankPoints);
    if (effect.flag) this.state.flags[effect.flag] = true;
  }
}
