const KEY_ALIASES = {
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  esc: 'escape',
};

/**
 * Checks whether a keyboard event matches a shortcut string, e.g. "ctrl+shift+up"
 * or "tab". Replaces the ember-keyboard-shortcuts (mousetrap) dependency.
 *
 * @param {KeyboardEvent} event
 * @param {string} shortcut
 * @returns {boolean}
 */
export default function shortcutMatches (event, shortcut) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop();
  const modifiers = parts;

  return (
    event.ctrlKey === modifiers.includes('ctrl') &&
    event.altKey === modifiers.includes('alt') &&
    event.shiftKey === modifiers.includes('shift') &&
    event.metaKey === modifiers.includes('meta') &&
    event.key.toLowerCase() === (KEY_ALIASES[key] || key)
  );
}
