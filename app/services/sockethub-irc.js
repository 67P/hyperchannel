import Ember from 'ember';

const {
  inject: {
    service
  }
} = Ember;

/**
 * This service provides helpers for SocketHub IRC communications
 * @module hyperchannel/services/sockethub-irc
 */
export default Ember.Service.extend({

  logger: service(),

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
    console.debug('actor object', actorObject);

    this.sockethub.ActivityStreams.Object.create(
      actorObject
    );

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

    this.log('irc', 'connecting to IRC network', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  /**
   * Join a channel/room
   * @public
   */
  join: function(space, channel, type) {
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

    this.log('irc', 'joining channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },

  /**
   * Send a chat message to a channel
   * @public
   */
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

    this.log('send', 'sending message job', job);
    this.sockethub.socket.emit('message', job);
  },

  /**
   * Send an action chat message to a channel
   * @public
   */
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

    this.log('send', 'sending message job', job);
    this.sockethub.socket.emit('message', job);
  },

  /**
   * Leave a channel
   * @public
   */
  leave(space, channel) {
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

    this.log('leave', 'leaving channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  },


  /**
   * Send a channel topic change
   * @public
   */
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

  /**
   * Ask for a channel's attendance list (users currently joined)
   * @public
   */
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

    this.log('irc', 'asking for attendance list', observeMsg);
    this.sockethub.socket.emit('message', observeMsg);
  },

  /**
   * Utility function for easier logging
   * @protected
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
