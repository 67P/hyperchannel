import Ember from 'ember';

const {
  inject: {
    service
  }
} = Ember;

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

  /**
   * Utility function for easier logging
   * @private
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
