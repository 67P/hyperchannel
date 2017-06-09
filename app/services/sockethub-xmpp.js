import Ember from 'ember';
import Message from 'hyperchannel/models/message';

const {
  inject: {
    service
  },
  isEmpty,
  Logger
} = Ember;

/**
 * Build an activity object for sending to Sockethub
 *
 * @param space {Space} space model the activity belongs to
 * @param details {Object} the activity details
 * @returns {Object} the activity object
 * @private
 */
function buildActivityObject(space, details) {
  let baseObject = {
    context: 'xmpp',
    actor: space.get('sockethubPersonId')
  };

  return Ember.$.extend({}, baseObject, details);
}

/**
 * Build a message object
 *
 * @param space {Space} space model instance
 * @param target {String} where to send the message to (channelId)
 * @param content {String} the message itself
 * @param type {String} can be either 'message' or 'me'
 * @returns {Object} the activity object
 */
function buildMessageObject(space, target, content, type='message') {
  return buildActivityObject(space, {
    '@type': 'send',
    target: target,
    object: {
      '@type': type,
      content: content
    }
  });
}

/**
 * This service provides helpers for SocketHub XMPP communications
 * @module hyperchannel/services/sockethub-xmpp
 */
export default Ember.Service.extend({

  logger: service(),
  coms: service(),

  /**
   * @public
   */
  connect(space) {
    let actor = space.get('sockethubPersonId');

    this.sockethub.ActivityStreams.Object.create({
      '@id': actor,
      '@type': "person",
      displayName: space.get('server.nickname'),
    });

    let credentialsJob = {
      actor: actor,
      context: 'xmpp',
      object: {
        '@type': 'credentials',
        username: space.get('server.username'),
        password: space.get('server.password'),
        server: space.get('server.hostname'),
        port: parseInt(space.get('server.port'), 10),
        resource: 'hyperchannel'
      }
    };

    let connectJob = {
      '@type': 'connect',
      context: 'xmpp',
      actor: actor
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethub.socket.emit('credentials', credentialsJob);
    this.sockethub.socket.emit('message', connectJob);
  },

  handleJoinCompleted(space, message) {
    const channelId = message.target['@id'].split('/')[0];
    const channel = space.get('channels').findBy('sockethubChannelId', channelId);
    if (!isEmpty(channel)) {
      channel.set('connected', true);
    } else {
      Logger.warn('Could not find channel for join message', message);
    }
  },

  /**
   * Join a channel/room
   *
   * @param {Space} space
   * @param {Channel} channel
   * @param {String} type - Type of channel. Can be "room" or "person".
   * @public
   */
  join(space, channel, type) {
    this.sockethub.ActivityStreams.Object.create({
      '@type': type,
      '@id': channel.get('sockethubChannelId'),
      displayName: channel.get('name')
    });

    let joinMsg = buildActivityObject(space, {
      '@type': 'join',
      target: {
        '@id': channel.get('sockethubChannelId'),
        '@type': type
      },
      object: {
        '@type': 'person',
        '@id': space.get('sockethubPersonId'),
        displayName: space.get('server.nickname')
      }
    });

    this.log('xmpp', 'joining channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },

  /**
   * Send a chat message to a channel
   * @public
   */
  transferMessage(space, target, content) {
    let message = buildMessageObject(space, target, content);

    this.log('send', 'sending message job', message);
    this.sockethub.socket.emit('message', message);
  },

  handlePresenceUpdate(message) {
    if (message.target['@type'] === 'room') {
      const targetChannelId = message.target['@id']
      const space = this.get('coms.spaces').find(function(space) {
        return space.get('sockethubChannelIds').includes(targetChannelId);
      });
      const channel = space.get('channels').findBy('sockethubChannelId', targetChannelId);

      if (channel) {
        if (message.object.presence === 'offline') {
          channel.removeUser(message.actor.displayName);
        } else {
          channel.addUser(message.actor.displayName);
        }
      }
    } else {
      Logger.debug('Presence update:', message.actor['@id'], message.object.presence, message.object.status);
    }
  },

  /**
   * Add an incoming message to a channel
   * @public
   */
  addMessageToChannel(message) {
    if (isEmpty(message.object.content)) {
      return;
    }

    const targetChannelId = message.target['@id'];
    let space;

    if (message.target['@type'] === 'room') {
      space = this.get('coms.spaces').find(function(space) {
        return space.get('sockethubChannelIds').includes(targetChannelId);
      });
    } else {
      space = this.get('coms.spaces').findBy('sockethubPersonId', targetChannelId);
    }

    if (isEmpty(space)) {
      Logger.warn('Could not find space for message', message);
      return;
    }

    let channel;
    if (message.target['@type'] === 'room') {
      channel = space.get('channels').findBy('sockethubChannelId', targetChannelId);
      if (!channel) {
        channel = this.get('coms').createChannel(space, targetChannelId);
      }
    } else {
      channel = space.get('channels').findBy('sockethubChannelId', message.actor['@id']);
      if (!channel) {
        channel = this.get('coms').createUserChannel(space, message.actor['@id']);
      }
    }

    let messageType;
    if (message.object['@type'] === 'me') {
      messageType = 'message-chat-me';
    } else {
      messageType = 'message-chat';
    }

    const channelMessage = Message.create({
      type: messageType,
      date: new Date(message.published),
      nickname: message.actor.displayName || message.actor['@id'],
      content: message.object.content
    });

    // TODO should check for message and update sent status if exists
    if (channelMessage.get('nickname') !== space.get('userNickname')) {
      channel.addMessage(channelMessage);
    }
  },

  /**
   * Utility function for easier logging
   * @private
   */
  log() {
    this.get('logger').log(...arguments);
  },

  generateChannelId(space, channelName) {
    return channelName;
  }

});
