import Route from '@ember/routing/route';
import { storageFor as localStorageFor } from 'ember-local-storage';
import config from 'hyperchannel/config/environment';

export default class IndexRoute extends Route {

  userSettings = localStorageFor('user-settings');

  redirect () {
    let currentSpace = this.userSettings.currentSpace || config.defaultSpaceId;
    let currentChannel = this.userSettings.currentChannel || 'kosmos';

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  }

}
