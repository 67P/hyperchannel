import Ember from 'ember';

const {
  Component,
  observer,
  run: {
    scheduleOnce
  },
  inject: {
    service
  }
} = Ember;

function scrollToBottom() {
  Ember.$('#channel-content').animate({
    scrollTop: Ember.$('#channel-content ul').height()
  }, '500');
}

export default Component.extend({

  elementId: 'channel',
  newMessage: '',
  channel: null,
  scrollingDisabled: false,

  coms: service(),

  messagesUpdated: observer('channel.messages.[]', function() {
    if (!this.get('scrollingDisabled')) {
      scheduleOnce('afterRender', scrollToBottom);
    }
  }),

  didInsertElement() {
    this._super(...arguments);

    scheduleOnce('afterRender', scrollToBottom);
  },

  actions: {

    processMessageOrCommand() {
      if (this.get('newMessage').substr(0, 1) === "/") {
        this.onCommand(this.get('newMessage'));
      } else {
        this.onMessage(this.get('newMessage'));
      }
    },

    menu(which, what) {
      this.sendAction('menu', which, what);
    },

    loadPreviousMessages() {
      this.set('scrollingDisabled', true);
      this.get('coms').loadLastMessages(
        this.get('channel.space'),
        this.get('channel'),
        this.get('channel.searchedPreviousLogsUntilDate')
      ).catch(() => {
        // TODO what to do here?
      }).finally(() => {
        this.set('scrollingDisabled', false);
      });
    }

  }
});
