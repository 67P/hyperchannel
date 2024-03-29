import { isEmpty, isPresent } from '@ember/utils';
import { A } from '@ember/array';
import { tracked, cached } from '@glimmer/tracking';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

export default class BaseChannel {

  @tracked account = null;
  @tracked id = '';
  @tracked name = ''; // e.g. kosmos-dev@kosmos.chat or #kosmos-dev
  @tracked displayName = ''; // e.g. Kosmos Dev
  @tracked isLogged;
  @tracked connected = false;
  @tracked topic = null;
  @tracked userList = A([]);
  @tracked messages = A([]);
  @tracked unreadMessages = false;
  @tracked unreadMentions = false;
  @tracked visible = false; // Current/active channel

  constructor (props) {
    Object.assign(this, props);

    if (isEmpty(this.id)) {
      switch(this.protocol) {
        case 'XMPP':
          this.id = this.name;
          break;
        case 'IRC':
          this.id = `${this.name}@${this.account.server.hostname}`;
          break;
      }
    }
  }

  get protocol () {
    return this.account.protocol;
  }

  get sockethubPersonId () {
    return this.account.sockethubPersonId;
  }

  get sockethubChannelId () {
    let id;
    switch (this.protocol) {
      case 'XMPP':
        id = this.name;
        break;
      case 'IRC':
        id = `${this.account.server.hostname}/${this.name}`;
        break;
    }
    return id;
  }

  get slug () {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.id.replace(/#/g,'');
  }

  get shortName () {
    switch (this.protocol) {
      case 'IRC':
        return this.name.replace(/#/g,'');
      case 'XMPP':
        return this.name.match(/^(.+)@/)[1];
      default:
        return this.name;
    }
  }

  get domain () {
    const match = this.id.match(/@([^/]+)/);
    return match[1];
  }

  get unreadMessagesClass () {
    if (this.visible || !this.unreadMessages) {
      return null;
    }
    return this.unreadMentions ? 'unread-mentions' : 'unread-messages';
  }

  @cached
  get sortedMessages () {
    return this.messages.sortBy('date');
  }

  @cached
  get sortedUserList () {
    return this.userList.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
  }

  addDateHeadline (newMessage) {
    let headlineDate = moment(newMessage.date).startOf('day').toDate();

    let existingDateHeadline = this.messages.find(function (message) {
      return message.type === 'date-headline' &&
             message.date.toString() === headlineDate.toString();
    });

    if (existingDateHeadline) { return; }

    let dateMessage = new Message({ type: 'date-headline', date: headlineDate });
    this.messages.pushObject(dateMessage);
  }

  addMessage (message) {
    if (message.replaceId) {
      this.replaceMessage(message);
      return;
    }

    this.addDateHeadline(message);

    const prevMsg = this.messages.lastObject;
    if ((prevMsg.nickname === message.nickname) &&
         moment(message.date).isBefore(moment(prevMsg.date).add(120, 'seconds'))) {
      message.grouped = true;
    }

    this.messages.pushObject(message);

    if (!this.visible) {
      this.unreadMessages = true;
      if (message.content.match(this.account.nickname)) {
        this.unreadMentions = true;
      }
    }
  }

  replaceMessage (newMessage) {
    const lastMessage = this.sortedMessages
                            .filterBy('nickname', newMessage.nickname)
                            .lastObject

    if (lastMessage &&
       (lastMessage.id === newMessage.replaceId)) {
      lastMessage.content = newMessage.content;
      lastMessage.edited = true;
      // TODO replace date?
    }
  }

  confirmPendingMessage (content) {
    const message = this.messages.filterBy('pending')
                                 .findBy('content', content);

    if (isPresent(message)) {
      message.pending = false;
      return true;
    } else {
      return false;
    }
  }

  addUser(username) {
    if (!this.userList.includes(username)) {
      this.userList.pushObject(username);
    }
  }

  removeUser(username) {
    this.userList.removeObject(username);
  }

  serialize () {
    return {
      accountId: this.account.id,
      id: this.id,
      name: this.name,
      displayName: this.displayName
    }
  }

}
