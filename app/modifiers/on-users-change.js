import { modifier } from 'ember-modifier';

export default modifier((element, [users, onUsersChange]) => {
  // Call immediately on mount
  onUsersChange(element);

  // No cleanup needed, but we return a cleanup function anyway
  return () => {};
}, { eager: false });
