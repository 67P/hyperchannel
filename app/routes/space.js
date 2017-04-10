import Ember from 'ember';

export default Ember.Route.extend({

  coms: Ember.inject.service(),

  model: function(params) {
    return this.get('coms').get('spaces')
                          .findBy('id', params.id);
  }

});
