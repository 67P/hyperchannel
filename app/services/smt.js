import Ember from 'ember';
import Space   from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
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
    this.sockethub.ActivityStreams.Object.create({
      '@id': space.get('sockethubPersonId'),
      '@type': "person",
      displayName: space.get('ircServer.nickname')
    });

    var credentials = {
      actor: space.get('sockethubPersonId'),
      context: 'irc',
      object: {
        '@type': 'credentials',
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


      switch(message['@type']) {
        case 'join':
          if (message['@type'] === 'join') {
            var space = this.get('spaces').findBy('sockethubPersonId', message.actor);
            if (!Ember.isEmpty(space)) {
              var channel = space.get('channels').findBy('sockethubChannelId', message.target);
              if (!Ember.isEmpty(channel)) {
                channel.set('connected', true);
                this.observeChannel(space.get('sockethubPersonId'), channel.get('sockethubChannelId'));
              }
            }
          }
          break;
        case 'observe':
          if (message.object['@type'] === 'attendance') {
            this.updateChannelUserList(message);
          }
          break;
      }
    }.bind(this));

    this.sockethub.socket.on('message', function(message) {
      console.log('SH message', message);

      switch(message['@type']) {
        case 'observe':
          if (message.object['@type'] === 'attendance') {
            this.updateChannelUserList(message);
          }
          break;
        case 'send':
          if (message.object['@type'] === 'message') {
            this.addMessageToChannel(message);
          }
          break;
      }

      // user list for a channel
    }.bind(this));

    this.sockethub.socket.on('failure', function(message) {
      console.log('SH failure', message);
    });
  },

  updateChannelUserList: function(message) {
    var hostname;
    if (typeof message.actor === 'object') {
      hostname = message.actor['@id'].match(/irc:\/\/(.+)\//)[1];
    } else if (typeof message.actor === 'string') {
      hostname = message.actor.match(/irc:\/\/.+\@(.+)/)[1];
    }

    var space = this.get('spaces').findBy('ircServer.hostname', hostname);

    if (!Ember.isEmpty(space)) {
      var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);
      if (!Ember.isEmpty(channel)) {
        channel.set('userList', message.object.members);
      }
    }
  },

  addMessageToChannel: function(message) {
    console.debug('actor', message.actor['@id']);

    var space = this.get('spaces').findBy('ircServer.hostname',
                message.actor['@id'].match(/irc:\/\/.+\@(.+)/)[1]);
    var channel = space.get('channels').findBy('name', message.target.displayName);

    var channelMessage = Message.create({
      date: new Date(message.published),
      nickname: message.actor.displayName,
      content: message.object.content
    });

    // TODO should check for message and update sent status if exists
    if (message.actor.displayName !== space.get('ircServer.nickname')) {
      channel.get('messages').pushObject(channelMessage);
    }
  },

  observeChannel: function(person, channelId) {
    var observeMsg = {
      context: 'irc',
      '@type': 'observe',
      actor: person,
      target: channelId,
      object: {
        '@type': 'attendance'
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
        channel.set('userList', []);
        space.get('channels').pushObject(channel);
      }.bind(this));
    }.bind(this));
  },

  joinChannel: function(space, channel) {
    this.sockethub.ActivityStreams.Object.create({
      '@type': "room",
      '@id': channel.get('sockethubChannelId'),
      displayName: channel.get('name')
    });

    var joinMsg = {
      context: 'irc',
      '@type': 'join',
      actor: space.get('sockethubPersonId'),
      target: channel.get('sockethubChannelId'),
      object: {}
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
            nickname: 'kosmos-12345',
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
