import Component from '@ember/component';
import { isEmpty, isPresent } from '@ember/utils';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import {
  bindKeyboardShortcuts,
  unbindKeyboardShortcuts
} from 'ember-keyboard-shortcuts';

export default Component.extend({

  tagName: 'ul',
  router: service(),
  coms: service(),
  storage: service('remotestorage'),

  keyboardShortcuts: Object.freeze({
    'ctrl+shift+up': 'goPreviousChannel',
    'ctrl+shift+down': 'goNextChannel'
  }),

  didInsertElement () {
    this._super(...arguments);
    bindKeyboardShortcuts(this);
  },

  willDestroyElement () {
    this._super(...arguments);
    unbindKeyboardShortcuts(this);
  },

  activeChannel: computed('spaces.@each.activeChannel', function () {
    let activeChannel;

    this.spaces.forEach(function (space) {
      let channel = space.activeChannel;
      if (isPresent(channel)) {
        activeChannel = channel;
      }
    });

    return activeChannel;
  }),

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
  },

  actions: {
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
    },

    leaveChannel (space, channel) {
      this.onLeaveChannel(space, channel);
    },

    goPreviousChannel () {
      this.transitionToRelativeChannel(-1);
    },

    goNextChannel () {
      this.transitionToRelativeChannel(1);
    }
  }

});
