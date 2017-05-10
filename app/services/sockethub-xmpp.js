import Ember from 'ember';

const {
  inject: {
    service
  },
  isEmpty
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
        port: space.get('server.port'),
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
    var channel = space.get('channels').findBy('sockethubChannelId', message.target);
    if (!isEmpty(channel)) {
      channel.set('connected', true);
    }
  },

  /**
   * Join a channel/room
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
      target: channel.get('sockethubChannelId'),
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
   * Utility function for easier logging
   * @private
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
