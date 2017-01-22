import Ember from 'ember';

function scrollToBottom() {
  Ember.$('#channel-content').animate({
    scrollTop: Ember.$('#channel-content ul').height()
  }, '500');
}

function focusMessageInput() {
  Ember.$('input#message-field').focus();
}

export default Ember.Component.extend({

  elementId: 'channel',
  newMessage: '',
  channel: null,

  scrollToBottom: function() {
    Ember.run.scheduleOnce('afterRender', scrollToBottom);
  }.on('didInsertElement'),

  focusMessageInput: function() {
    Ember.run.scheduleOnce('afterRender', focusMessageInput);
  }.on('didInsertElement'),

  messagesUpdated: Ember.observer('channel.messages.[]', function() {
    Ember.run.scheduleOnce('afterRender', scrollToBottom);
  }),

  actions: {

    processMessageOrCommand() {
      if (this.get('newMessage').substr(0, 1) === "/") {
        this.attrs.onCommand(this.get('newMessage'));
      } else {
        this.attrs.onMessage(this.get('newMessage'));
      }
    },

    menu(which, what) {
      this.sendAction("menu", which, what);
    }

  }
});
