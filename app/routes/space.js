import Ember from 'ember';

export default Ember.Route.extend({

  model: function(params) {
    return this.smt.get('spaces')
                   .findBy('id', params.id);
  }

});
