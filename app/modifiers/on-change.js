import { modifier } from 'ember-modifier';
import { untrack } from '@glimmer/validator';

/**
 * Runs `callback` immediately and again whenever `value` changes.
 *
 * This is the `did-update` semantics that `ember-render-modifiers` used to
 * provide. Unlike a plain `on-render` (install-only) modifier, it autotracks
 * `value`, so it is safe to use for reacting to changed arguments such as the
 * current channel or rendered messages.
 *
 * The callback is run inside `untrack`: ember-modifier autotracks every tracked
 * value the modifier function accesses, including values read inside the
 * callback. Callbacks often read other tracked state (e.g. `channelChanged`
 * reads `channel.sortedMessages`), which must not become a dependency of this
 * modifier, otherwise it re-runs on unrelated changes.
 */
export default modifier((element, [value, callback]) => {
  untrack(() => callback(value));

  return () => {};
}, { eager: false });
