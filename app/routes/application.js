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

    var spaceFixtures = this.get('spaceFixtures');
    var space;

    Object.keys(spaceFixtures).forEach(function(spaceName){
      space = Space.create({name: spaceName});
      spaceFixtures[spaceName].forEach(function(channelName){
        space.get('channels').pushObject(Channel.create({name: channelName}));
      });
      controller.get('spaces').pushObject(space);
    });
  },

  spaceFixtures: function() {
    return {
      'Enterprise': ['#bridge', '#10forward', '#holodeck'],
      'Unhosted'  : ['#unhosted', '#remotestorage', '#socketgrub']
    };
  }.property()

});
