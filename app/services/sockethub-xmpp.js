import Service, { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import UserChannel from 'hyperchannel/models/user_channel';
import channelMessageFromSockethubObject from 'hyperchannel/utils/channel-message-from-sockethub-object';

/**
 * This service provides helpers for SocketHub XMPP communications
 * @class hyperchannel/services/sockethub-xmpp
 */
export default class SockethubXmppService extends Service {

  @service sockethub;
  @service logger;
  @service coms;

  get sockethubClient () {
    return this.sockethub.client;
  }

  /**
   * Build an activity object for sending to Sockethub
   * @private
   */
  buildActivityObject (account, details) {
    let baseObject = {
      '@context': this.sockethub.contextFor('xmpp'),
      actor: { id: account.sockethubPersonId, type: 'person' }
    };

    return { ...baseObject, ...details };
  }

  /**
   * Build a message object
   * @private
   */
  buildMessageObject (account, target, message) {
    const job = this.buildActivityObject(account, {
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

  connectWithCredentials (userAddress, password, callback) {
    const sockethubPersonId = `${userAddress}/hyperchannel`;

    const credentialsJob = {
      '@context': this.sockethub.contextFor('xmpp'),
      type: 'credentials',
      actor: { id: sockethubPersonId, type: 'person' },
      object: {
        type: 'credentials',
        userAddress,
        password: password,
        resource: 'hyperchannel'
      }
    };

    const connectJob = {
      '@context': this.sockethub.contextFor('xmpp'),
      type: 'connect',
      actor: { id: sockethubPersonId, type: 'person' }
    };

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethubClient.socket.emit('credentials', credentialsJob, (msg) => {
      const error = (msg && typeof msg === 'object') ? msg.error : msg;
      if (error) { this.log('xmpp', 'failed to store credentials: ', error); }
    });
    this.sockethubClient.socket.emit('message', connectJob, callback);
  }

  /**
   * Connect to an XMPP server
   *
   * @param {Account} account
   * @public
   */
  connect (account) {
    const credentialsJob = this.buildActivityObject(account, {
      type: 'credentials',
      object: {
        type: 'credentials',
        userAddress: account.username, // JID
        password: account.password,
        resource: 'hyperchannel'
      }
    });

    const connectJob = this.buildActivityObject(account, {
      type: 'connect'
    });

    this.log('xmpp', 'connecting to XMPP server...');
    this.sockethubClient.socket.emit('credentials', credentialsJob, (msg) => {
      const error = (msg && typeof msg === 'object') ? msg.error : msg;
      if (error) { this.log('xmpp', 'failed to store credentials: ', error); }
    });
    this.sockethubClient.socket.emit('message', connectJob, (message) => {
      if (message.error) { this.log('xmpp', 'failed to connect to XMPP server: ', message); }
      else { this.coms.handleSockethubMessage(message); }
    });
  }

  handleJoinCompleted (message) {
    const channelId = message.target.id.split('/')[0];
    const channel = this.coms.channels.find(ch => ch.sockethubChannelId === channelId);
    if (channel) {
      this.queryRoomInfo(channel);
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
    let joinMsg = this.buildActivityObject(channel.account, {
      type: 'join',
      actor: {
        type: 'person',
        id: channel.sockethubPersonId,
        name: channel.account.nickname
      },
      target: { id: channel.sockethubChannelId, type: type, name: channel.name }
    });

    this.log('xmpp', 'joining channel', joinMsg);
    this.sockethubClient.socket.emit('message', joinMsg, this.handleJoinCompleted.bind(this));
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
    const messageJob = this.buildMessageObject(channel.account, target, message);

    this.log('send', 'sending message job', messageJob);
    this.sockethubClient.socket.emit('message', messageJob);
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
    }
    this.log('xmpp', 'Presence update:', message.actor.id, message.object.presence, message.object.status);
  }

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel (message) {
    if (isEmpty(message.object.content)) return;

    const channel = this.findOrCreateChannelForMessage(message);

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
      const leaveMsg = this.buildActivityObject(channel.account, {
        type: 'leave',
        target: { id: channel.sockethubChannelId, type: 'room' }
      });

      this.log('leave', 'leaving channel', leaveMsg);
      this.sockethubClient.socket.emit('message', leaveMsg, (message) => {
        if (message.error) {
          this.log('leave', 'failed to leave channel: ', message);
        }
      });
    }
  }

  /**
   * Ask for a channel's room info using service discovery
   *
   * @param {Channel} channel
   * @public
   */
  queryRoomInfo (channel) {
    let msg = this.buildActivityObject(channel.account, {
      type: 'query',
      target: {
        id: channel.sockethubChannelId,
        type: 'room'
      },
      object: {
        type: 'room-info'
      }
    });

    this.log('xmpp', 'asking for room info', msg);
    this.sockethubClient.socket.emit('message', msg, (response) => {
      if (response && response.error) {
        console.warn('[xmpp] query (room-info) rejected by Sockethub:', response.error);
      }
    });
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
      channel = this.coms.channels.find(ch => ch.sockethubChannelId === targetChannelId);

      if (!channel) {
        console.warn('Received message for unknown channel', message);
        return;
      }
    } else {
      channel = this.coms.channels.find(ch => ch.sockethubChannelId === message.actor.id);

      if (!channel) {
        const account = this.coms.accounts.find(acc => acc.sockethubPersonId === message.target.id);
        if (!account) {
          console.warn('Received direct message for unknown account', message);
          return;
        }
        channel = this.coms.createUserChannel(account, message.actor.id);
      }
    }

    return channel;
  }

  /**
   * Create a direct-message channel
   *
   * @param {Account} account
   * @param {String} sockethubActorId
   * @returns {UserChannel} user channel
   * @public
   */
  createUserChannel (account, sockethubActorId) {
    const channel = new UserChannel({
      account: account,
      name: sockethubActorId,
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
