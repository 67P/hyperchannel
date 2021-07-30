import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

export default class IndexRoute extends Route {

  @service localData;
  @service coms;
  @alias('localData.stores.userSettings') userSettings;

  async redirect () {
    const currentChannel = await this.userSettings.getItem('currentChannel');

    if (currentChannel) {
      this.transitionTo('channel', currentChannel);
    } else {
      this.transitionTo('channel', this.coms.channels.firstObject);
    }
  }

}
