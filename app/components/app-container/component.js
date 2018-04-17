/* global Hammer */
import Component from '@ember/component';
import $ from 'jquery';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import { computed } from '@ember/object';

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

  // Hammer.js manager options
  // Used by the ember-gestures recognizer Mixin,
  // needed to fix swipe gestures in Chrome.
  managerOptions: computed('', function () {
    return {
      domEvents: true,
      touchAction: 'auto',
      inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput,
    }
  }),

  swipeLeft() {
    this.set('showGlobalMenu', false);
  },

  swipeRight() {
    this.set('showGlobalMenu', true);
  },

  tap(e) {
    if (this.showGlobalMenu &&
        !isElementOf('channel-header', e.target) &&
        !isElementOf('global', e.target)) {
      this.set('showGlobalMenu', false);
    }
  }

});
