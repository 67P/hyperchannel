import { modifier } from 'ember-modifier';

export default modifier((element, [onChannelChange]) => {
  // Call immediately on mount
  onChannelChange();

  return () => {};
}, { eager: false });
