import { isEmpty, isPresent } from '@ember/utils';
import { tracked, cached } from '@glimmer/tracking';
import { TrackedArray } from 'tracked-built-ins';
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
  @tracked userList = new TrackedArray([]);
  @tracked messages = new TrackedArray([]);
  @tracked unreadMessages = false;
  @tracked unreadMentions = false;
  @tracked visible = false; // Current/active channel
  @tracked roomInfoLoaded = false;
  @tracked description = null;
  @tracked roomFeatures = new TrackedArray([]);
  @tracked roomIdentities = new TrackedArray([]);
  @tracked roomInfoData = null;
  @tracked roomConfigData = null;
  @tracked roomCustomData = null;

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
        // Use the same value as the internal `id` (name@host), so the
        // Sockethub channel ID and the internal channel ID never diverge.
        id = this.id;
        break;
    }
    return id;
  }

  get slug () {
    // Strip a single leading '#' only for single-hash IRC channels, so they
    // keep clean URLs (e.g. #kosmos-dev -> kosmos-dev@server). Multi-hash
    // channels preserve all '#' characters (e.g. ##kosmos-dev ->
    // ##kosmos-dev@server, URL-encoded as %23%23kosmos-dev@server).
    return this.id.replace(/^#(?=[^#])/, '');
  }

  get sidebarName () {
    switch (this.protocol) {
      case 'IRC':
        // Strip a single leading '#' so the sidebar (which already renders a
        // leading '#') shows all hashes of the channel name, e.g.
        // #kosmos-dev -> kosmos-dev (renders as "# kosmos-dev"),
        // ##kosmos-dev -> #kosmos-dev (renders as "# #kosmos-dev").
        return this.name.replace(/^#/, '');
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
    return [...this.messages].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  }

  @cached
  get sortedUserList () {
    return [...this.userList].sort(function (a, b) {
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
    this.messages.push(dateMessage);
  }

  addMessage (message) {
    if (message.replaceId) {
      this.replaceMessage(message);
      return;
    }

    this.addDateHeadline(message);

    // Find the last non-date-headline message for grouping check
    const chatMessages = this.messages.filter(m => m.type !== 'date-headline');
    const prevMsg = chatMessages[chatMessages.length - 1];
    
    if (prevMsg && 
        (prevMsg.nickname === message.nickname) &&
         moment(message.date).isBefore(moment(prevMsg.date).add(120, 'seconds'))) {
      message.grouped = true;
    }

    this.messages.push(message);

    if (!this.visible) {
      this.unreadMessages = true;
      if (message.content.match(this.account.nickname)) {
        this.unreadMentions = true;
      }
    }
  }

  replaceMessage (newMessage) {
    const messagesFromNick = this.sortedMessages
                                .filter(msg => msg.nickname === newMessage.nickname);
    const lastMessage = messagesFromNick[messagesFromNick.length - 1];

    if (lastMessage &&
       (lastMessage.id === newMessage.replaceId)) {
      lastMessage.content = newMessage.content;
      lastMessage.edited = true;
      // TODO replace date?
    }
  }

  confirmPendingMessage (content) {
    const message = this.messages.filter(msg => msg.pending)
                                 .find(msg => msg.content === content);

    if (isPresent(message)) {
      message.pending = false;
      return true;
    } else {
      return false;
    }
  }

  addUser (username) {
    if (!this.userList.includes(username)) {
      this.userList.push(username);
    }
  }

  removeUser (username) {
    const index = this.userList.indexOf(username);
    if (index > -1) {
      this.userList.splice(index, 1);
    }
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
