/**
 * @module sockethub-irc
 *
 * This service provides helpers for SocketHub IRC communications
 */

import Ember from 'ember';

const {
  inject: {
    service
  }
} = Ember;

export default Ember.Service.extend({

  logger: service(),
  coms: service(),

  /**
   * @public
   * @method connect
   *
   * - Creates an ActivityStreams person object for
   *   future use
   * - Emits credentials for future IRC server messages,
   *   like e.g. `join`
   */
  connect(space) {
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

    this.log('irc', 'connecting to IRC network', credentials);
    this.sockethub.socket.emit('credentials', credentials);
  },

  /**
   * @public
   * @method join
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
   * @public
   * @method transferMessage
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
   * @public
   * @method transferMeMessage
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
   * @public
   * @method leaveChannel
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
   * @public
   * @method changeTopic
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
   * @public
   * @method observeChannel
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
   * @protected
   * Utility function for easier logging
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
