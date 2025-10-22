import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isPresent } from '@ember/utils';
import JoinChannel from 'hyperchannel/components/join-channel';

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
  joinChannel () {
    this.modals.open(JoinChannel);
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
