/* global Hammer */
export default {
  name: 'hammer',

  initialize: function() {
    // Enable text selection.
    // It's disabled by default to improve UX on desktop, so text wouldn't
    // be selected when panning.
    delete Hammer.defaults.cssProps.userSelect;
  }
};
