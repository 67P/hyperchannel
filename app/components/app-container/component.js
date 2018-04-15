import Component from '@ember/component';
import $ from 'jquery';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

function isElementOf(id, element) {
  return element.id === id ||
         $(element).parents(`#${id}`).length > 0;
}

export default Component.extend(RecognizerMixin, {

  tagName: 'div',
  classNames: ['app-container'],
  classNameBindings: ['showGlobalMenu:global-menu-open',
                      'showChannelMenu:channel-menu-open'],

  recognizers: 'swipeleft swiperight tap',

  swipeLeft() {
    this.set('showGlobalMenu', false);
  },

  swipeRight() {
    this.set('showGlobalMenu', true);
  },

  tap(e) {
    if (this.get('showGlobalMenu') &&
        !isElementOf('channel-header', e.target) &&
        !isElementOf('global', e.target)) {
      this.set('showGlobalMenu', false);
    }
  }

});
