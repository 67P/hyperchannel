import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class IndexRoute extends Route {

  @service router;
  @service localData;
  @service coms;

  get userSettings () {
    return this.localData.stores.userSettings;
  }

  async redirect () {
    const currentChannel = await this.userSettings.getItem('currentChannel');

    if (currentChannel) {
      this.router.transitionTo('channel', currentChannel);
    } else {
      this.router.transitionTo('channel', this.coms.channels.firstObject);
    }
  }

}
