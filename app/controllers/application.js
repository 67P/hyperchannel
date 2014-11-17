import Ember from 'ember';

export default Ember.Controller.extend({

  ircSettings: null,
  channelJoined: false,

  configureIRC: function() {
    var self = this;

    if (!this.sockethub.registered) {
      this.sockethub.on('registered', function() {
        this.setIRCCredentials();
      }.bind(this));
    } else {
      this.setIRCCredentials();
    }
  },

  setIRCCredentials: function() {
    this.sockethub.set('irc', 'hyperchannel', {
      objectType: 'credentials',
      nick: this.get('ircSettings.nickname'),
      server: this.get('ircSettings.server'),
      channel: this.get('ircSettings.channel')
    }).then(function () {
      console.log('successfully set credentials for irc');
      this.joinChannel();
    }.bind(this), function (err) {
      console.log('error setting credentials for irc :( ', err);
    });
  },

  joinChannel: function() {
    var self = this;

    this.sockethub.sendObject({
      platform: 'irc',
      verb: 'join',
      actor: { address: 'hyperchannel' },
      target: [{address: this.get('ircSettings.channel')}]
    }).then(function() {
      console.log('joined channel');
      self.set('channelJoined', true);
    }, function(err) {
      console.log('error joining channel', err);
      self.set('channelJoined', false);
    });
  }

});

