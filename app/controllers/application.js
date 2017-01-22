import Ember   from 'ember';

export default Ember.Controller.extend({

  smt: Ember.inject.service(),
  spaces: Ember.computed.alias('smt.spaces'),

  showGlobalMenu: false,
  showChannelMenu: false

});

