import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route {

  @service localData;
  @service coms;

  get userSettings () {
    return this.localData.stores.userSettings;
  }

  async redirect () {
    const currentChannel = await this.userSettings.getItem('currentChannel');

    if (currentChannel) {
      this.transitionTo('channel', currentChannel);
    } else {
      this.transitionTo('channel', this.coms.channels.firstObject);
    }
  }

}
