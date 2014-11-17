import Ember from 'ember';

export default Ember.Route.extend({

  actions: {
    save: function() {
      var settings = this.controller.get('ircSettings');
      window.localStorage.setItem('hyperchannel:irc_settings', JSON.stringify(settings));
      console.log('saved settings', settings);
      this.controllerFor('application').configureIRC();
    }
  }

});
