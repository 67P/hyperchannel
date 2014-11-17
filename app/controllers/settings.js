import Ember from 'ember';

export default Ember.ObjectController.extend({

  needs: ['application'],
  ircSettingsBinding: 'controllers.application.ircSettings'

});
