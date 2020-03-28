/* global Hammer */
import Component from '@ember/component';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';
import isDescendantOf from 'hyperchannel/utils/dom/is-descendant-of';

export default class AppContainerComponent extends Component.extend(RecognizerMixin) {

  recognizers = 'swipeleft swiperight tap';

  // Hammer.js manager options
  // Used by the ember-gestures recognizer Mixin,
  // needed to fix swipe gestures in Chrome.
  managerOptions = {
    domEvents: true,
    touchAction: 'auto',
    inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput,
  };

  swipeLeft () {
    if (this.showGlobalMenu) {
      this.showGlobalMenu = false;
    } else {
      this.showChannelMenu = true;
    }
  }

  swipeRight () {
    if (this.showChannelMenu) {
      this.showChannelMenu = false;
    } else {
      this.showGlobalMenu = true;
    }
  }

  tap (e) {
    if (this.showGlobalMenu &&
        !isDescendantOf('channel-header', e.target) &&
        !isDescendantOf('global', e.target)) {
      this.showGlobalMenu = false;
    } else if (this.showChannelMenu &&
        !isDescendantOf('channel-sidebar', e.target)) {
      this.showChannelMenu = false;
    }
  }

}
