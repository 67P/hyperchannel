import { modifier } from 'ember-modifier';

export default modifier((element, [_channel, onChannelChange]) => {
  // Call immediately on mount
  onChannelChange();

  return () => {};
}, { eager: false });
