import Service, { inject as service } from '@ember/service';
import { isPresent, isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import XmppAccount from 'hyperchannel/models/account/xmpp';
import IrcAccount from 'hyperchannel/models/account/irc';
import Channel from 'hyperchannel/models/channel';
import UserChannel from 'hyperchannel/models/user_channel';
import Message from 'hyperchannel/models/message';
import config from 'hyperchannel/config/environment';
import moment from 'moment';
import { tracked } from '@glimmer/tracking';
import { computed } from '@ember/object';
import { sort } from '@ember/object/computed';

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
  @tracked channels = A([]);

  channelSorting = ['name'];
  @sort('channels', 'channelSorting') sortedChannels;

  @computed('channels.@each.domain')
  get channelDomains () {
    return this.channels.mapBy('domain').uniq().sort();
  }

  get groupedChannelsByDomain () {
    return this.channelDomains.map(domain => {
      return {
        domain: domain,
        channels: this.channels.filterBy('domain', domain).sortBy('name')
      }
    });
  }

  @computed('channels.@each.visible')
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
    this.sockethub.socket.on('completed', this.handleSockethubCompleted.bind(this));
    this.sockethub.socket.on('message'  , this.handleSockethubMessage.bind(this));
    this.sockethub.socket.on('failure'  , this.handleSockethubFailure.bind(this));
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
              let account;
              switch(config.protocol) {
                case 'XMPP':
                  account = new XmppAccount({
                    username: config.username,
                    password: config.password,
                    nickname: config.nickname,
                    botkaURL: config.botkaURL,
                    server: config.server
                  });
                  break;
                case 'IRC':
                  account = new IrcAccount({
                    username: config.username,
                    password: config.password,
                    nickname: config.nickname,
                    botkaURL: config.botkaURL,
                    server: config.server
                  });
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
   * @public
   */
  transferMessage (channel, content) {
    const target = {
      '@id': channel.sockethubChannelId,
      '@type': channel.isUserChannel ? 'person' : 'room',
      displayName: channel.name
    };
    this.getServiceForSockethubPlatform(channel.protocol)
        .transferMessage(target, content);
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
    switch (channel.protocol) {
      case 'XMPP':
        // TODO implement
        break;
      case 'IRC':
        this.irc.leave(channel);
        break;
    }
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
    const channel = this.getChannel(message.actor['@id']);

    if (channel) {
      channel.connected = true;
      if (Array.isArray(message.object.members)) {
        channel.userList = message.object.members;
      }
    }
  }

  addUserToChannelUserList (message) {
    const channel = this.getChannel(message.target['@id']);
    if (channel) {
      channel.addUser(message.actor.displayName);
    }
  }

  removeUserFromChannelUserList (message) {
    // TODO handle user quit leaves (multiple channels)
    // e.g. target is `{ @type: 'service', @id: 'irc.freenode.net' }`
    const channel = this.getChannel(message.target['@id']);
    if (channel) {
      channel.removeUser(message.actor.displayName);
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
      const actorId = message.actor['@id'];
      const account = this.accounts.findBy('sockethubPersonId', actorId);
      if (isPresent(account)) {
        account.updateUsername(message.target.displayName);
      }
      // TODO update nickname in channels
    }
  }

  updateChannelTopic (message) {
    let channel = this.getChannel(message.target['@id']);

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
    //   nickname: message.actor.displayName,
    //   content: message.object.topic
    // });
    // channel.messages.pushObject(notification);
  }

  async instantiateChannels (account) {
    return this.storage.rs.kosmos.channels.getAll(account.id).then(channelData => {
      for (const channelName in channelData) {
        // Additional props in channelData[channelName]
        this.createChannel(account, channelName);
      }
    });
  }

  createChannel (account, channelName, options = {}) {
    const channel = new Channel({
      account: account,
      name: channelName,
      displayName: channelName
    });
    this.channels.pushObject(channel);
    this.joinChannel(channel, 'room');

    if (options.saveConfig) {
      this.storage.saveChannel(channel);
    }

    if (channel.isLogged) {
      this.loadLastMessages(channel, moment.utc(), 2)
          .catch(() => { /* TODO nothing to do here? */ });
    }

    return channel;
  }

  loadLastMessages (channel, date, maximumDays = 14) {
    let searchUntilDate;
    if (channel.searchedPreviousLogsUntilDate) {
      searchUntilDate = moment(channel.searchedPreviousLogsUntilDate).subtract(maximumDays, 'days');
    } else {
      searchUntilDate = moment.utc().subtract(maximumDays, 'days');
    }

    if (date.isBefore(searchUntilDate, 'day')) {
      channel.searchedPreviousLogsUntilDate = date;
      return;
    }

    return this.loadArchiveMessages(channel, date).catch(() => {
      // didn't find any archive for this day, restart searching for the previous day
      return this.loadLastMessages(channel, date.subtract(1, 'day'));
    });
  }

  async loadArchiveMessages (channel, date) {
    // TODO move RS documents, make compatible
    let logsUrl = `${config.publicLogsUrl}/${channel.account.server.hostname.toLowerCase()}/channels/${channel.slug}/`;
        logsUrl += date.format('YYYY/MM/DD');

    return fetch(logsUrl).then(res => res.json()).then(archive => {
      archive.today?.messages?.forEach((message) => {
        this.log('chat_message', message);

        let channelMessage = new Message({
          type: 'message-chat',
          date: new Date(message.timestamp),
          nickname: message.from,
          content: message.text
        });

        channel.addMessage(channelMessage);
      });
      let previous = archive.today?.previous;
      channel.searchedPreviousLogsUntilDate = moment.utc(previous.replace(/\//g, '-'));
    }).catch(error => {
      this.log('fetch-error', 'couldn\'t load archive document', error);
      throw(error);
    });
  }

  createUserChannel (account, userName) {
    const channel = new UserChannel({
      account: account,
      name: userName
    });

    // TODO check if this is necesarry for XMPP,
    // because for IRC it is not
    this.joinChannel(channel, "person");
    this.channels.pushObject(channel);

    return channel;
  }

  removeChannel (channelName) {
    const channel = this.channels.findBy('name', channelName);
    this.leaveChannel(channel);

    this.channels.removeObject(channel);

    // TODO delete from RS?

    return channel;
  }

  getServiceForSockethubPlatform (protocol) {
    return this[protocol.toLowerCase()];
  }

  /*
   * @private
   *
   * Handles completed Sockethub actions:
   * - Successfully joined a channel
   */
  handleSockethubCompleted (message) {
    this.log(`${message.context}_completed`, message);

    switch(message['@type']) {
      case 'join':
        this[message.context].handleJoinCompleted(message);
        break;
    }
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

    switch(message['@type']) {
      case 'observe':
        if (message.object['@type'] === 'attendance') {
          this.updateChannelUserList(message);
        }
        break;
      case 'join':
        this.handleChannelJoin(message);
        break;
      case 'leave':
        this.removeUserFromChannelUserList(message);
        break;
      case 'send':
        switch(message.object['@type']) {
          case 'message':
          case 'me':
            this.getServiceForSockethubPlatform(message.context)
                .addMessageToChannel(message);
            break;
        }
        break;
      case 'update':
        switch(message.object['@type']) {
          case 'topic':
            this.updateChannelTopic(message);
            break;
          case 'address':
            this.updateUsername(message);
            break;
          case 'presence':
            this.getServiceForSockethubPlatform(message.context)
                .handlePresenceUpdate(message)
            break;
          case 'error':
            console.warn('Got error update message', message.actor['@id'], message.object.content);
            break;
        }
        break;
      // case 'error':
      //   switch(message.context) {
      //     case 'xmpp':
      //       this.xmpp.handleErrorMessage(message);
      //       break;
      //   }
      //   break;
    }
  }

  /**
   * Handles the various checks assosciated with channel joins
   * @private
   */
  handleChannelJoin (message) {
    if (message.object['@type'] && (message.object['@type'] === 'error')) {
      // failed to join a channel
      const channel = this.getChannel(message.target['@id'], message.actor['@id']);

      if (isPresent(channel)) {
        channel.connected = false;
      } else {
        console.warn('Could not find channel for error message', message);
      }
    } else {
      this.addUserToChannelUserList(message);
    }
  }

  /**
   * Handles incoming Sockethub errors/failures
   * @private
   */
  handleSockethubFailure (message) {
    this.log('sh_failure', message);
  }

  /**
   * Utility function for easier logging
   * @private
   */
  log () {
    this.logger.log(...arguments);
  }
}
