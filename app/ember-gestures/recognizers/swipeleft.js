/* global Hammer */
export default {
  include: [],
  exclude: [],
  options: { threshold: 25, direction: Hammer.DIRECTION_LEFT },
  eventName: 'swipeleft',
  recognizer: 'swipe'
};
