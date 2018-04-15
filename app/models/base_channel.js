import EmberObject, { computed } from '@ember/object';
import { isPresent } from '@ember/utils';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

export default EmberObject.extend({

  space: null,
  name: '',
  userList: null,
  messages: null,
  connected: false,
  sockethubChannelId: null,
  topic: null,
  unreadMessages: false,
  unreadMentions: false,
  visible: false, // Current/active channel

  init() {
    this._super(...arguments);

    this.set('messages', []);
    this.set('userList', []);
  },

  isLogged: computed('space.loggedChannels.[]', 'name', function() {
    let loggedChannel = this.get('space.loggedChannels').find((channelName) => {
      return channelName === this.name;
    });

    return isPresent(loggedChannel);
  }),

  slug: computed('name', function() {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.name.replace(/#/g,'');
  }),

  unreadMessagesClass: computed('visible', 'unreadMessages', 'unreadMentions', function() {
    if (this.visible || !this.unreadMessages) {
      return null;
    }
    return this.unreadMentions ? 'unread-mentions' : 'unread-messages';
  }),

  sortedMessages: computed('messages.@each.date', function() {
    return this.messages.sortBy('date');
  }),

  addDateHeadline(newMessage) {
    let headlineDate = moment(newMessage.get('date')).startOf('day').toDate();

    let existingDateHeadline = this.messages.find(function(message) {
      return message.get('type') === 'date-headline' &&
             message.get('date').toString() === headlineDate.toString();
    });

    if (existingDateHeadline) { return; }

    let dateMessage = Message.create({ type: 'date-headline', date: headlineDate });
    this.messages.pushObject(dateMessage);
  },

  addMessage(message) {
    this.addDateHeadline(message);

    this.messages.pushObject(message);

    if (!this.visible) {
      this.set('unreadMessages', true);
      if (message.get('content').match(this.get('space.userNickname'))) {
        this.set('unreadMentions', true);
      }
    }
  },

  addUser(username) {
    if (!this.userList.includes(username)) {
      this.userList.pushObject(username);
    }
  },

  removeUser(username) {
    this.userList.removeObject(username);
  }

});

