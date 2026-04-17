import Route from '@ember/routing/route';
import { service } from '@ember/service';
import config from 'hyperchannel/config/environment';

export default class ConfigureSockethubRoute extends Route {

  @service('router') router;
@service sockethub;

  model () {
    return { config };
  }

  redirect () {
    if (this.sockethub.client) {
      this.router.transitionTo('index');
    }
  }

}
