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

  get activeChannel () {
    let activeChannel;

    this.args.spaces.forEach(space => {
      let channel = space.activeChannel;
      if (isPresent(channel)) {
        activeChannel = channel;
      }
    });

    return activeChannel;
  }

  transitionToRelativeChannel (relativePosition) {
    if (isPresent(this.activeChannel)) {
      let channels = this.activeChannel.space.sortedChannels;
      let currentPosition = channels.indexOf(this.activeChannel);

      let edge = channels.length-1;
      let edgeOpposite = 0;

      if (relativePosition === -1) {
        // swap variables
        [edge, edgeOpposite] = [edgeOpposite, edge];
      }

      let newPosition = currentPosition === edge ? edgeOpposite : currentPosition + relativePosition;
      let newChannel = channels[newPosition];

      this.router.transitionTo('space.channel', newChannel.space, newChannel);
    }
  }

  @action
  didInsertNode (element) {
    bindKeyboardShortcuts(this, element);
  }

  @action
  willDestroyNode (element) {
    unbindKeyboardShortcuts(this, element);
  }

  @action
  joinChannel (space) {
    let channelName = window.prompt('Join channel');

    if (isEmpty(channelName)) {
      return;
    }

    if (space.get('protocol') === 'IRC' && !channelName.match(/^#/)) {
      channelName = `#${channelName}`;
    }
    let channel = this.coms.createChannel(space, channelName);
    this.storage.saveSpace(space);
    this.router.transitionTo('space.channel', space, channel);
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
