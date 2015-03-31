export default Ember.Route.extend({

  model: function(params) {
    console.debug(params.slug);
  },

  // setupController: function() {
  //
  // }

});
