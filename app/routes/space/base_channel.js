import Ember from 'ember';
import { storageFor as localStorageFor } from 'ember-local-storage';

const {
  Route,
  inject: {
    service
  },
  run: {
    later,
    scheduleOnce
  }
} = Ember;

function scrollToBottom() {
  Ember.$('#channel-content').animate({
    scrollTop: Ember.$('#channel-content ul').height()
  }, '500');
}

function focusMessageInput() {
  if (window.innerWidth > 900) {
    console.debug('innerWidth', window.innerWidth);
    Ember.$('input#message-field').focus();
  } else {
    // Don't auto-focus on small screens
  }
}

export default Route.extend({
  smt: service(),
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
      scrollToBottom();
    });
  },

  actions: {

    didTransition() {
      let space = this.modelFor('space');
      let channel = this.controller.get('model');

      this.set('userSettings.currentSpace', space.get('id'));
      this.set('userSettings.currentChannel', channel.get('slug'));

      // Mark channel as active/visible
      space.get('channels').setEach('visible', false);
      channel.set('visible', true);

      // Mark unread messages as read
      channel.set('unreadMessages', false);
      channel.set('unreadMentions', false);

      later(this, () => this.send('menu', 'global', 'hide'), 500);
    }

  }

});
