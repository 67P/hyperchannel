/* global Hammer */
import $ from 'jquery';

import Component from '@ember/component';
import { observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';

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

    loadPreviousMessages() {
      this.set('scrollingDisabled', true);
      this.coms.loadLastMessages(
        this.get('channel.space'),
        this.channel,
        this.get('channel.searchedPreviousLogsUntilDate')
      ).catch(() => {
        // TODO what to do here?
      }).finally(() => {
        this.set('scrollingDisabled', false);
      });
    },

    addUsernameMentionToMessage (username) {
      const msg = this.newMessage;
      if (msg.match(new RegExp(`^${username}`))) {
        // new message already starts with username
        return false;
      } else {
        this.set('newMessage', `${username}: ${msg}`)
      }
    }

  }
});
