import Ember from 'ember';

export default Ember.Object.extend({

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

  slug: computed('name', function() {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.get('name').replace(/#/g,'');
  }),

  unreadMessagesClass: Ember.computed('visible', 'unreadMessages', 'unreadMentions', function() {
    if (this.get('visible') || !this.get('unreadMessages')) {
      return null;
    }
    return this.get('unreadMentions') ? 'unread-mentions' : 'unread-messages';
  }),

  sortedMessages: Ember.computed('messages.@each.date', function() {
    return this.get('messages').sortBy('date');
  }),

  addMessage(message) {
    this.get('messages').pushObject(message);

    if (!this.get('visible')) {
      this.set('unreadMessages', true);
      if (message.get('content').match(this.get('space.userNickname'))) {
        this.set('unreadMentions', true);
      }
    }
  },

  addUser(username) {
    this.get('userList').pushObject(username);
  },

  removeUser(username) {
    this.get('userList').removeObject(username);
  }

});

