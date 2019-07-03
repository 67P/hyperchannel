/* global Hammer */
import Component from '@ember/component';
import { later, scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { computed, observer } from '@ember/object';

function scrollToBottom () {
  let elem = document.getElementById('channel-content');
  elem.scrollTop = elem.scrollHeight;
}

export default Component.extend({

  elementId: 'channel',
  newMessage: '',
  channel: null,
  automaticScrollingEnabled: true,
  partialRenderingEnabled: true,

  partialRenderingObserverMargin: '200px',

  renderedMessagesCount: 0, // maximum number of messages to render
  renderedMessagesAddendumAmount: 30, // number of messages to increase rendering count by

  coms: service(),

  renderedMessages: computed('channel.sortedMessages.[]', 'renderedMessagesCount', function () {
    if (this.partialRenderingEnabled) {
      return this.channel.sortedMessages.slice(-this.renderedMessagesCount);
    } else {
      return this.channel.sortedMessages;
    }
  }),

  channelChanged: observer('channel', function () {
    this.set('renderedMessagesCount', this.renderedMessagesAddendumAmount);
    this.set('partialRenderingEnabled', true);
    this.set('automaticScrollingEnabled', true);
    later(this, () => this.send('menu', 'global', 'hide'), 500);
  }),

  messagesUpdated: observer('renderedMessages.[]', function () {
    if (this.automaticScrollingEnabled) {
      scheduleOnce('afterRender', scrollToBottom);
    }
  }),

  didInsertElement () {
    this._super(...arguments);

    scheduleOnce('afterRender', this, function () {
      this.set('partialRenderingObserverMargin', `${this.element.clientHeight/3}px`); // TODO update the config when window is resized

      // We need to define an empty handler for swipe events on the
      // #channel-content element, so that the actual handler of the app container
      // component gets triggered
      Hammer(document.getElementById('channel-content')).on('swipe', function(){});
    });
  },

  focusMessageInputField () {
    let inputEl = this.$('#message-field').get(0);
    inputEl.focus();
  },

  loadPreviousMessages: task(function * () {
    this.set('automaticScrollingEnabled', false);
    yield this.coms.loadLastMessages(
      this.get('channel.space'),
      this.channel,
      this.get('channel.searchedPreviousLogsUntilDate')
    );
  }).drop(),

  actions: {

    processMessageOrCommand () {
      if (this.newMessage.substr(0, 1) === "/") {
        this.onCommand(this.newMessage);
      } else {
        this.onMessage(this.newMessage);
      }
    },

    menu (which, what) {
      this.menu(which, what);
    },

    addUsernameMentionToMessage (username) {
      const msg = this.newMessage;
      if (! msg.match(new RegExp(`^${username}`))) {
        this.set('newMessage', `${username}: ${msg}`)
      }
      this.focusMessageInputField();
    },

    increaseRenderedMessagesCount () {
      let newMessagesCount = this.renderedMessagesCount + this.renderedMessagesAddendumAmount;
      this.set('renderedMessagesCount', newMessagesCount);
      this.set('partialRenderingEnabled', newMessagesCount < this.channel.sortedMessages.length);
    },

    setAutomaticScrolling (state) {
      this.set('automaticScrollingEnabled', state);
    }

  }
});
