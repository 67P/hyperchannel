import { modifier } from 'ember-modifier';
import { bindKeyboardShortcuts, unbindKeyboardShortcuts } from 'ember-keyboard-shortcuts';

export default modifier((element, [component]) => {
  bindKeyboardShortcuts(component, element);

  return () => {
    unbindKeyboardShortcuts(component, element);
  };
});
