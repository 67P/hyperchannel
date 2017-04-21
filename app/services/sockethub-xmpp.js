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
    this.sockethub.ActivityStreams.Object.create({
      '@id': space.get('sockethubPersonId'),
      '@type': "person",
      displayName: space.get('server.nickname'),
    });

    let job = {
      actor: space.get('sockethubPersonId'),
      context: 'xmpp',
      object: {
        '@type': 'credentials',
        username: space.get('server.username'),
        password: space.get('server.password'),
        server: space.get('server.hostname'),
        port: space.get('server.port'),
        // secure: space.get('server.secure'),
        resource: 'laptop'
      }
    };

    this.log('xmpp', 'connecting to XMPP server', job);
    this.sockethub.socket.emit('connect', job);
  },

  /**
   * Utility function for easier logging
   * @private
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
