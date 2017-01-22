import Ember from 'ember';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

export default Ember.Component.extend(RecognizerMixin, {

  tagName: 'div',
  classNames: ['app-container'],
  classNameBindings: ['showGlobalMenu:global-menu-open', 'showChannelMenu:channel-menu-open'],

  recognizers: 'swipeleft swiperight',

  swipeLeft() {
    this.set('showGlobalMenu', false);
  },

  swipeRight() {
    this.set('showGlobalMenu', true);
  }

});
