import Service, { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import UserChannel from 'hyperchannel/models/user_channel';
import channelMessageFromSockethubObject from 'hyperchannel/utils/channel-message-from-sockethub-object';

/**
 * Build an activity object for sending to Sockethub
 *
 * @param {Account} account - account model the activity belongs to
 * @param {Object} details - the activity details
 * @returns {Object} the activity object
 * @private
 */
function buildActivityObject(account, details) {
  let baseObject = {
    context: 'xmpp',
    actor: account.sockethubPersonId
  };

  return { ...baseObject, ...details };
}

/**
 * Build a message object
 *
 * @param {Account} account - Account model instance
 * @param {String} target - Where to send the message to (channelId)
 * @param {String} content - The message itself
 * @param {String} id - A locally generated message ID
 * @param {String} [type] - Can be either 'message' or 'me'
 * @returns {Object} The activity object
 */
function buildMessageObject(account, target, message) {
  const job = buildActivityObject(account, {
    type: 'send',
    target: target,
    object: {
      type: 'message',
      id: message.id,
      content: message.content
    }
  });

  if (message.replaceId) {
    job.object['xmpp:replace'] = { id: message.replaceId };
  }

  return job;
}

/**
 * This service provides helpers for SocketHub XMPP communications
 * @class hyperchannel/services/sockethub-xmpp
 */
export default class SockethubXmppService extends Service {

  @service logger;
  @service coms;

  connectWithCredentials (userAddress, password) {
    const sockethubPersonId = `${userAddress}/hyperchannel`;

    this.sockethub.ActivityStreams.Object.create({
      id: sockethubPersonId,
      type: 'person',
      name: userAddress.split('@')[0],
    });

    const credentialsJob = {
      type: 'credentials',
      context: 'xmpp',
      actor: sockethubPersonId,
      object: {
        type: 'credentials',
        username: userAddress,
        password: password,
        resource: 'hyperchannel'
      }
    };

    const connectJob = {
      type: 'connect',
      context: 'xmpp',
      actor: sockethubPersonId
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethub.socket.emit('credentials', credentialsJob, (err) => {
      if (err) { this.log('failed to store credentials: ', err); }
    });
    this.sockethub.socket.emit('message', connectJob, (message) => {
      if (message.error) { this.log('failed to connect to xmpp server: ', message); }
      else { this.coms.handleSockethubMessage(message); }
    });
  }

  /**
   * Connect to an XMPP server
   *
   * @param {Account} account
   * @public
   */
  connect (account) {
    const actor = account.sockethubPersonId;

    this.sockethub.ActivityStreams.Object.create({
      id: actor,
      type: 'person',
      name: account.nickname
    });

    const credentialsJob = {
      type: 'credentials',
      context: 'xmpp',
      actor: actor,
      object: {
        type: 'credentials',
        username: account.username, // JID
        password: account.password,
        resource: 'hyperchannel'
      }
    };

    const connectJob = {
      type: 'connect',
      context: 'xmpp',
      actor: actor
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethub.socket.emit('credentials', credentialsJob, (err) => {
      if (err) { this.log('failed to store credentials: ', err); }
    });
    this.sockethub.socket.emit('message', connectJob, (message) => {
      if (message.error) { this.log('failed to connect to xmpp server: ', message); }
      else { this.coms.handleSockethubMessage(message); }
    });
  }

  handleJoinCompleted (message) {
    const channelId = message.target.id.split('/')[0];
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
      type: type,
      id: channel.sockethubChannelId,
      name: channel.name
    });

    let joinMsg = buildActivityObject(channel.account, {
      type: 'join',
      actor: {
        type: 'person',
        id: channel.sockethubPersonId,
        name: channel.account.nickname
      },
      target: channel.sockethubChannelId
    });

    this.log('xmpp', 'joining channel', joinMsg);
    this.sockethub.socket.emit('message', joinMsg, this.coms.handleChannelJoin.bind(this.coms));
  }

  /**
   * Send a chat message to a channel
   *
   * @param {Object} target - Channel to send message to
   * @param {Message} - Message instance
   * @public
   */
  transferMessage (target, message) {
    const channel = this.coms.getChannel(target.id);
    const messageJob = buildMessageObject(channel.account, target, message);

    this.log('send', 'sending message job', messageJob);
    this.sockethub.socket.emit('message', messageJob, this.coms.handleSockethubMessage.bind(this.coms));
  }

  handlePresenceUpdate (message) {
    if (message.target.type === 'room') {
      const targetChannelId = message.target.id;
      const channel = this.coms.getChannel(targetChannelId);

      if (channel) {
        if (message.object.presence === 'offline') {
          channel.removeUser(message.actor.name);
        } else {
          channel.addUser(message.actor.name);
        }
      }
    } else if (message.actor.type === 'person' && message.actor.id.match(/\/(.+)$/)) {
      const sockethubActorId = message.actor.id;
      const targetChannelId = sockethubActorId.match(/^(.+)\//)[1];
      const channel = this.coms.getChannel(targetChannelId);
      const username = sockethubActorId.match(/\/(.+)$/)[1];

      if (channel) {
        if (message.object.presence === 'unavailable') {
          channel.removeUser(username);
        } else {
          channel.addUser(username);
        }
      }
    } else {
      this.log('xmpp', 'presence update from contact:', message.actor.id, message.object.presence, message.object.status);
    }
  }

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel (message) {
    if (isEmpty(message.object.content)) return;

    const channel = this.findOrCreateChannelForMessage(message);

    // TODO implement message carbons
    // https://xmpp.org/extensions/xep-0280.html
    if (message.actor.name &&
       (message.actor.name === channel.account.nickname)) {
      const pendingConfirmed = channel.confirmPendingMessage(message.object.content);
      if (pendingConfirmed) return;
    }

    const channelMessage = channelMessageFromSockethubObject(message);
    channel.addMessage(channelMessage);
  }

  leave (channel) {
    if (!channel.isUserChannel) {
      const leaveMsg = buildActivityObject(channel.account, {
        type: 'leave',
        target: channel.sockethubChannelId,
        object: {}
      });

      this.log('leave', 'leaving channel', leaveMsg);
      this.sockethub.socket.emit('message', leaveMsg, this.coms.handleSockethubMessage.bind(this.coms));
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
      type: 'observe',
      target: {
        id: channel.sockethubChannelId,
        type: 'room'
      },
      object: {
        type: 'attendance'
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
  findOrCreateChannelForMessage (message) {
    const targetChannelId = message.target.id;
    let channel;

    if (message.target.type === 'room') {
      channel = this.coms.channels.findBy('sockethubChannelId', targetChannelId);

      // TODO Find account for new channel by sockethubPersonId
      if (!channel) {
        console.warn('Received message for unknown channel', message);
        // channel = this.coms.createChannel(space, targetChannelId);
      }
    } else {
      channel = this.coms.channels.findBy('sockethubChannelId', message.actor.id);

      if (!channel) {
        const account = this.coms.accounts.findBy('sockethubPersonId', message.target.id);
        if (!account) console.warn('Received direct message for unknown account', message);
        channel = this.coms.createUserChannel(account, message.actor.id);
      }
    }

    return channel;
  }

  /**
   * Create a direct-message channel
   *
   * @param {Account} account
   * @param {String} sockethub actor ID
   * @returns {UserChannel} user channel
   * @public
   */
  createUserChannel (account, sockethubActorId) {
    const channel = new UserChannel({
      account: account,
      name: sockethubActorId, // e.g. kosmos-dev@kosmos.chat/jimmy
      displayName: sockethubActorId.match(/\/(.+)$/)[1],
      connected: true
    });
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
