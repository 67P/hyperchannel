import Service, { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import { isPresent, isEmpty } from '@ember/utils';
import { get } from '@ember/object';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
import UserChannel from 'hyperchannel/models/user_channel';
import Message from 'hyperchannel/models/message';
import config from 'hyperchannel/config/environment';
import moment from 'moment';
import { storageFor as localStorageFor } from 'ember-local-storage';

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
  irc:  service('sockethub-irc'),
  xmpp: service('sockethub-xmpp'),

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
          console.debug('No space data found in RS. Adding default space...');
          this.storage.addDefaultSpace().then((data) => {
            this.connectAndAddSpace(data.space);
            this.instantiateChannels(data.space, data.channels);
            resolve();
          });
        } else {
          Object.keys(spaceData).forEach((id) => {
            const space = Space.create();
            space.setProperties({
              id: id,
              name: spaceData[id].name,
              protocol: spaceData[id].protocol,
              server: spaceData[id].server,
              botkaURL: spaceData[id].botkaURL
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
    this.getServiceForSockethubPlatform(space.get('protocol')).connect(space);
  },

  connectAndAddSpace(space) {
    this.connectServer(space);
    this.spaces.pushObject(space);
  },

  /**
   * Invokes the channel-join function on the appropriate transport service
   * @param {Space} space
   * @param {Channel} channel
   * @param {String} type - Type of channel. Can be "room" or "person"
   * @public
   */
  joinChannel: function(space, channel, type) {
    this.getServiceForSockethubPlatform(space.get('protocol')).join(space, channel, type);
  },

  /**
   * Invokes the send-message function on the appropriate transport service
   * @param {Space} space
   * @param {Channel} channel
   * @param {String} content
   * @public
   */
  transferMessage(space, channel, content) {
    const target = {
      '@id': channel.get('sockethubChannelId'),
      '@type': channel.get('isUserChannel') ? 'person' : 'room',
      displayName: channel.get('name')
    };
    this.getServiceForSockethubPlatform(space.get('protocol'))
      .transferMessage(space, target, content);
  },

  /**
   * Invokes the send-action-message function on the appropriate transport service
   * @public
   */
  transferMeMessage(space, target, content) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.irc.transferMeMessage(space, target, content);
        break;
    }
  },

  leaveChannel: function(space, channel) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.irc.leave(space, channel);
        break;
    }
  },

  changeTopic: function(space, channel, topic) {
    switch (space.get('protocol')) {
      case 'IRC':
        this.irc.changeTopic(space, channel, topic);
        break;
    }
  },

  updateChannelUserList(message) {
    let channel;
    switch(message.context) {
      case 'irc':
        channel = this.getChannelById(message.actor['@id']);
        break;
      case 'xmpp':
        channel = this.getChannel(message.target['@id'], message.actor['@id']);
        break;
    }

    if (channel) {
      channel.set('connected', true);
      if (Array.isArray(message.object.members)) {
        channel.set('userList', message.object.members);
      }
    }
  },

  addUserToChannelUserList(message) {
    const channel = this.getChannelById(message.target['@id']);
    if (channel) {
      channel.addUser(message.actor.displayName);
    }
  },

  removeUserFromChannelUserList(message) {
    // TODO handle user quit leaves (multiple channels)
    // e.g. target is `{ @type: 'service', @id: 'irc.freenode.net' }`
    const channel = this.getChannelById(message.target['@id']);
    if (channel) {
      channel.removeUser(message.actor.displayName);
    }
  },

  getChannelById(channelId) {
    // TODO handle multiple spaces with same hostname:
    // This method should return an array of channels for all spaces with the
    // same hostname

    const hostname = channelId.match(/(?:.+@)?(.+?)(?:\/|$)/)[1];

    const space = this.spaces.findBy('server.hostname', hostname);

    if (isEmpty(space)) {
      console.warn('Could not find space by hostname', hostname);
      return;
    }

    const channel = space.get('channels').findBy('sockethubChannelId', channelId);
    if (isEmpty(channel)) {
      console.warn('Could not find channel by sockethubChannelId', channelId);
      return;
    }

    return channel;
  },

  /**
   * @param {String} personId
   * @param {String} channelId
   */
  getChannel(personId, channelId) {
    const space = this.spaces.findBy('sockethubPersonId', personId);
    if (isEmpty(space)) {
      console.warn('Could not find space by sockethubPersonId', personId);
      return;
    }

    const channel = space.get('channels').findBy('sockethubChannelId', channelId);
    if (isEmpty(channel)) {
      console.warn('Could not find channel by sockethubChannelId', channelId);
      return;
    }

    return channel;
  },

  updateUsername(message) {
    if (typeof message.actor === 'object') {
      const actorId = message.actor['@id'];
      const space = this.spaces.findBy('sockethubPersonId', actorId);
      if (isPresent(space)) {
        space.updateUsername(message.target.displayName);
      }
    }
  },

  updateChannelTopic(message) {
    let hostname;
    if (typeof message.target === 'object') {
      hostname = message.target['@id'].match(/(.+)\//)[1];
    } else if (typeof message.actor === 'string') {
      hostname = message.actor.match(/.+@(.+)/)[1];
    }

    let space = this.spaces.findBy('server.hostname', hostname);

    if (!isEmpty(space)) {
      let channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);

      if (isEmpty(channel)) {
        console.warn('No channel for update topic message found. Creating it.', message);
        channel = this.createChannel(space, message.target['displayName']);
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

  instantiateChannels: function(space, channels) {
    channels.forEach((channelName) => {
      this.createChannel(space, channelName);
    });
  },

  createChannel: function(space, channelName) {
    const platform = this.getServiceForSockethubPlatform(space.get('protocol'));

    const channel = Channel.create({
      space: space,
      name: channelName,
      sockethubChannelId: platform.generateChannelId(space, channelName)
    });

    this.joinChannel(space, channel, "room");
    space.get('channels').pushObject(channel);

    // TODO Do we need this on startup? Could overwrite updates from remote.
    this.storage.saveSpace(space);

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

    return this.ajax.request(logsUrl, {
      type: 'GET',
      dataType: 'json'
    }).then(archive => {
      get(archive, 'today.messages').forEach((message) => {
        this.log('chat_message', message);

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
    const platform = this.getServiceForSockethubPlatform(space.get('protocol'));

    const channel = UserChannel.create({
      space: space,
      name: userName,
      sockethubChannelId: platform.generateChannelId(space, userName)
    });

    // TODO check if this is necesarry for XMPP,
    // because for IRC it is not
    this.joinChannel(space, channel, "person");
    space.get('channels').pushObject(channel);

    return channel;
  },

  removeChannel: function(space, channelName) {
    var channel = space.get('channels').findBy('name', channelName);
    this.leaveChannel(space, channel);

    space.get('channels').removeObject(channel);

    this.storage.saveSpace(space);

    return channel;
  },

  getServiceForSockethubPlatform(protocol) {
    return this.get(protocol.dasherize());
  },

  /*
   * @private
   *
   * Handles completed Sockethub actions:
   *
   *     - Successfully joined a channel
   */
  handleSockethubCompleted(message) {
    this.log(`${message.context}_completed`, message);

    switch(message['@type']) {
      case 'join':
        var space = this.spaces.findBy('sockethubPersonId', message.actor['@id']);

        // try to find space by older sockethubPersonId
        if (isEmpty(space)) {
          space = this.spaces.find((space) => {
            return space.get('previousSockethubPersonIds').includes(message.actor['@id']);
          });
        }

        if (!isEmpty(space)) {
          this.get(message.context).handleJoinCompleted(space, message);
        } else {
          console.warn('Could not find space for join message', message);
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
   * - The username/address changed
   * @private
   */
  handleSockethubMessage(message) {
    this.log(`${message.context}_message`, 'SH message', message);

    switch(message['@type']) {
      case 'observe':
        if (message.object['@type'] === 'attendance') {
          this.updateChannelUserList(message);
        }
        break;
      case 'join':
        this.handleChannelJoin(message);
        break;
      case 'leave':
        this.removeUserFromChannelUserList(message);
        break;
      case 'send':
        switch(message.object['@type']) {
          case 'message':
          case 'me':
            this.getServiceForSockethubPlatform(message.context).addMessageToChannel(message);
            break;
        }
        break;
      case 'update':
        switch(message.object['@type']) {
          case 'topic':
            this.updateChannelTopic(message);
            break;
          case 'address':
            this.updateUsername(message);
            break;
          case 'presence':
            this.xmpp.handlePresenceUpdate(message);
            break;
          case 'error':
            console.warn('Got error update message', message.actor['@id'], message.object.content);
            break;
        }
        break;
    }
  },

  /**
   * Handles the various checks assosciated with channel joins
   * @private
   */
  handleChannelJoin(message) {
    if (message.object['@type'] && (message.object['@type'] === 'error')) {
      // failed to join a channel
      let channel = this.getChannel(message.target['@id'], message.actor['@id']);
      if (isPresent(channel)) {
        channel.set('connected', false);
      } else {
        console.warn('Could not find channel for error message', message);
      }
    } else {
      this.addUserToChannelUserList(message);
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
    this.logger.log(...arguments);
  }
});
