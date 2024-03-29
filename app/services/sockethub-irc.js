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
    context: 'irc',
    actor: account.sockethubPersonId
  };

  return { ...baseObject, ...details };
}

/**
 * Build a message object
 *
 * @param account {Account} account instance
 * @param target {String} where to send the message to (channelId)
 * @param content {String} the message itself
 * @param type {String} can be either 'message' or 'me'
 * @returns {Object} the activity object
 */
function buildMessageObject(account, target, content, type='message') {
  return buildActivityObject(account, {
    type: 'send',
    target: target,
    object: {
      type: type,
      content: content
    }
  });
}

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
   * - Creates an ActivityStreams person object for
   *   future use
   * - Emits credentials for future IRC server messages,
   *   like e.g. `join`
   * @public
   */
  connect (account, callback) {
    this.sockethubClient.ActivityStreams.Object.create({
      id: account.sockethubPersonId,
      type: 'person',
      name: account.nickname
    });

    const credentialsJob = buildActivityObject(account, {
      type: 'credentials',
      object: {
        type: 'credentials',
        server: account.server.hostname,
        port: parseInt(account.server.port, 10),
        secure: account.server.secure,
        sasl: account.server.sasl,
        nick: account.nickname,
        // username: account.username,
        password: account.password
      }
    });

    const connectJob = buildActivityObject(account, {
      type: 'connect'
    });

    this.log('irc', 'connecting to IRC network...');

    this.sockethubClient.socket.emit('credentials', credentialsJob, (err) => {
      if (err) { this.log('failed to store credentials: ', err); }
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
    const channel = this.coms.channels.findBy('sockethubChannelId', message.target.id);
    if (channel) {
      this.queryAttendance(channel);
    }
  }

  handlePresenceUpdate (message) {
    const hostname = message.target.id.match(/(.+)\//)[1];
    const account = this.coms.accounts.findBy('server.hostname', hostname);
    if (isEmpty(account)) { console.warn('No account for presence update message found.', message); return; }

    let channel = this.coms.channels.findBy('sockethubChannelId', message.target.id);

    // TODO document why there might be no channel instance, or remove
    if (isEmpty(channel)) {
      console.debug('No channel for presence update message found. Creating it.', message);
      channel = this.coms.createChannel(account, message.target.name, message.target.id);
    }

    // Hotfix for adding one's own user to the channel and marking it as
    // connected.
    // ATM, Sockethub doesn't send any events or information that we
    // successfully joined a channel. So for now we just assume, if we receive
    // presence updates from other users, we should be in the channel, too.
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
        this.sockethubClient.ActivityStreams.Object.create({
          type: type,
          id: channel.sockethubChannelId,
          name: channel.name
        });

        var joinMsg = buildActivityObject(channel.account, {
          type: 'join',
          target: channel.sockethubChannelId
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
    const messageJob = buildMessageObject(channel.account, target, message.content);

    this.log('send', 'sending message job', messageJob);
    this.sockethubClient.socket.emit('message', messageJob);
  }

  /**
   * Send an action chat message to a channel
   * @public
   */
  transferMeMessage (target, content) {
    const channel = this.coms.getChannel(target.id);
    const message = buildMessageObject(channel.account, target, content, 'me');

    this.log('send', 'sending message job', message);
    this.sockethubClient.socket.emit('message', message);
  }

  /**
   * Add an incoming message to a channel
   * @param {Object} messsage
   * @public
   */
  addMessageToChannel (message) {
    const hostname = message.actor.id.match(/.+@(.+)/)[1];
    const account = this.coms.accounts.findBy('server.hostname', hostname);

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
      let leaveMsg = buildActivityObject(channel.account, {
        type: 'leave',
        target: channel.sockethubChannelId,
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
    let topicMsg = buildActivityObject(channel.account, {
      type: 'update',
      target: channel.sockethubChannelId,
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
    let msg = buildActivityObject(channel.account, {
      type: 'query',
      target: channel.sockethubChannelId,
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
      channel = this.coms.channels.filterBy('account', account)
                                  .findBy('name', targetChannelName);
      if (!channel) {
        channel = this.coms.createUserChannel(account, targetChannelName);
      }
    } else {
      // Channel message
      targetChannelName = message.target.name;
      channel = this.coms.channels.filterBy('account', account)
                                  .findBy('name', targetChannelName);
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
