import Service, { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import extend from 'extend';
import channelMessageFromSockethubObject from 'hyperchannel/utils/channel-message-from-sockethub-object';

/**
 * Build an activity object for sending to Sockethub
 *
 * @param {Space} space - space model the activity belongs to
 * @param {Object} details - the activity details
 * @returns {Object} the activity object
 * @private
 */
function buildActivityObject(space, details) {
  let baseObject = {
    context: 'irc',
    actor: space.get('sockethubPersonId')
  };

  return extend({}, baseObject, details);
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
 * This service provides helpers for SocketHub IRC communications
 * @module hyperchannel/services/sockethub-irc
 */
export default Service.extend({

  logger: service(),
  coms: service(),

  /**
   * - Creates an ActivityStreams person object for
   *   future use
   * - Emits credentials for future IRC server messages,
   *   like e.g. `join`
   * @public
   */
  connect(space) {
    let actorObject = {
      '@id': space.get('sockethubPersonId'),
      '@type': "person",
      displayName: space.get('server.nickname')
    };

    this.sockethub.ActivityStreams.Object.create(
      actorObject
    );

    let credentials = buildActivityObject(space, {
      object: {
        '@type': 'credentials',
        nick: space.get('server.nickname'),
        server: space.get('server.hostname'),
        port: parseInt(space.get('server.port'), 10),
        secure: space.get('server.secure')
      }
    });

    this.log('irc', 'connecting to IRC network', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  handleJoinCompleted(space, message) {
    var channel = space.get('channels').findBy('sockethubChannelId', message.target['@id']);
    if (channel) {
      this.observeChannel(space, channel);
    }
  },

  /**
   * Join a channel/room
   * @public
   */
  join(space, channel, type) {
    switch(type) {
      case 'room':
        this.sockethub.ActivityStreams.Object.create({
          '@type': type,
          '@id': channel.get('sockethubChannelId'),
          displayName: channel.get('name')
        });

        var joinMsg = buildActivityObject(space, {
          '@type': 'join',
          target: channel.get('sockethubChannelId'),
          object: {}
        });

        this.log('irc', 'joining channel', joinMsg);
        this.sockethub.socket.emit('message', joinMsg);
        break;
      case 'person':
        channel.set('connected', true);
        break;
    }
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

  /**
   * Send an action chat message to a channel
   * @public
   */
  transferMeMessage(space, target, content) {
    let message = buildMessageObject(space, target, content, 'me');

    this.log('send', 'sending message job', message);
    this.sockethub.socket.emit('message', message);
  },

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel(message) {
    const hostname = message.actor['@id'].match(/irc:\/\/.+@(.+)/)[1];
    const space = this.get('coms.spaces').findBy('server.hostname', hostname);

    if (isEmpty(space)) {
      console.warn('Could not find space for message', message);
      return;
    }

    const channel = this.getChannelForMessage(space, message);
    const channelMessage = channelMessageFromSockethubObject(message);

    channel.addMessage(channelMessage);
  },

  /**
   * Leave a channel
   * @public
   */
  leave(space, channel) {
    if (!channel.get('isUserChannel')) {
      // TODO Do we really need to create this room for leaving? It should
      // already have been created when joining.
      this.sockethub.ActivityStreams.Object.create({
        '@type': "room",
        '@id': channel.get('sockethubChannelId'),
        displayName: channel.get('name')
      });

      let leaveMsg = buildActivityObject(space, {
        '@type': 'leave',
        target: channel.get('sockethubChannelId'),
        object: {}
      });

      this.log('leave', 'leaving channel', leaveMsg);
      this.sockethub.socket.emit('message', leaveMsg);
    }
  },


  /**
   * Send a channel topic change
   * @public
   */
  changeTopic(space, channel, topic) {
    let topicMsg = buildActivityObject(space, {
      '@type': 'update',
      target: channel.get('sockethubChannelId'),
      object: {
        '@type': 'topic',
        topic: topic
      }
    });

    this.sockethub.socket.emit('message', topicMsg);
  },

  /**
   * Ask for a channel's attendance list (users currently joined)
   * @public
   */
  observeChannel(space, channel) {
    let observeMsg = buildActivityObject(space, {
      '@type': 'observe',
      target: channel.get('sockethubChannelId'),
      object: {
        '@type': 'attendance'
      }
    });

    this.log('irc', 'asking for attendance list', observeMsg);
    this.sockethub.socket.emit('message', observeMsg);
  },

  /**
   * Generate a Sockethub Channel ID.
   *
   * @param {Space} space
   * @param {String} channelName - name of the channel
   * @returns {String} Sockethub channel ID
   * @public
   */
  generateChannelId(space, channelName) {
    return `irc://${space.get('server.hostname')}/${channelName}`;
  },

  /**
   * Get the channel for the given space and message.
   *
   * @param {Space} space
   * @param {Object} message
   * @returns {Channel} channel
   * @public
   */
  getChannelForMessage(space, message) {
    let targetChannelName, channel;

    if (space.get('userNickname') === message.target.displayName) {
      // direct message
      targetChannelName = message.actor.displayName || message.actor['@id'];

      channel = space.get('channels').findBy('name', targetChannelName);
      if (!channel) {
        channel = this.coms.createUserChannel(space, targetChannelName);
      }
    } else {
      // channel message
      targetChannelName = message.target.displayName;

      channel = space.get('channels').findBy('name', targetChannelName);
      if (!channel) {
        channel = this.coms.createChannel(space, targetChannelName);
      }
    }

    return channel;
  },

  /**
   * Utility function for easier logging
   * @protected
   */
  log() {
    this.logger.log(...arguments);
  }

});
