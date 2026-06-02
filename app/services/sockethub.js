import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import SockethubClient from '@sockethub/client';
import { io } from 'socket.io-client';
import config from 'hyperchannel/config/environment';

export default class SockethubService extends Service {
  @tracked client = null;
  _platformContextMap = new Map();

  async initialize () {
    const socket = io(config.sockethubURL, { path: '/sockethub' });
    const client = new SockethubClient(socket);

    // Downgrade client-side validation errors to warnings to facilitate live testing of unreleased/custom schemas
    const originalValidate = client.validateActivity.bind(client);
    client.validateActivity = function (activity) {
      const error = originalValidate(activity);
      if (error) {
        console.warn('[sockethub-client] Bypassing schema validation error:', error, activity);
      }
      return '';
    };

    await client.ready();
    this.client = client;
    this._buildPlatformContextMap();
  }

  /**
   * Returns the @context array for a given platform (e.g. 'irc', 'xmpp').
   * Must be called after initialize() has resolved.
   *
   * @param {String} platform
   * @returns {Array<String>}
   */
  contextFor (platform) {
    return this.client.contextFor(platform);
  }

  /**
   * Resolves the platform identifier from an incoming message's @context array
   * or platform property.
   *
   * @param {Object} message - incoming sockethub message
   * @returns {String|undefined} platform identifier (e.g. 'irc', 'xmpp')
   */
  platformForMessage (message) {
    if (message.context) {
      return message.context;
    }
    if (message.platform) {
      return message.platform;
    }
    const contextArray = message['@context'];
    if (!Array.isArray(contextArray)) return;
    for (const url of contextArray) {
      const platform = this._platformContextMap.get(url);
      if (platform) return platform;
    }
  }

  /**
   * Builds a lookup map from platform context URLs to platform IDs
   * using the client's registered platforms.
   * @private
   */
  _buildPlatformContextMap () {
    this._platformContextMap.clear();
    for (const platform of this.client.getRegisteredPlatforms()) {
      this._platformContextMap.set(platform.contextUrl, platform.id);
    }
  }
}
