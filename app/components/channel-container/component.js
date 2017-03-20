import Ember from 'ember';

const {
  Component,
  observer,
  computed,
  run,
  inject: {
    service
  },
  isPresent,
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

  smt: service(),

  messagesUpdated: observer('channel.messages.[]', function() {
    if (!this.get('scrollingDisabled')) {
      run.scheduleOnce('afterRender', scrollToBottom);
    }
  }),

  hasPreviousMessages: computed('channel.previousLogsDate', function() {
    return isPresent(this.get('channel.previousLogsDate'));
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
    },

    loadPreviousMessages() {
      if (this.get('channel.previousLogsDate')) {
        this.set('scrollingDisabled', true);
        this.get('smt').loadArchiveMessages(
          this.get('channel.space'),
          this.get('channel'),
          this.get('channel.previousLogsDate')
        ).catch(() => {
          // TODO what to do here?
        }).finally(() => {
          this.set('scrollingDisabled', false);
        });
      }
    }

  }
});
