/* global Hammer */
import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import isDescendantOf from 'hyperchannel/utils/dom/is-descendant-of';

export default class ApplicationController extends Controller {
  @service coms;
  @service router;
  @service modals;

  @tracked showGlobalMenu = false;
  @tracked showChannelMenu = false;

  hammerInputClass = Hammer.SUPPORT_POINTER_EVENTS
    ? Hammer.PointerEventInput
    : Hammer.TouchInput;

  get showChatInterface() {
    return this.router.currentRoute.name.includes('channel');
  }

  @action
  swipeLeft() {
    if (this.showGlobalMenu) {
      this.showGlobalMenu = false;
    } else {
      this.showChannelMenu = true;
    }
  }

  @action
  swipeRight() {
    if (this.showChannelMenu) {
      this.showChannelMenu = false;
    } else {
      this.showGlobalMenu = true;
    }
  }

  @action
  tap(e) {
    if (
      this.showGlobalMenu &&
      !isDescendantOf('channel-header', e.target) &&
      !isDescendantOf('global', e.target)
    ) {
      this.showGlobalMenu = false;
    } else if (
      this.showChannelMenu &&
      !isDescendantOf('channel-nav', e.target) &&
      !isDescendantOf('channel-sidebar', e.target)
    ) {
      this.showChannelMenu = false;
    }
  }

  @action
  openSettingsModal() {
    this.modals.open('settings-container');
  }

  @action
  leaveChannel(channel) {
    this.coms.removeChannel(channel);

    // Switch to last channel if the channel parted was currently open
    if (channel.visible) {
      let lastChannel = this.coms.sortedChannels.lastObject;
      this.router.transitionTo('channel', lastChannel);
    }
  }
}
