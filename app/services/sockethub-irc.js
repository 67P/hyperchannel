import Service, { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import UserChannel from 'hyperchannel/models/user_channel';
import channelMessageFromSockethubObject from 'hyperchannel/utils/channel-message-from-sockethub-object';

/**
 * This service provides helpers for SocketHub IRC communications
 * @class hyperchannel/services/sockethub-irc
 */
export default class SockethubIrcService extends Service {

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
      '@context': this.sockethub.contextFor('irc'),
      actor: { id: account.sockethubPersonId, type: 'person' }
    };

    return { ...baseObject, ...details };
  }

  /**
   * Build a message object
   * @private
   */
  buildMessageObject (account, target, content, type='message') {
    return this.buildActivityObject(account, {
      type: 'send',
      target: target,
      object: {
        type: type,
        content: content
      }
    });
  }

  /**
   * Emits credentials and connects to an IRC server
   * @public
   */
  connect (account, callback) {
    const credentialsJob = this.buildActivityObject(account, {
      type: 'credentials',
      object: {
        type: 'credentials',
        server: account.server.hostname,
        port: parseInt(account.server.port, 10),
        secure: account.server.secure,
        sasl: account.server.sasl,
        nick: account.nickname,
        ...(account.password && { password: account.password }),
      }
    });

    const connectJob = this.buildActivityObject(account, {
      type: 'connect'
    });

    this.log('irc', 'connecting to IRC network...');

    this.sockethubClient.socket.emit('credentials', credentialsJob, (msg) => {
      const error = (msg && typeof msg === 'object') ? msg.error : msg;
      if (error) { this.log('irc', 'failed to store credentials: ', error); }
    });

    this.sockethubClient.socket.emit('message', connectJob, (message) => {
      if (message.error) {
        this.log('irc', 'failed to connect to IRC network: ', message);
      }
      if (typeof callback === 'function') { callback(message); }
      else { this.coms.handleSockethubMessage(message); }
    });
  }

  handleJoinCompleted (message) {
    const channel = this.coms.channels.find(ch => ch.sockethubChannelId === message.target.id);
    if (channel) {
      this.queryAttendance(channel);
    }
  }

  handlePresenceUpdate (message) {
    const match = message.target.id.match(/(.+)\//);
    if (!match) { console.warn('Could not parse hostname from presence message', message); return; }

    let channel = this.coms.channels.find(ch => ch.sockethubChannelId === message.target.id);

    if (isEmpty(channel)) {
      // Ignore presence updates for channels we haven't explicitly joined.
      // Auto-creating channels here would cause a cascade: each new channel
      // triggers a JOIN, which returns NAMES, which generates more presence
      // events for more channels, eventually joining every channel on the server.
      //
      // TODO In the future, we could collect these channel names to build an
      // available-channels list for the user when they want to join a new channel.
      return;
    }

    const hostname = match[1];
    const account = this.coms.accounts.find(acc => acc?.server?.hostname === hostname);
    if (isEmpty(account)) { console.warn('No account for presence update message found.', message); return; }

    channel.addUser(account.nickname);
    channel.connected = true;

    channel.addUser(message.actor.name || message.actor.id.split('@')[0]);
  }

  /**
   * Join a channel/room
   * @public
   */
  join (channel, type) {
    switch(type) {
      case 'room':
        var joinMsg = this.buildActivityObject(channel.account, {
          type: 'join',
          target: { id: channel.sockethubChannelId, type: 'room', name: channel.name }
        });

        this.log('irc', 'joining channel', joinMsg);
        this.sockethubClient.socket.emit('message', joinMsg, this.handleJoinCompleted.bind(this));
        break;
      case 'person':
        channel.connected = true;
        break;
    }
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
    const messageJob = this.buildMessageObject(channel.account, target, message.content);

    this.log('send', 'sending message job', messageJob);
    this.sockethubClient.socket.emit('message', messageJob);
  }

  /**
   * Send an action chat message to a channel
   * @public
   */
  transferMeMessage (target, content) {
    const channel = this.coms.getChannel(target.id);
    const message = this.buildMessageObject(channel.account, target, content, 'me');

    this.log('send', 'sending message job', message);
    this.sockethubClient.socket.emit('message', message);
  }

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel (message) {
    const match = message.actor.id.match(/.+@(.+)/);
    if (!match) { console.warn('Could not parse hostname from message', message); return; }
    const hostname = match[1];
    const account = this.coms.accounts.find(acc => acc.server.hostname === hostname);

    if (isEmpty(account)) {
      console.warn('Could not find account for message', message);
      return;
    }

    const channel = this.getChannelForMessage(account, message);
    const channelMessage = channelMessageFromSockethubObject(message);

    channel.addMessage(channelMessage);
  }

  /**
   * Leave a channel
   * @public
   */
  leave (channel) {
    if (!channel.isUserChannel) {
      let leaveMsg = this.buildActivityObject(channel.account, {
        type: 'leave',
        target: { id: channel.sockethubChannelId, type: 'room' },
        object: {}
      });

      this.log('leave', 'leaving channel', leaveMsg);
      this.sockethubClient.socket.emit('message', leaveMsg);
    }
  }

  /**
   * Send a channel topic change
   * @public
   */
  changeTopic (channel, topic) {
    let topicMsg = this.buildActivityObject(channel.account, {
      type: 'update',
      target: { id: channel.sockethubChannelId, type: 'room' },
      object: {
        type: 'topic',
        topic: topic
      }
    });

    this.sockethubClient.socket.emit('message', topicMsg);
  }

  /**
   * Ask for a channel's attendance list (users currently joined)
   * @public
   */
  queryAttendance (channel) {
    let msg = this.buildActivityObject(channel.account, {
      type: 'query',
      target: { id: channel.sockethubChannelId, type: 'room', name: channel.name },
      object: {
        type: 'attendance'
      }
    });

    this.log('irc', 'asking for attendance list', msg);
    this.sockethubClient.socket.emit('message', msg);
  }

  /**
   * Get the channel for the given account and message.
   *
   * @param {Account} account
   * @param {Object} message
   * @returns {Channel} channel
   * @public
   */
  getChannelForMessage (account, message) {
    let targetChannelName, channel;

    if (account.nickname === message.target.name) {
      // Direct message
      targetChannelName = message.actor.name || message.actor.id;
      channel = this.coms.channels.filter(ch => ch.account === account)
                                  .find(ch => ch.name === targetChannelName);
      if (!channel) {
        channel = this.coms.createUserChannel(account, targetChannelName);
      }
    } else {
      // Channel message
      targetChannelName = message.target.name;
      channel = this.coms.channels.filter(ch => ch.account === account)
                                  .find(ch => ch.name === targetChannelName);
      if (!channel) {
        channel = this.coms.createChannel(account, targetChannelName);
      }
    }

    return channel;
  }

  /**
   * Create a direct-message channel
   *
   * @param {Account} account
   * @param {String} nickname
   * @returns {UserChannel} user channel
   * @public
   */
  createUserChannel (account, nickname) {
    const channel = new UserChannel({
      account: account,
      name: nickname,
      displayName: nickname,
      connected: true
    });
    return channel;
  }

  /**
   * Utility function for easier logging
   * @protected
   */
  log () {
    this.logger.log(...arguments);
  }

}
