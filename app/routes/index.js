import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default class IndexRoute extends Route {

  @service localData;
  @alias('localData.stores.userSettings') userSettings;

  async redirect () {
    const currentChannel = await this.userSettings.getItem('currentChannel');

    if (currentChannel) {
      this.transitionTo('channel', currentChannel);
    } else {
      // TODO if current space from setting is not available, use first available space and channel
    }
  }

}
