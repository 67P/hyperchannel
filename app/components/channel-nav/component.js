import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import {
  bindKeyboardShortcuts,
  unbindKeyboardShortcuts,
} from 'ember-keyboard-shortcuts';

export default class ChannelNavComponent extends Component {
  @service router;
  @service coms;
  @service modals;
  @service('remotestorage') storage;

  keyboardShortcuts = {
    'ctrl+shift+up': 'goPreviousChannel',
    'ctrl+shift+down': 'goNextChannel',
  };

  transitionToRelativeChannel(relativePosition) {
    if (isPresent(this.coms.activeChannel)) {
      const channels = this.coms.channels.filterBy(
        'account',
        this.coms.activeChannel.account
      );
      const currentPosition = channels.indexOf(this.coms.activeChannel);

      let edge = channels.length - 1;
      let edgeOpposite = 0;

      if (relativePosition === -1) {
        // swap variables
        [edge, edgeOpposite] = [edgeOpposite, edge];
      }

      const newPosition =
        currentPosition === edge
          ? edgeOpposite
          : currentPosition + relativePosition;
      const newChannel = channels[newPosition];

      this.router.transitionTo('channel', newChannel);
    }
  }

  @action
  bindKeyboardShortcuts(element) {
    bindKeyboardShortcuts(this, element);
  }

  @action
  unbindKeyboardShortcuts(element) {
    unbindKeyboardShortcuts(this, element);
  }

  @action
  joinChannel() {
    this.modals.open('join-channel');
  }

  @action
  goPreviousChannel() {
    this.transitionToRelativeChannel(-1);
  }

  @action
  goNextChannel() {
    this.transitionToRelativeChannel(1);
  }
}
