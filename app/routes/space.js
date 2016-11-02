import Ember from 'ember';

export default Ember.Route.extend({

  smt: Ember.inject.service(),

  model: function(params) {
    return this.get('smt').get('spaces')
                          .findBy('id', params.id);
  }

});
