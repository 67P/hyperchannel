import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { alias } from '@ember/object/computed';
import { scheduleOnce } from '@ember/runloop';

function focusMessageInput() {
  if (window.innerWidth > 900) {
    document.querySelector('input#message-field').focus();
  } else {
    // Don't auto-focus on small screens
  }
}

export default class BaseChannelRoute extends Route {

  @service router;
  @service coms;
  @service localData;
  @alias('localData.stores.userSettings') userSettings;

  model (params) {
    const channel = this.coms.channels.findBy('slug', params.slug);

    // TODO must select acccount automatically (for IRC)
    // if (!channel) {
    //   channel = this.createChannelOrUserChannel(account, params.slug);
    // }

    return channel;
  }

  setupController () {
    super.setupController(...arguments);

    scheduleOnce('afterRender', this, focusMessageInput);
  }

  @action
  async didTransition () {
    const channel = this.controller.model;

    await this.userSettings.setItem('currentChannel', channel.slug);

    // Mark all other channels as inactive/invisible
    this.coms.channels.setEach('visible', false);

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
