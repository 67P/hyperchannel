import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

const {
  Route,
  get,
  set,
  inject: {
    service
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

export default Ember.Route.extend({
  smt: service(),
  userSettings: storageFor('user-settings'),

  model(params) {
    var space = this.modelFor('space');
    var channel = space.get('channels').findBy('slug', params.slug);

    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }

    return channel;
  },

  setupController(controller, model) {
    this._super(controller, model);

    Ember.run.scheduleOnce('afterRender', function() {
      focusMessageInput();
      scrollToBottom();
    });
  },

  actions: {

    didTransition() {
      let space = this.modelFor('space');
      let channel = this.controller.get('model');

      set(this, 'userSettings.currentSpace', get(space, 'id'));
      set(this, 'userSettings.currentChannel', get(channel, 'slug'));

      // Mark channel as active/visible
      space.get('channels').setEach('visible', false);
      channel.set('visible', true);

      // Mark unread messages as read
      channel.set('unreadMessages', false);
      channel.set('unreadMentions', false);

      Ember.run.later(this, () => this.send('menu', 'global', 'hide'), 500);
    }

  }

});
