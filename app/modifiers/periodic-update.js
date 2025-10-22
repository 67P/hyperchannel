import { modifier } from 'ember-modifier';
import config from 'hyperchannel/config/environment';

export default modifier((element, _, { onUpdate, updateInterval = 120000 }) => {
  // Call onUpdate immediately
  onUpdate();

  // Don't schedule updates during testing, because it makes the tests time out
  if (config.environment === 'test') return;

  const intervalId = setInterval(() => {
    onUpdate();
  }, updateInterval);

  return () => {
    clearInterval(intervalId);
  };
});
