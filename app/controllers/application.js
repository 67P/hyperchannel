import Ember from 'ember';

export default Ember.Controller.extend({

  spaces: [],

  // TODO this all needs to go

  ircSettings: null,
  channelJoined: false,

  configureIRC: function() {
    var self = this;

    if (!this.sockethub.registered) {
      self.sockethub.on('registered', function() {
        self.setIRCCredentials();
      });
    } else {
      self.setIRCCredentials();
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
  },

  sendMessage: function(message) {
    if (this.get('channelJoined')) {
      return this.sockethub.sendObject({
        platform: 'irc',
        verb: 'send',
        actor: { address: 'hyperchannel' },
        object: { text: message },
        target: [{address: this.get('ircSettings.channel')}]
      }).then(function() {
        console.log('sent message');
      }, function(err) {
        console.log('error sending message', err);
      });
    } else {
      console.log('need to join channel first');
    }
  }

});

