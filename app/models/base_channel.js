import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

export default class BaseChannel {

  @tracked space = null;
  @tracked name = '';
  @tracked userList = A([]);
  @tracked messages = A([]);
  @tracked connected = false;
  @tracked sockethubChannelId = null;
  @tracked topic = null;
  @tracked unreadMessages = false;
  @tracked unreadMentions = false;
  @tracked visible = false; // Current/active channel

  constructor (props) {
    Object.assign(this, props);
  }

  @computed('space.loggedChannels.[]', 'name')
  get isLogged () {
    let loggedChannel = this.space.loggedChannels.find((channelName) => {
      return channelName === this.name;
    });

    return isPresent(loggedChannel);
  }

  get slug () {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.name.replace(/#/g,'');
  }

  get unreadMessagesClass () {
    if (this.visible || !this.unreadMessages) {
      return null;
    }
    return this.unreadMentions ? 'unread-mentions' : 'unread-messages';
  }

  @computed('messages.@each.date')
  get sortedMessages () {
    return this.messages.sortBy('date');
  }

  @computed('userList.[]')
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
    this.addDateHeadline(message);

    this.messages.pushObject(message);

    if (!this.visible) {
      this.unreadMessages = true;
      if (message.content.match(this.space.userNickname)) {
        this.unreadMentions = true;
      }
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

}
