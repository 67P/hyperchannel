import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isEmpty, isPresent } from '@ember/utils';
import { bindKeyboardShortcuts, unbindKeyboardShortcuts } from 'ember-keyboard-shortcuts';

export default class ChannelNavComponent extends Component {

  @service router;
  @service coms;
  @service('remotestorage') storage;

  keyboardShortcuts = Object.freeze({
    'ctrl+shift+up': 'goPreviousChannel',
    'ctrl+shift+down': 'goNextChannel'
  })

  transitionToRelativeChannel (relativePosition) {
    if (isPresent(this.coms.activeChannel)) {
      // FIXME Find by MUC/server domain
      // OLD CODE: const channels = this.coms.activeChannel.space.sortedChannels;
      const channels = this.coms.sortedChannels;
      const currentPosition = channels.indexOf(this.coms.activeChannel);

      let edge = channels.length-1;
      let edgeOpposite = 0;

      if (relativePosition === -1) {
        // swap variables
        [edge, edgeOpposite] = [edgeOpposite, edge];
      }

      const newPosition = currentPosition === edge ? edgeOpposite : currentPosition + relativePosition;
      const newChannel = channels[newPosition];

      this.router.transitionTo('channel', newChannel);
    }
  }

  @action
  bindKeyboardShortcuts (element) {
    bindKeyboardShortcuts(this, element);
  }

  @action
  unbindKeyboardShortcuts (element) {
    unbindKeyboardShortcuts(this, element);
  }

  @action
  joinChannel () {
    let channelName = window.prompt('Join channel');
    if (isEmpty(channelName)) return;

    // TODO let user choose account
    // (new, proper join-channel dialog)
    const account = this.coms.activeChannel.account;

    if (account.protocol === 'IRC' && !channelName.match(/^#/)) {
      channelName = `#${channelName}`;
    }

    const channel = this.coms.createChannel(account, channelName, { saveConfig: true });
    this.router.transitionTo('channel', channel);
  }

  @action
  goPreviousChannel () {
    this.transitionToRelativeChannel(-1);
  }

  @action
  goNextChannel () {
    this.transitionToRelativeChannel(1);
  }

}
