import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
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

  get userSettings () {
    return this.localData.stores.userSettings;
  }

  model (params) {
    let channel = this.coms.channels.findBy('slug', params.slug);
    if (channel) return channel;

    const channelId = decodeURIComponent(params.slug);
    const domain = channelId.match(/@([^/]+)/)[1];
    const randomChannelForDomain = this.coms.channels.findBy('domain', domain);

    if (randomChannelForDomain) {
      channel = this.createChannelOrUserChannel(randomChannelForDomain.account, channelId);
      return channel;
    } else {
      const firstChannel = this.coms.channels.firstObject;
      this.router.transitionTo('channel', firstChannel);
    }
  }

  setupController () {
    super.setupController(...arguments);

    scheduleOnce('afterRender', this, focusMessageInput);
  }

  @action
  async didTransition () {
    const channel = this.modelFor(this.routeName);

    await this.userSettings.setItem('currentChannel', channel.slug);

    // Mark all other channels as inactive/invisible
    this.coms.channels.setEach('visible', false);

    // Mark channel as active/visible
    channel.visible = true;

    // Mark unread messages as read
    channel.unreadMessages = false;
    channel.unreadMentions = false;
  }

}
