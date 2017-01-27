import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
import UserChannel from 'hyperchannel/models/user_channel';
import Message from 'hyperchannel/models/message';
import config from 'hyperchannel/config/environment';
import moment from 'moment';
import { storageFor as localStorageFor } from 'ember-local-storage';

const {
  Service,
  computed,
  inject: {
    service
  }
} = Ember;

export default Service.extend({
  userSettings: localStorageFor('user-settings'),
  ajax: service(),

  spaces: null,
  // users:  null,

  loadFixtures() {
    this.setupListeners();
    this.instantiateSpaces();
    this.instantiateChannels();
  },

  instantiateSpaces() {
    this.set('spaces', []);

    var spaceFixtures = this.get('spaceFixtures');
    Object.keys(spaceFixtures).forEach((spaceName) => {
      var space = Space.create({
        name: spaceName,
        protocol: 'irc',
        server: spaceFixtures[spaceName].server
      });
      this.connectToIRCServer(space);
      this.get('spaces').pushObject(space);
    });
  },

  connectToIRCServer(space) {
    this.sockethub.ActivityStreams.Object.create({
      '@id': space.get('sockethubPersonId'),
      '@type': "person",
      displayName: space.get('server.nickname')
    });

    var credentials = {
      actor: space.get('sockethubPersonId'),
      context: 'irc',
      object: {
        '@type': 'credentials',
        nick: space.get('server.nickname'),
        server: space.get('server.hostname'),
        port: space.get('server.port'),
        secure: space.get('server.secure')
      }
    };

    // Ember.Logger.debug('connecting to irc', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  transferMessage(space, target, content) {
    let job = {
      context: 'irc',
      '@type': 'send',
      actor: space.get('sockethubPersonId'),
      target: target,
      object: {
        '@type': 'message',
        content: content
      }
    };

    // console.log('sending message job', job);
    this.sockethub.socket.emit('message', job);
  },

  transferMeMessage(space, target, content) {
    let job = {
      context: 'irc',
      '@type': 'send',
      actor: space.get('sockethubPersonId'),
      target: target,
      object: {
        '@type': 'me',
        content: content
      }
    };

    // console.log('sending message job', job);
    this.sockethub.socket.emit('message', job);
  },

  setupListeners() {
    this.sockethub.socket.on('completed', (message) => {
      // Ember.Logger.debug('SH completed', message);

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
      // Ember.Logger.debug('SH message', message);

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
          switch(message.object['@type']) {
            case 'message':
            case 'me':
              this.addMessageToChannel(message);
              break;
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

  updateChannelUserList(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      channel.set('userList', message.object.members.sort());
    }
  },

  addUserToChannelUserList(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      channel.addUser(message.actor.displaName);
    }
  },

  removeUserFromChannelUserList(message) {
    const channel = this.getChannelByMessage(message);
    if (channel) {
      channel.removeUser(message.actor.displayName);
    }
  },

  getChannelByMessage(message) {
    var addressWithHostname, hostname;
    if (typeof message.actor === 'object') {
      addressWithHostname = message.actor['@id'];
    } else if (typeof message.actor === 'string') {
      addressWithHostname = message.actor;
    }

    hostname = addressWithHostname.match(/irc:\/\/(?:.+@)?(.+?)(?:\/|$)/)[1];

    var space = this.get('spaces').findBy('server.hostname', hostname);

    if (!Ember.isEmpty(space)) {
      var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);
      if (!Ember.isEmpty(channel)) {
        return channel;
      }
    }
  },

  updateChannelTopic(message) {
    let hostname;
    if (typeof message.target === 'object') {
      hostname = message.target['@id'].match(/irc:\/\/(.+)\//)[1];
    } else if (typeof message.actor === 'string') {
      hostname = message.actor.match(/irc:\/\/.+\@(.+)/)[1];
    }

    let space = this.get('spaces').findBy('server.hostname', hostname);

    if (!Ember.isEmpty(space)) {
      let channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);

      if (Ember.isEmpty(channel)) {
        channel = this.createChannel(space, message.target['@id']);
      }

      let currentTopic = channel.get('topic');
      let newTopic = message.object.topic;

      channel.set('topic', newTopic);

      if (Ember.isPresent(currentTopic) && (newTopic !== currentTopic) && !channel.get('visible')) {
        Notification.requestPermission(function(){
          new Notification(channel.name, {
            body: `New Topic: ${newTopic}`
          });
        });
      }

      // let notification = Message.create({
      //   type: 'notification-topic-change',
      //   date: new Date(message.published),
      //   nickname: message.actor.displayName,
      //   content: message.object.topic
      // });

      // channel.get('messages').pushObject(notification);

    }
  },

  addMessageToChannel: function(message) {
    var space = this.get('spaces').findBy('server.hostname',
                message.actor['@id'].match(/irc:\/\/.+\@(.+)/)[1]);
    var nickname = space.get('userNickname');

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

    let messageType;
    if (message.object['@type'] === 'me') {
      messageType = 'message-chat-me';
    } else {
      messageType = 'message-chat';
    }

    var channelMessage = Message.create({
      type: messageType,
      date: new Date(message.published),
      nickname: message.actor.displayName,
      content: message.object.content
    });

    // TODO should check for message and update sent status if exists
    if (message.actor.displayName !== nickname) {
      channel.addMessage(channelMessage);
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

    // Ember.Logger.debug('asking for attendance list', observeMsg);
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
      space: space,
      name: channelName,
      sockethubChannelId: `irc://${space.get('server.hostname')}/${channelName}`,
      messages: [],
      userList: []
    });
    this.joinChannel(space, channel, "room");
    space.addChannel(channel);

    this.loadArchiveMessages(space, channel);

    return channel;
  },

  loadArchiveMessages(space, channel) {
    let today = moment.utc();
    let logsUrl = `${config.publicLogsUrl}/${space.get('name').toLowerCase()}/channels/${channel.get('slug')}/`;
        logsUrl += today.format('YYYY/MM/DD');

    this.get('ajax').request(logsUrl, {
      type: 'GET',
      dataType: 'json'
    }).then(archive => {
      Ember.get(archive, 'today.messages').forEach((message) => {
        // console.log('message', message);
        let channelMessage = Message.create({
          type: 'message-chat',
          date: new Date(message.timestamp),
          nickname: message.from,
          content: message.text
        });

        channel.addMessage(channelMessage);
      });
    }, error => {
      // console.log(error);
    });
  },

  createUserChannel: function(space, userName) {
    var channel = UserChannel.create({
      name: userName,
      sockethubChannelId: `irc://${space.get('server.hostname')}/${userName}`,
      messages: [],
      userList: []
    });
    this.joinChannel(space, channel, "person");
    space.addChannel(channel);
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

    // Ember.Logger.debug('joining channel', joinMsg);
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

    // Ember.Logger.debug('leaving channel', joinMsg);
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

  spaceFixtures: computed(function() {
    // TODO: Save in remoteStorage
    let nickname = this.get('userSettings.nickname');

    if (!nickname) {
      nickname = prompt("Choose a nickname");
      this.set('userSettings.nickname', nickname);
    }

    return {
      'Freenode': {
          server : {
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
            '#hackerbeach',
            '#kosmos',
            '#kosmos-dev',
            '#kosmos-random',
            '#sockethub'
          ],
      },
      // 'Enterprise': {
      //   server : {
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
  }),

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

