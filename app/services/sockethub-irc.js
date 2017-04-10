import Ember from 'ember';

const {
  inject: {
    service
  }
} = Ember;

export default Ember.Service.extend({

  coms: service(),

});
