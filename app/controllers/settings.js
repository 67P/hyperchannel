import Ember from 'ember';

export default Ember.Controller.extend({

  needs: ['application'],
  ircSettingsBinding: 'controllers.application.ircSettings'

});
