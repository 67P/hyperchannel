import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

export default Ember.Route.extend({

  setupController: function(controller) {
    // TODO refactor
    // var settings = JSON.parse(window.localStorage.getItem('hyperchannel:irc_settings'));
    // controller.set('ircSettings', Ember.Object.create(settings));
    //
    // if (settings) {
    //   console.log('loaded settings', settings);
    //   controller.configureIRC();
    // } else {
    //   this.transitionTo('settings');
    // }

    if (settings) {
      console.log('loaded settings', settings);
      controller.configureIRC();
    } else {
      this.transitionTo('settings');
    }

    controller.instantiateSpaces();
  }

});
