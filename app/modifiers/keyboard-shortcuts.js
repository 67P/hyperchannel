import { modifier } from 'ember-modifier';
import shortcutMatches from 'hyperchannel/utils/shortcut-matches';

export default modifier((element, [component]) => {
  const shortcuts = component.keyboardShortcuts;

  if (!shortcuts) {
    return;
  }

  const entries = Object.entries(shortcuts);

  function onKeydown (event) {
    for (const [shortcut, methodName] of entries) {
      if (shortcutMatches(event, shortcut)) {
        event.preventDefault();
        const method = component[methodName];
        if (typeof method === 'function') {
          method.call(component, event);
        }
      }
    }
  }

  document.addEventListener('keydown', onKeydown);

  return () => {
    document.removeEventListener('keydown', onKeydown);
  };
});
