/* global Hammer */
import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import isDescendantOf from 'hyperchannel/utils/dom/is-descendant-of';

export default class ApplicationController extends Controller {

  @service coms;
  @alias('coms.spaces') spaces;

  @tracked showGlobalMenu = false;
  @tracked showChannelMenu = false;

  hammerInputClass = Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput;

  @action
  swipeLeft () {
    if (this.showGlobalMenu) {
      this.showGlobalMenu = false;
    } else {
      this.showChannelMenu = true;
    }
  }

  @action
  swipeRight () {
    if (this.showChannelMenu) {
      this.showChannelMenu = false;
    } else {
      this.showGlobalMenu = true;
    }
  }

  @action
  tap (e) {
    if (this.showGlobalMenu &&
        !isDescendantOf('channel-header', e.target) &&
        !isDescendantOf('global', e.target)) {
      this.showGlobalMenu = false;
    } else if (this.showChannelMenu &&
        !isDescendantOf('channel-nav', e.target) &&
        !isDescendantOf('channel-sidebar', e.target)) {
      this.showChannelMenu = false;
    }
  }

}
