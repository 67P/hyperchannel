import Component from '@ember/component';
import { isPresent } from '@ember/utils';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { bindKeyboardShortcuts, unbindKeyboardShortcuts } from 'ember-keyboard-shortcuts';

export default Component.extend({

  tagName: 'ul',
  router: service(),

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
      let channels = this.activeChannel.space.channels;
      let currentPosition = channels.indexOf(this.activeChannel);

      let edge = channels.length-1;
      let edgeOpposite = 0;

      if (relativePosition === -1) {
        // swap variables
        [edge, edgeOpposite] = [edgeOpposite, edge];
      }

      let newPosition = currentPosition === edge ? edgeOpposite : currentPosition + relativePosition;
      let newChannel = this.activeChannel.space.channels[newPosition];
      this.router.transitionTo('space.channel', newChannel.space, newChannel);
    }
  },

  actions: {
    goPreviousChannel () {
      this.transitionToRelativeChannel(-1);
    },

    goNextChannel () {
      this.transitionToRelativeChannel(1);
    }
  }

});
