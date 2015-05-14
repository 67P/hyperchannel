import Ember from 'ember';

export default Ember.Route.extend({

  model: function() {
    this.smt.loadFixtures();
  }

});
