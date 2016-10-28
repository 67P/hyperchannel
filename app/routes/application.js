import Ember from 'ember';

export default Ember.Route.extend({

  smt: Ember.inject.service(),

  model: function() {
    this.get('smt').loadFixtures();
  }

});
