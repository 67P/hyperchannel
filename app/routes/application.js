import Ember from 'ember';

export default Ember.Route.extend({

  setupController: function(controller) {
    var settings = JSON.parse(window.localStorage.getItem('hyperchannel:irc_settings'));
    controller.set('ircSettings', Ember.Object.create(settings));

    if (settings) {
      console.log('loaded settings', settings);
      controller.configureIRC();
    } else {
      this.transitionTo('settings');
    }
  }

});
