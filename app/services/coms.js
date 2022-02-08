import Service, { inject as service } from '@ember/service';
import { isPresent, isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import IrcAccount from 'hyperchannel/models/account/irc';
import XmppAccount from 'hyperchannel/models/account/xmpp';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import config from 'hyperchannel/config/environment';

/**
 * This service provides the central command interface for communicating with
 * chat servers/networks
 * @class hyperchannel/services/coms
 */
export default class ComsService extends Service {

  // Utils
  @service logger;
  // Data storage
  @service('remotestorage') storage;
  // Message transport
  @service('sockethub-irc') irc;
  @service('sockethub-xmpp') xmpp;

  /**
   * A collection of all account model instances
   * @type {Account[]}
   */
  @tracked accounts = A([]);
  /**
   * A collection of all channel instances
   * @type {Channel[] | UserChannel}
   */
  @tracked channels = A([]);

  get sortedChannels () {
    return this.channels.sortBy('name');
  }

  get channelDomains () {
    return this.channels.mapBy('domain').uniq().sort();
  }

  get groupedChannelsByDomain () {
    return this.channelDomains.map(domain => {
      return {
        domain: domain,
        channels: this.channels.filterBy('domain', domain).sortBy('name')
      };
    });
  }

  get activeChannel () {
    return this.channels.findBy('visible');
  }

  get onboardingComplete() {
    return isPresent(this.accounts);
  }

  /**
   * This is called from the application route on app startup. Sets up all
   * listeners for incoming Sockethub messages.
   * @public
   */
  setupListeners () {
    this.sockethub.socket.on('message'  , this.handleSockethubMessage.bind(this));
  }

  /**
   * This is called from the application route on app startup. Instantiates,
   * connects, and joins all configured/saved or default accounts and channels
   * @public
   */
  async instantiateAccountsAndChannels () {
    return new Promise((resolve, reject) => {
      this.storage.rs.kosmos.accounts.getIds().then(accountIds => {
        if (isEmpty(accountIds)) {
          console.debug('No accounts found in RS');
          resolve();
        } else {
          const allAccounts = accountIds.map(id => {
            return this.storage.rs.kosmos.accounts.getConfig(id).then(config => {
              const properties = {
                username: config.username,
                password: config.password,
                nickname: config.nickname,
                botkaURL: config.botkaURL,
                server: config.server
              }
              let account;
              switch(config.protocol) {
                case 'XMPP':
                  account = new XmppAccount(properties);
                  break;
                case 'IRC':
                  account = new IrcAccount(properties);
                  break;
              }
              this.connectServer(account);
              this.accounts.pushObject(account);
              // TODO wait for successful server connection before joining
              return this.instantiateChannels(account);
            });
          });
          Promise.all(allAccounts).then(resolve);
        }
      }, e => {
        this.log('error', 'couldn\'d load account from RS', e);
        reject();
      });
    });
  }

  /**
   * Invokes the connect function on the appropriate transport service
   * @public
   */
  connectServer (account) { // JID
    this.getServiceForSockethubPlatform(account.protocol)
        .connect(account);
  }

  /**
   * Invokes the channel-join function on the appropriate transport service
   * @param {Channel} channel
   * @param {String} type - Type of channel. Can be "room" or "person"
   * @public
   */
  joinChannel (channel, type) {
    this.getServiceForSockethubPlatform(channel.protocol)
        .join(channel, type);
  }

  /**
   * Invokes the send-message function on the appropriate transport service
   * @param {Channel} channel
   * @param {String} content
   * @param {String} [id]
   * @public
   */
  transferMessage (channel, message) {
    const target = {
      id: channel.sockethubChannelId,
      type: channel.isUserChannel ? 'person' : 'room',
      name: channel.name
    };
    this.getServiceForSockethubPlatform(channel.protocol)
        .transferMessage(target, message);
  }

  /**
   * Invokes the send-action-message function on the appropriate transport service
   * @public
   */
  transferMeMessage (account, target, content) {
    switch (account.protocol) {
      case 'XMPP':
        // TODO implement
        break;
      case 'IRC':
        this.irc.transferMeMessage(target, content);
        break;
    }
  }

  leaveChannel (channel) {
    this.getServiceForSockethubPlatform(channel.protocol)
        .leave(channel);
  }

  changeTopic (channel, topic) {
    switch (channel.protocol) {
      case 'XMPP':
        // TODO implement
        break;
      case 'IRC':
        this.irc.changeTopic(channel, topic);
        break;
    }
  }

  updateChannelUserList (message) {
    const channel = this.getChannel(message.actor.id);

    if (channel) {
      channel.connected = true;
      if (Array.isArray(message.object.members)) {
        channel.userList = message.object.members;
      }
    }
  }

  addUserToChannelUserList (message) {
    const channel = this.getChannel(message.target.id);
    if (channel) {
      channel.addUser(message.actor.name);
    }
  }

  removeUserFromChannelUserList (message) {
    // TODO handle user quit leaves (multiple channels)
    // e.g. target is `{ type: 'service', id: 'irc.freenode.net' }`
    const sockethubChannelId = typeof message.target === 'object' ? message.target.id : message.target;
    const channel = this.getChannel(sockethubChannelId);
    if (channel) {
      channel.removeUser(message.actor.name);
    }
  }

  /**
   * @param {String} channelId - a Sockethub channel ID
   */
  getChannel (channelId) {
    const channel = this.channels.findBy('sockethubChannelId', channelId);

    if (isEmpty(channel)) {
      console.warn('Could not find channel by sockethubChannelId', channelId);
      return;
    }

    return channel;
  }

  updateUsername (message) {
    if (typeof message.actor === 'object') {
      const actorId = message.actor.id;
      const account = this.accounts.findBy('sockethubPersonId', actorId);
      if (isPresent(account)) {
        account.updateUsername(message.target.name);
      }
      // TODO update nickname in channels
    }
  }

  updateChannelTopic (message) {
    let channel = this.getChannel(message.target.id);

    if (isEmpty(channel)) {
      console.warn('No channel for update topic message found.', message);
      return;
    }

    const currentTopic = channel.topic;
    const newTopic = message.object.topic;

    channel.topic = newTopic;

    if (isPresent(currentTopic) && (newTopic !== currentTopic) && !channel.visible) {
      Notification.requestPermission(function() {
        new Notification(channel.name, {
          body: `New Topic: ${newTopic}`
        });
      });
    }

    // TODO obsolete? if not, name a function for it
    // let notification = new Message({
    //   type: 'notification-topic-change',
    //   date: new Date(message.published),
    //   nickname: message.actor.name,
    //   content: message.object.topic
    // });
    // channel.messages.pushObject(notification);
  }

  async instantiateChannels (account) {
    const channelData = await this.storage.rs.kosmos.channels.getAll(account.id);

    for (const cid in channelData) {
      this.createChannel(account, channelData[cid].name, {
        isLogged: channelData[cid].isLogged
      });
    }
  }

  createChannel (account, channelName, options = {}) {
    const channel = new Channel({
      account: account,
      name: channelName,
      displayName: channelName,
      isLogged: options.isLogged
    });
    this.channels.pushObject(channel);
    this.joinChannel(channel, 'room');

    if (options.saveConfig) {
      this.storage.saveChannel(channel);
    }

    // TODO Check other message archives first, depending on protocol
    // (e.g. MAM for XMPP)
    if (account.protocol === 'IRC') {
      this.loadLastMessagesFromKosmosArchives(channel, { isLogged: options.isLogged });
    }

    return channel;
  }

  loadLastMessagesFromKosmosArchives (channel, options = {}) {
    // TODO implement a channel getter for the hostname so it works with
    // protocols other than IRC
    const channelNetworkHostname = channel.account.server.hostname;

    const discoverPublicLogs = !options.isLogged;
    const networkIsLogged    = config.publicLogs.knownLoggedNetworks.includes(channelNetworkHostname);

    if (discoverPublicLogs && !networkIsLogged) return false;

    return fetch(`${channel.publicLogsBaseUrl}/meta`).then(res => res.json()).then(meta => {
      channel.isLogged = true;
      return this.loadArchiveMessages(channel, meta.last);
    }).catch(() => {
      channel.isLogged = false;
    }).finally(() => {
      if (discoverPublicLogs) { this.storage.saveChannel(channel); }
    });
  }

  async loadArchiveMessages (channel, dateStr, options = {}) {
    options.minMessages = options.minMessages || 10;
    options.maxDays = options.maxDays || 5;

    let messagesCount = 0;
    let archivesCount = 0;

    while ((messagesCount < options.minMessages) &&
           (archivesCount < options.maxDays)) {
      const archive = await fetch(`${channel.publicLogsBaseUrl}/${dateStr}`).then(res => res.json());

      archive.today?.messages?.forEach(message => {
        let channelMessage = new Message({
          type: 'message-chat',
          date: new Date(message.timestamp),
          nickname: message.from,
          content: message.text,
          id: message.id
        });

        channel.addMessage(channelMessage);
      });

      messagesCount += archive.today?.messages?.length || 0;
      archivesCount += 1;

      dateStr = archive.today?.previous;
      channel.searchedPreviousLogsUntilDate = dateStr;
      if (isEmpty(dateStr)) break;
    }
  }

  createUserChannel (account, name) {
    const channel = this.getServiceForSockethubPlatform(account.protocol)
                        .createUserChannel(account, name);

    this.channels.pushObject(channel);
    return channel;
  }

  async removeChannel (channel) {
    this.leaveChannel(channel);
    this.channels.removeObject(channel);
    if (!channel.isUserChannel) {
      await this.storage.removeChannel(channel);
    }
    return;
  }

  async removeAccount (account) {
    const channels = this.channels.filterBy('account', account);
    console.debug(`Removing ${channels.length} channels before removing account:`, channels);
    for (const channel of channels) {
      await this.removeChannel(channel);
    }

    this.accounts.removeObject(account);
    await this.storage.removeAccount(account);
    return;
  }

  getServiceForSockethubPlatform (protocol) {
    return this[protocol.toLowerCase()];
  }

  /**
   * Handles incoming Sockethub messages:
   * - Attendance list for channel
   * - Another user joined or left a channel
   * - Received a channel message (normal or me/action)
   * - A channel topic was updated
   * - The username/address changed
   * @private
   */
  handleSockethubMessage (message) {
    this.log(`${message.context}_message`, 'SH message', message);

    switch (message.type) {
      case 'query':
        if (message.object['type'] === 'attendance') {
          this.updateChannelUserList(message);
        }
        break;
      // TODO remove deprecated term in favor of query
      case 'observe':
        if (message.object['type'] === 'attendance') {
          this.updateChannelUserList(message);
        }
        break;
      case 'send':
        switch (message.object.type) {
          case 'message':
          case 'me':
            this.getServiceForSockethubPlatform(message.context)
                .addMessageToChannel(message);
            break;
        }
        break;
      case 'update':
        switch (message.object.type) {
          case 'topic':
            if (message.actor['type'] === 'service') {
              // TODO (could also create a special service room)
              // this.handleServiceAnnouncement()
            } else {
              this.updateChannelTopic(message);
            }
            break;
          case 'address':
            this.updateUsername(message);
            break;
          case 'presence':
            this.getServiceForSockethubPlatform(message.context)
                .handlePresenceUpdate(message)
            break;
          case 'error':
            console.warn('Received error update message', message.actor.id, message.object.content);
            break;
        }
        break;
    }
  }

  /**
   * Utility function for easier logging
   * @private
   */
  log () {
    this.logger.log(...arguments);
  }
}
