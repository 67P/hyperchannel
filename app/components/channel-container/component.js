/* global Hammer */
import $ from 'jquery';

import Component from '@ember/component';
import { observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';

function scrollToBottom() {
  $('#channel-content').animate({
    scrollTop: $('#channel-content ul').height()
  }, '500');
}

export default Component.extend({

  elementId: 'channel',
  newMessage: '',
  channel: null,
  scrollingDisabled: false,

  coms: service(),

  messagesUpdated: observer('channel.messages.[]', function() {
    if (!this.scrollingDisabled) {
      scheduleOnce('afterRender', scrollToBottom);
    }
  }),

  didInsertElement() {
    this._super(...arguments);

    scheduleOnce('afterRender', scrollToBottom);

    // We need to define an empty handler for swipe events on the
    // #channel-content element, so that the actual handler of the app container
    // component gets triggered
    scheduleOnce('afterRender', function() {
      Hammer(document.getElementById('channel-content')).on('swipe', function(){});
    });
  },

  focusMessageInputField () {
    let inputEl = this.$('#message-field').get(0);
    inputEl.focus();
  },

  loadPreviousMessages: task(function * () {
    this.set('scrollingDisabled', true);

    yield this.coms.loadLastMessages(
      this.get('channel.space'),
      this.channel,
      this.get('channel.searchedPreviousLogsUntilDate')
    );

    this.set('scrollingDisabled', false);
  }).drop(),

  actions: {

    processMessageOrCommand() {
      if (this.newMessage.substr(0, 1) === "/") {
        this.onCommand(this.newMessage);
      } else {
        this.onMessage(this.newMessage);
      }
    },

    menu(which, what) {
      this.menu(which, what);
    },

    addUsernameMentionToMessage (username) {
      const msg = this.newMessage;
      if (! msg.match(new RegExp(`^${username}`))) {
        this.set('newMessage', `${username}: ${msg}`)
      }
      this.focusMessageInputField();
    }

  }
});
