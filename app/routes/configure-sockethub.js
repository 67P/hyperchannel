import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import config from 'hyperchannel/config/environment';

export default class ConfigureSockethubRoute extends Route {

  @service sockethub;

  model () {
    return { config };
  }

  redirect () {
    if (this.sockethub.client) {
      this.transitionTo('index');
    }
  }

}
