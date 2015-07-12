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
    Object.keys(spaceFixtures).forEach((spaceName) => {
      var space = Space.create({name: spaceName, ircServer: spaceFixtures[spaceName].ircServer});
      this.connectToIRCServer(space);
      this.get('spaces').pushObject(space);
    });
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

    Ember.Logger.debug('connecting to irc', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  setupListeners: function() {
    this.sockethub.socket.on('completed', (message) => {
      Ember.Logger.debug('SH completed', message);


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
    });

    this.sockethub.socket.on('message', (message) => {
      Ember.Logger.debug('SH message', message);

      switch(message['@type']) {
        case 'observe':
          if (message.object['@type'] === 'attendance') {
            this.updateChannelUserList(message);
          }
          break;
        case 'join':
          this.addUserToChannelUserList(message);
          break;
        case 'leave':
          this.removeUserFromChannelUserList(message);
          break;
        case 'send':
          if (message.object['@type'] === 'message') {
            this.addMessageToChannel(message);
          }
          break;
        case 'update':
          if (message.object['@type'] === 'topic') {
            this.updateChannelTopic(message);
          }
          break;
      }

      // user list for a channel
    });

    this.sockethub.socket.on('failure', function(message) {
      Ember.Logger.error('SH failure', message);
    });
  },

  updateChannelUserList: function(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      channel.set('userList', message.object.members.sort());
    }
  },

  addUserToChannelUserList: function(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      var userList = channel.get('userList');
      userList.pushObject(message.actor.displayName);
    }
  },

  removeUserFromChannelUserList: function(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      var userList = channel.get('userList');
      userList.removeObject(message.actor.displayName);
    }
  },

  getChannelByMessage: function(message) {
    var addressWithHostname, hostname;
    if (typeof message.actor === 'object') {
      addressWithHostname = message.actor['@id'];
    } else if (typeof message.actor === 'string') {
      addressWithHostname = message.actor;
    }

    hostname = addressWithHostname.match(/irc:\/\/(?:.+@)?(.+?)(?:\/|$)/)[1];

    var space = this.get('spaces').findBy('ircServer.hostname', hostname);

    if (!Ember.isEmpty(space)) {
      var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);
      if (!Ember.isEmpty(channel)) {
        return channel;
      }
    }
  },

  updateChannelTopic: function(message) {
    var hostname;
    if (typeof message.target === 'object') {
      hostname = message.target['@id'].match(/irc:\/\/(.+)\//)[1];
    } else if (typeof message.actor === 'string') {
      hostname = message.actor.match(/irc:\/\/.+\@(.+)/)[1];
    }

    var space = this.get('spaces').findBy('ircServer.hostname', hostname);

    if (!Ember.isEmpty(space)) {
      var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);

      if (Ember.isEmpty(channel)) {
        channel = this.createChannel(space, message.target['@id']);
      }

      channel.set('topic', message.object.topic);

      var notification = Message.create({
        type: 'notification-topic-change',
        date: new Date(message.published),
        nickname: message.actor.displayName,
        content: message.object.topic
      });

      channel.get('messages').pushObject(notification);
    }
  },

  addMessageToChannel: function(message) {
    var space = this.get('spaces').findBy('ircServer.hostname',
                message.actor['@id'].match(/irc:\/\/.+\@(.+)/)[1]);
    var nickname = space.get('ircServer.nickname');

    var targetChannelName;
    if (nickname === message.target.displayName) {
      targetChannelName = message.actor.displayName;
    } else {
      targetChannelName = message.target.displayName;
    }

    var channel = space.get('channels').findBy('name', targetChannelName);
    if (!channel) {
      channel = this.createChannel(space, targetChannelName);
    }

    var channelMessage = Message.create({
      type: 'message-chat',
      date: new Date(message.published),
      nickname: message.actor.displayName,
      content: message.object.content
    });

    // TODO should check for message and update sent status if exists
    if (message.actor.displayName !== nickname) {
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

    Ember.Logger.debug('asking for attendance list', observeMsg);
    this.sockethub.socket.emit('message', observeMsg);
  },

  instantiateChannels: function() {
    this.get('spaces').forEach((space) => {
      space.set('channels', []);

      this.get('spaceFixtures')[space.get('name')].channels.forEach((channelName) => {
        this.createChannel(space, channelName);
      });
    });
  },

  createChannel: function(space, channelName) {
    var channel = Channel.create({
      name: channelName,
      sockethubChannelId: 'irc://%@/%@'.fmt(space.get('ircServer.hostname'), channelName),
      messages: []
    });
    this.joinChannel(space, channel, "room");
    channel.set('userList', []);
    space.get('channels').pushObject(channel);
    return channel;
  },

  createUserChannel: function(space, userName) {
    var channel = Channel.create({
      name: userName,
      sockethubChannelId: 'irc://%@/%@'.fmt(space.get('ircServer.hostname'), userName),
      messages: []
    });
    this.joinChannel(space, channel, "person");
    channel.set('userList', []);
    space.get('channels').pushObject(channel);
    return channel;
  },

  removeChannel: function(space, channelName) {
    var channel = space.get('channels').findBy('name', channelName);
    this.leaveChannel(space, channel);
    space.get('channels').removeObject(channel);
    return channel;
  },

  joinChannel: function(space, channel, type) {
    this.sockethub.ActivityStreams.Object.create({
      '@type': type,
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

    Ember.Logger.debug('joining channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },

  leaveChannel: function(space, channel) {
    this.sockethub.ActivityStreams.Object.create({
      '@type': "room",
      '@id': channel.get('sockethubChannelId'),
      displayName: channel.get('name')
    });

    var joinMsg = {
      context: 'irc',
      '@type': 'leave',
      actor: space.get('sockethubPersonId'),
      target: channel.get('sockethubChannelId'),
      object: {}
    };

    Ember.Logger.debug('leaving channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },

  changeTopic: function(space, channel, topic) {
    var topicMsg = {
      context: 'irc',
      '@type': 'update',
      actor: space.get('sockethubPersonId'),
      target: channel.get('sockethubChannelId'),
      object: {
        '@type': 'topic',
        topic: topic
      }
    };

    this.sockethub.socket.emit('message', topicMsg);
  },

  spaceFixtures: function() {
    var nickname = localStorage.getItem('hyperchannel-nickname');
    if (!nickname) {
      nickname = prompt("Choose a Nickname");
      localStorage.setItem('hyperchannel-nickname', nickname);
    }

    return {
      'Freenode': {
          ircServer : {
            hostname: 'irc.freenode.net',
            port: 6667,
            secure: false,
            username: null,
            password: null,
            nickname: nickname,
            nickServ: {
              password: null
            }
          },
          channels: [
            '#67p',
            '#kosmos',
            '#kosmos-dev',
            '#sockethub'
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
      //   }
      // },
    };
  }.property(),

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
