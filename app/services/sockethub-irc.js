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
   * @protected
   * Utility function for easier logging
   */
  log() {
    this.get('logger').log(...arguments);
  }
});
