import Ember from 'ember';

export default Ember.Route.extend({

  model: function(params) {
    return this.modelFor('space')
               .get('channels')
               .findBy('slug', params.slug);
  },

});
