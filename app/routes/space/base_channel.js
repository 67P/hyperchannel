import $ from 'jquery';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { scheduleOnce, later } from '@ember/runloop';
import { storageFor as localStorageFor } from 'ember-local-storage';

function focusMessageInput() {
  if (window.innerWidth > 900) {
    $('input#message-field').focus();
  } else {
    // Don't auto-focus on small screens
  }
}

export default Route.extend({
  coms: service(),
  userSettings: localStorageFor('user-settings'),

  model(params) {
    let space = this.modelFor('space');
    let channel = space.get('channels').findBy('slug', params.slug);

    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }

    return channel;
  },

  setupController(controller, model) {
    this._super(controller, model);

    scheduleOnce('afterRender', function() {
      focusMessageInput();
    });
  },

  actions: {

    didTransition() {
      let space = this.modelFor('space');
      let channel = this.controller.get('model');

      this.set('userSettings.currentSpace', space.get('id'));
      this.set('userSettings.currentChannel', channel.get('slug'));

      // Mark all other channels as inactive/invisible
      this.get('coms.spaces').forEach((space) => {
        space.get('channels').setEach('visible', false);
      });

      // Mark channel as active/visible
      channel.set('visible', true);

      // Mark unread messages as read
      channel.set('unreadMessages', false);
      channel.set('unreadMentions', false);

      later(this, () => this.send('menu', 'global', 'hide'), 500);
    }

  }

});
