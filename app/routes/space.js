import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({

  coms: service(),

  model: function(params) {
    return this.coms.get('spaces')
                          .findBy('id', params.id);
  }

});
