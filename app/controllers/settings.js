import Ember from 'ember';

export default Ember.Controller.extend({

  application: Ember.inject.controller(),
  ircSettings: Ember.computed.alias('application.ircSettings')

});
