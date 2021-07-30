import Service, { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import extend from 'extend';
import channelMessageFromSockethubObject from 'hyperchannel/utils/channel-message-from-sockethub-object';

/**
 * Build an activity object for sending to Sockethub
 *
 * @param account {Account} account model the activity belongs to
 * @param details {Object} the activity details
 * @returns {Object} the activity object
 * @private
 */
function buildActivityObject(account, details) {
  let baseObject = {
    context: 'xmpp',
    actor: account.sockethubPersonId
  };

  return extend({}, baseObject, details);
}

/**
 * Build a message object
 *
 * @param account {Account} account model instance
 * @param target {String} where to send the message to (channelId)
 * @param content {String} the message itself
 * @param type {String} can be either 'message' or 'me'
 * @returns {Object} the activity object
 */
function buildMessageObject(account, target, content, type='message') {
  return buildActivityObject(account, {
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
 * @class hyperchannel/services/sockethub-xmpp
 */
export default class SockethubXmppService extends Service {

  @service logger;
  @service coms;

  connectWithCredentials (userAddress, password) {
    this.sockethub.ActivityStreams.Object.create({
      '@id': userAddress,
      '@type': "person",
      displayName: userAddress.split('@')[0],
    });

    const credentialsJob = {
      actor: userAddress,
      context: 'xmpp',
      object: {
        '@type': 'credentials',
        username: userAddress,
        password: password,
        resource: 'hyperchannel'
      }
    };

    const connectJob = {
      '@type': 'connect', context: 'xmpp', actor: userAddress
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethub.socket.emit('credentials', credentialsJob);
    this.sockethub.socket.emit('message', connectJob);
  }

  /**
   * @public
   */
  connect (account) {
    const actor = account.sockethubPersonId;

    this.sockethub.ActivityStreams.Object.create({
      '@id': actor,
      '@type': "person",
      displayName: account.nickname,
    });

    const credentialsJob = {
      actor: actor,
      context: 'xmpp',
      object: {
        '@type': 'credentials',
        username: account.username, // JID
        password: account.password,
        resource: 'hyperchannel'
      }
    };

    const connectJob = {
      '@type': 'connect', context: 'xmpp', actor: actor
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethub.socket.emit('credentials', credentialsJob);
    this.sockethub.socket.emit('message', connectJob);
  }

  handleJoinCompleted (message) {
    const channelId = message.target['@id'].split('/')[0];
    const channel = this.coms.channels.findBy('sockethubChannelId', channelId);
    if (channel) {
      this.observeChannel(channel);
    } else {
      console.warn('Could not find channel for join message', message);
    }
  }

  /**
   * Join a channel/room
   *
   * @param {Channel} channel
   * @param {String} type - Type of channel. Can be "room" or "person".
   * @public
   */
  join (channel, type) {
    this.sockethub.ActivityStreams.Object.create({
      '@type': type,
      '@id': channel.sockethubChannelId,
      displayName: channel.name
    });

    let joinMsg = buildActivityObject(channel.account, {
      '@type': 'join',
      actor: {
        '@type': 'person',
        '@id': channel.sockethubPersonId,
        displayName: channel.account.nickname
      },
      target: {
        '@id': channel.sockethubChannelId,
        '@type': type
      }
    });

    this.log('xmpp', 'joining channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg);
  }

  /**
   * Send a chat message to a channel
   * @public
   */
  transferMessage (target, content) {
    const channel = this.coms.getChannel(target['@id']);
    const message = buildMessageObject(channel.account, target, content);

    this.log('send', 'sending message job', message);
    this.sockethub.socket.emit('message', message);
  }

  handlePresenceUpdate (message) {
    if (message.target['@type'] === 'room') {
      const targetChannelId = message.target['@id'];
      const channel = this.coms.getChannel(targetChannelId);

      if (channel) {
        if (message.object.presence === 'offline') {
          channel.removeUser(message.actor.displayName);
        } else {
          channel.addUser(message.actor.displayName);
        }
      }
    } else {
      this.log('xmpp', 'presence update from contact:', message.actor['@id'], message.object.presence, message.object.status);
    }
  }

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel (message) {
    if (isEmpty(message.object.content)) return;

    const channel = this.getChannelForMessage(message);
    const channelMessage = channelMessageFromSockethubObject(message);

    // TODO should check for message and update sent status if exists
    if (channelMessage.nickname !== channel.account.nickname) {
      channel.addMessage(channelMessage);
    }
  }

  /**
   * Ask for a channel's attendance list (users currently joined)
   *
   * @param {Channel} channel
   * @public
   */
  observeChannel (channel) {
    let observeMsg = buildActivityObject(channel.account, {
      '@type': 'observe',
      target: channel.sockethubChannelId,
      object: {
        '@type': 'attendance'
      }
    });

    this.log('xmpp', 'asking for attendance list', observeMsg);
    this.sockethub.socket.emit('message', observeMsg);
  }

  /**
   * Get the channel for the given message.
   *
   * @param {Object} message
   * @returns {Channel} channel
   * @public
   */
  getChannelForMessage (message) {
    const targetChannelId = message.target['@id'];
    let channel;

    if (message.target['@type'] === 'room') {
      channel = this.coms.channels.findBy('sockethubChannelId', targetChannelId);
      // TODO Find account for new channel by sockerhubPersonId
      console.warn('Received message for unknown channel', message);
      // if (!channel) {
      //   channel = this.coms.createChannel(space, targetChannelId);
      // }
    } else {
      channel = this.coms.channels.findBy('sockethubChannelId', message.actor['@id']);
      // TODO
      console.warn('Received message for unknown user channel', message);
      // if (!channel) {
      //   channel = this.coms.createUserChannel(space, message.actor['@id']);
      // }
    }

    return channel;
  }

  /**
   * Utility function for easier logging
   * @private
   */
  log () {
    this.logger.log(...arguments);
  }

}
