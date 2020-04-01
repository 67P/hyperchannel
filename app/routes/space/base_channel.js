import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { storageFor as localStorageFor } from 'ember-local-storage';

function focusMessageInput() {
  if (window.innerWidth > 900) {
    document.querySelector('input#message-field').focus();
  } else {
    // Don't auto-focus on small screens
  }
}

export default class BaseChannelRoute extends Route {

  @service coms;
  userSettings = localStorageFor('user-settings');

  model (params) {
    let space = this.modelFor('space');
    let channel = space.channels.findBy('slug', params.slug);

    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }

    return channel;
  }

  setupController () {
    super.setupController(...arguments);

    scheduleOnce('afterRender', this, focusMessageInput);
  }

  @action
  didTransition () {
    let space = this.modelFor('space');
    let channel = this.controller.model;

    this.userSettings.currentSpace = space.id;
    this.userSettings.currentChannel = channel.slug;

    // Mark all other channels as inactive/invisible
    this.coms.spaces.forEach((space) => {
      space.channels.setEach('visible', false);
    });

    // Mark channel as active/visible
    channel.visible = true;

    // Mark unread messages as read
    channel.unreadMessages = false;
    channel.unreadMentions = false;
  }

  @action
  menu (which, what) {
    this.controller.send('menu', which, what);
  }

}
