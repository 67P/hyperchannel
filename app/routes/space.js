import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class SpaceRoute extends Route {

  @service coms;

  model (params) {
    return this.coms.spaces.findBy('id', params.id);
  }

}
