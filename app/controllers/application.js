import Ember   from 'ember';
import Space   from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
// import User    from 'hyperchannel/models/channel';

export default Ember.Controller.extend({

  spaces: null,
  // users:  null,

  loadFixtures: function() {
    this.instantiateSpaces();
    this.instantiateChannels();
  },

  instantiateSpaces: function() {
    this.set('spaces', []);

    Object.keys(this.get('spaceFixtures')).forEach(function(spaceName){
      this.get('spaces').pushObject(
        Space.create({name: spaceName})
      );
    }.bind(this));
  },

  instantiateChannels: function() {
    this.get('spaces').forEach(function(space) {
      space.set('channels', []);

      var channel;
      this.get('spaceFixtures')[space.get('name')].forEach(function(fixture){
        channel = Channel.create({name: fixture.name});
        channel.set('userList', fixture.userList);
        space.get('channels').pushObject(channel);
      });
    }.bind(this));
  },

  spaceFixtures: function() {
    var usernames = this.get('userFixtures').mapBy('username');

    return {
      'Freenode': [
        { name: '#67p', userList: usernames.concat(['bacilla','gillisig']) },
        { name: '#kosmos', userList: usernames.concat(['bacilla']) },
        { name: '#kosmos-dev', userList: usernames.concat(['melvster','timbl']) },
        { name: '#sockethub', userList: usernames.concat(['melvster']) }
      ],
      'Enterprise': [
        { name: '#10forward', userList: usernames.concat(['ryker','gainan']) },
        { name: '#bridge', userList: usernames.concat(['jlpicard']) },
        { name: '#holodeck', userList: usernames.concat(['jordielaforge']) }
      ],
    };
  }.property('userFixtures'),

  userFixtures: function() {
    return [
      { username: 'bkero' },
      { username: 'derbumi' },
      { username: 'galfert' },
      { username: 'gregkare' },
      { username: 'jaaan' },
      { username: 'LSA232' },
      { username: 'raucao' },
      { username: 'slvrbckt' }
    ];
  }.property(),

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

