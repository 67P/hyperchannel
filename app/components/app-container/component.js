import Ember from 'ember';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

export default Ember.Component.extend(RecognizerMixin, {

  tagName: 'div',
  classNames: ['app-container'],
  classNameBindings: ['showMenu:global-open'],

  showMenu: false,

  recognizers: 'swipeleft swiperight',

  swipeLeft() {
    this.set('showMenu', false);
  },

  swipeRight() {
    this.set('showMenu', true);
  }

});
