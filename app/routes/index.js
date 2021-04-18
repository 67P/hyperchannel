import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import config from 'hyperchannel/config/environment';
import { alias } from '@ember/object/computed';

export default class IndexRoute extends Route {

  @service localData;
  @alias('localData.stores.userSettings') userSettings;

  async redirect () {
    const currentSpace = await this.userSettings.getItem('currentSpace') || config.defaultSpaceId;
    const currentChannel = await this.userSettings.getItem('currentChannel') || 'kosmos';
    // TODO if current space from setting is not available, use first available space and channel

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  }

}
