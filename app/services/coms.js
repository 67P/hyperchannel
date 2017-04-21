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
  inject: {
    service
  },
  RSVP,
  isEmpty,
  isPresent,
  Logger,
  get
} = Ember;

/**
 * This service provides the central command interface for communicating with
 * chat servers/networks
 * @module hyperchannel/services/coms
 */
export default Service.extend({

  // Utils
  ajax: service(),
  logger: service(),
  // Data storage
  userSettings: localStorageFor('user-settings'),
  storage: service('remotestorage'),
  // Message transport
  irc: service('sockethub-irc'),

  /**
   * A collection of all space model instances
   * @type {Space[]}
   */
  spaces: null,

  /**
   * This is called from the application route on app startup. Sets up all
   * listeners for incoming Sockethub messages.
   * @public
   */
  setupListeners() {
    this.sockethub.socket.on('completed', this.handleSockethubCompleted.bind(this));
    this.sockethub.socket.on('message'  , this.handleSockethubMessage.bind(this));
    this.sockethub.socket.on('failure'  , this.handleSockethubFailure.bind(this));
  },

  /**
   * This is called from the application route on app startup. Instantiates,
   * connects, and joins all either configured/saved or default spaces/channels
   * @public
   */
  instantiateSpacesAndChannels() {
    this.set('spaces', []);
    let rs = this.get('storage.rs');

    return new RSVP.Promise((resolve, reject) => {
      rs.kosmos.spaces.getAll().then(spaceData => {
        if (isEmpty(Object.keys(spaceData))) {
          Logger.debug('No space data found in RS. Adding default space...');
          this.get('storage').addDefaultSpace().then((data) => {
            this.connectAndAddSpace(data.space);
            this.instantiateChannels(data.space, data.channels);
            resolve();
          });
        } else {
          Object.keys(spaceData).forEach((id) => {
            let space = Space.create({
              name: spaceData[id].name,
              protocol: spaceData[id].protocol,
              server: spaceData[id].server
            });
            this.connectAndAddSpace(space);
            this.instantiateChannels(space, spaceData[id].channels);
          });
          resolve();
        }
      }, e => {
        this.log('error', 'couldn\'d load spaces from RS', e);
        reject();
      });
    });
  },

  /**
   * Invokes the connect function on the appropriate transport service
   * @public
   */
  connectServer(space) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').connect(space);
        break;
      // case 'XMPP':
        // TODO implement XMPP service
        // this.get('xmpp').connect(space);
        // break;
    }
  },

  connectAndAddSpace(space) {
    this.connectServer(space);
    this.get('spaces').pushObject(space);
  },

  /**
   * Invokes the channel-join function on the appropriate transport service
   * @param {Space} space
   * @param {Channel} channel
   * @param {string} type - Type of channel. Can be "room" or "person"
   * @public
   */
  joinChannel: function(space, channel, type) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').join(space, channel, type);
        break;
    }
  },

  /**
   * Invokes the send-message function on the appropriate transport service
   * @public
   */
  transferMessage(space, target, content) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').transferMessage(space, target, content);
        break;
    }
  },

  /**
   * Invokes the send-action-message function on the appropriate transport service
   * @public
   */
  transferMeMessage(space, target, content) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').transferMeMessage(space, target, content);
        break;
    }
  },

  leaveChannel: function(space, channel) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').leave(space, channel);
        break;
    }
  },

  changeTopic: function(space, channel, topic) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.get('irc').changeTopic(space, channel, topic);
        break;
    }
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

    if (!isEmpty(space)) {
      var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);
      if (!isEmpty(channel)) {
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

    if (!isEmpty(space)) {
      let channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);

      if (isEmpty(channel)) {
        channel = this.createChannel(space, message.target['@id']);
      }

      let currentTopic = channel.get('topic');
      let newTopic = message.object.topic;

      channel.set('topic', newTopic);

      if (isPresent(currentTopic) && (newTopic !== currentTopic) && !channel.get('visible')) {
        Notification.requestPermission(function() {
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

  instantiateChannels: function(space, channels) {
    channels.forEach((channelName) => {
      this.createChannel(space, channelName);
    });
  },

  createChannel: function(space, channelName) {
    var channel = Channel.create({
      space: space,
      name: channelName,
      // TODO use IRC module
      sockethubChannelId: `irc://${space.get('server.hostname')}/${channelName}`
    });

    this.joinChannel(space, channel, "room");
    space.get('channels').pushObject(channel);

    // TODO Do we need this on startup? Could overwrite updates from remote.
    this.get('storage').saveSpace(space);

    if (channel.get('isLogged')) {
      this.loadLastMessages(space, channel, moment.utc(), 2).catch(() => {});
    }

    return channel;
  },

  loadLastMessages(space, channel, date, maximumDays = 14) {
    let searchUntilDate;
    if (channel.get('searchedPreviousLogsUntilDate')) {
      searchUntilDate = moment(channel.get('searchedPreviousLogsUntilDate')).subtract(maximumDays, 'days');
    } else {
      searchUntilDate = moment.utc().subtract(maximumDays, 'days');
    }

    if (date.isBefore(searchUntilDate, 'day')) {
      channel.set('searchedPreviousLogsUntilDate', date);
      return;
    }

    return this.loadArchiveMessages(space, channel, date).catch(() => {
      // didn't find any archive for this day, restart searching for the previous day
      return this.loadLastMessages(space, channel, date.subtract(1, 'day'));
    });
  },

  loadArchiveMessages(space, channel, date) {
    let logsUrl = `${config.publicLogsUrl}/${space.get('name').toLowerCase()}/channels/${channel.get('slug')}/`;
        logsUrl += date.format('YYYY/MM/DD');

    return this.get('ajax').request(logsUrl, {
      type: 'GET',
      dataType: 'json'
    }).then(archive => {
      get(archive, 'today.messages').forEach((message) => {
        this.log('message', message);

        let channelMessage = Message.create({
          type: 'message-chat',
          date: new Date(message.timestamp),
          nickname: message.from,
          content: message.text
        });

        channel.addMessage(channelMessage);
      });
      let previous = get(archive, 'today.previous');
      channel.set('searchedPreviousLogsUntilDate', moment.utc(previous.replace(/\//g, '-')));
    }).catch(error => {
      this.log('ajax-error', 'couldn\'t load archive document', error);
      throw(error);
    });
  },

  createUserChannel: function(space, userName) {
    var channel = UserChannel.create({
      space: space,
      name: userName,
      // TODO use IRC module
      sockethubChannelId: `irc://${space.get('server.hostname')}/${userName}`
    });

    this.joinChannel(space, channel, "person");
    space.get('channels').pushObject(channel);

    return channel;
  },

  removeChannel: function(space, channelName) {
    var channel = space.get('channels').findBy('name', channelName);
    this.leaveChannel(space, channel);

    space.get('channels').removeObject(channel);

    this.get('storage').saveSpace(space);

    return channel;
  },

  /*
   * @private
   *
   * Handles completed Sockethub actions:
   *
   *     - Successfully joined a channel
   *     - Channel attendance list response
   */
  handleSockethubCompleted(message) {
    this.log('sh_completed', message);

    switch(message['@type']) {
      case 'join':
        if (message['@type'] === 'join') {
          var space = this.get('spaces').findBy('sockethubPersonId', message.actor);
          if (!isEmpty(space)) {
            var channel = space.get('channels').findBy('sockethubChannelId', message.target);
            if (!isEmpty(channel)) {
              channel.set('connected', true);
              this.get('irc').observeChannel(space.get('sockethubPersonId'), channel.get('sockethubChannelId'));
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
  },

  /**
   * Handles incoming Sockethub messages:
   * - Attendance list for channel
   * - Another user joined or left a channel
   * - Received a channel message (normal or me/action)
   * - A channel topic was updated
   * @private
   */
  handleSockethubMessage(message) {
    this.log('message', 'SH message', message);

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
  },

  /**
   * Handles incoming Sockethub errors/failures
   * @private
   */
  handleSockethubFailure(message) {
    this.log('sh_failure', message);
  },

  /**
   * Utility function for easier logging
   * @private
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
