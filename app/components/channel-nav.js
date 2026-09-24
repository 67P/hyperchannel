import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isPresent } from '@ember/utils';
import relativeChannel from 'hyperchannel/utils/relative-channel';

export default class ChannelNavComponent extends Component {

  @service router;
  @service coms;
  @service modals;
  @service('remotestorage') storage;

  keyboardShortcuts = Object.freeze({
    'ctrl+shift+up': 'goPreviousChannel',
    'ctrl+shift+down': 'goNextChannel'
  })

  transitionToRelativeChannel (relativePosition) {
    if (isPresent(this.coms.activeChannel)) {
      const channels = this.coms.channels.filter(ch => ch.account === this.coms.activeChannel.account);
      const newChannel = relativeChannel(channels, this.coms.activeChannel, relativePosition);
      this.router.transitionTo('channel', newChannel);
    }
  }

  @action
  joinChannel () {
    this.modals.openJoinChannel();
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
