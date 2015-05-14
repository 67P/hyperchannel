import Ember from 'ember';
import Space   from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
// import User    from 'hyperchannel/models/channel';

// TODO Use Ember.Service when upgrading to latest version
export default Ember.Object.extend({

  spaces: null,
  // users:  null,

  loadFixtures: function() {
    this.setupListeners();
    this.instantiateSpaces();
    this.instantiateChannels();
  },

  instantiateSpaces: function() {
    this.set('spaces', []);

    var spaceFixtures = this.get('spaceFixtures');
    Object.keys(spaceFixtures).forEach(function(spaceName){
      var space = Space.create({name: spaceName, ircServer: spaceFixtures[spaceName].ircServer});
      this.connectToIRCServer(space);
      this.get('spaces').pushObject(space);
    }.bind(this));
  },

  connectToIRCServer: function(space) {
    this.sockethub.Activity.Object.create({
      id: space.get('sockethubPersonId'),
      objectType: "person",
      displayName: space.get('ircServer.nickname')
    });

    var credentials = {
      actor: space.get('sockethubPersonId'),
      platform: 'irc',
      object: {
        objectType: 'credentials',
        nick: space.get('ircServer.nickname'),
        server: space.get('ircServer.hostname'),
        port: space.get('ircServer.port'),
        secure: space.get('ircServer.secure')
      }
    };

    console.log('connecting to irc', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  setupListeners: function() {
    this.sockethub.socket.on('completed', function(message) {
      console.log('SH completed', message);

      if (message.verb === 'join') {
        var space = this.get('spaces').findBy('sockethubPersonId', message.actor);
        if (!Ember.isEmpty(space)) {
          var channel = space.get('channels').findBy('sockethubChannelId', message.target);
          if (!Ember.isEmpty(channel)) {
            channel.set('connected', true);
            // this.observeChannel(space.get('sockethubPersonId'), channel.get('sockethubChannelId'));
          }
        }
      }
    }.bind(this));

    this.sockethub.socket.on('message', function(message) {
      console.log('SH message', message);

      // user list for a channel
      if (message.verb === 'observe' && message.object.objectType === 'attendance') {
        var space = this.get('spaces').findBy('ircServer.hostname',
                                              message.actor.id.match(/irc:\/\/(.+)\//)[1]);
        if (!Ember.isEmpty(space)) {
          var channel = space.get('channels').findBy('sockethubChannelId', message.target.id);
          if (!Ember.isEmpty(channel)) {
            channel.set('users', message.object.members);
          }
        }
      }
    }.bind(this));

    this.sockethub.socket.on('failure', function(message) {
      console.log('SH failure', message);
    });
  },

  observeChannel: function(person, channelId) {
    var observeMsg = {
      platform: 'irc',
      verb: 'observe',
      actor: person,
      target: channelId,
      object: {
        objectType: 'attendance'
      }
    };

    console.log('asking for attendance list', observeMsg);
    this.sockethub.socket.emit('message', observeMsg);
  },

  instantiateChannels: function() {
    this.get('spaces').forEach(function(space) {
      space.set('channels', []);

      var channel;
      this.get('spaceFixtures')[space.get('name')].channels.forEach(function(fixture){
        channel = Channel.create({
          name: fixture.name,
          sockethubChannelId: 'irc://%@/%@'.fmt(space.get('ircServer.hostname'), fixture.name),
          messages: []
        });
        this.joinChannel(space, channel);
        channel.set('userList', fixture.userList);
        space.get('channels').pushObject(channel);
      }.bind(this));
    }.bind(this));
  },

  joinChannel: function(space, channel) {
    this.sockethub.Activity.Object.create({
      objectType: "room",
      id: channel.get('sockethubChannelId'),
      displayName: channel.get('name')
    });

    var joinMsg = {
      platform: 'irc',
      verb: 'join',
      actor: space.get('sockethubPersonId'),
      target: channel.get('sockethubChannelId')
    };

    console.log('joining channel:', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },

  spaceFixtures: function() {
    var usernames = this.get('userFixtures').mapBy('username');

    return {
      'Freenode': {
          ircServer : {
            hostname: 'irc.freenode.net',
            port: 6667,
            secure: false,
            username: null,
            password: null,
            nickname: 'kosmos-dev-123456789',
            nickServ: {
              password: null
            }
          },
          channels: [
            { name: '#67p', userList: usernames.concat(['bacilla','gillisig']) },
            { name: '#kosmos', userList: usernames.concat(['bacilla']) },
            { name: '#kosmos-dev', userList: usernames.concat(['melvster','timbl']) },
            { name: '#sockethub', userList: usernames.concat(['melvster']) }
          ],
      },
      // 'Enterprise': {
      //   ircServer : {
      //     hostname: 'irc.kosmos.net',
      //     port: 6667,
      //     secure: false,
      //     username: null,
      //     password: null,
      //     nickname: 'kosmos-enterprise-dev',
      //     nickServ: {
      //       password: null
      //     }
      //   },
      //   channels: [
      //     { name: '#10forward', userList: usernames.concat(['ryker','gainan']) },
      //     { name: '#bridge', userList: usernames.concat(['jlpicard']) },
      //     { name: '#holodeck', userList: usernames.concat(['jordielaforge']) }
      //   ]
      // },
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

});
