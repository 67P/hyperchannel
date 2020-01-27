/* global Hammer */
import Component from '@ember/component';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import { computed } from '@ember/object';
import isDescendantOf from 'hyperchannel/utils/dom/is-descendant-of';

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
    if (this.showGlobalMenu) {
      this.set('showGlobalMenu', false);
    } else {
      this.set('showChannelMenu', true);
    }
  },

  swipeRight() {
    if (this.showChannelMenu) {
      this.set('showChannelMenu', false);
    } else {
      this.set('showGlobalMenu', true);
    }
  },

  tap(e) {
    if (this.showGlobalMenu &&
        !isDescendantOf('channel-header', e.target) &&
        !isDescendantOf('global', e.target)) {
      this.set('showGlobalMenu', false);
    }
  }

});
