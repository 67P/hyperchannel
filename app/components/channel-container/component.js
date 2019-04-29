/* global Hammer */
import Component from '@ember/component';
import { debounce, scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { isPresent } from '@ember/utils';

function scrollToBottom () {
  let elem = document.getElementById('channel-content');
  elem.scrollTop = elem.scrollHeight;
}

export default Component.extend({

  elementId: 'channel',
  newMessage: '',
  channel: null,
  automaticScrollingEnabled: true,
  paginationObserver: null,

  coms: service(),

  didInsertElement () {
    this._super(...arguments);

    scheduleOnce('afterRender', this, function () {
      this.createScrollingObserver();
      this.createPaginationObserver();

      // We need to define an empty handler for swipe events on the
      // #channel-content element, so that the actual handler of the app container
      // component gets triggered
      Hammer(document.getElementById('channel-content')).on('swipe', function(){});
    });
  },

  // disable automatic scrolling when user scrolls away from the bottom
  createScrollingObserver () {
    let elem = document.getElementById('channel-content');

    elem.onscroll = (event) => {
      // check if we scrolled to the end of the container
      if (event.target.offsetHeight + event.target.scrollTop === event.target.scrollHeight) {
        this.set('automaticScrollingEnabled', true);
      } else {
        this.set('automaticScrollingEnabled', false);
      }
    };
  },

  // loads new messages when the last message comes into view
  createPaginationObserver () {
    const config = {
      root: this.element,
      rootMargin: '0px',
      threshold: 0
    };

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.channel.increaseMessagePagination();
          observer.unobserve(entry.target);
        }
      });
    }, config);

    this.set('paginationObserver', observer);
  },

  focusMessageInputField () {
    let inputEl = this.$('#message-field').get(0);
    inputEl.focus();
  },

  loadPreviousMessages: task(function * () {
    yield this.coms.loadLastMessages(
      this.get('channel.space'),
      this.channel,
      this.get('channel.searchedPreviousLogsUntilDate')
    );
  }).drop(),

  handleNewMessage () {
    if (this.automaticScrollingEnabled) {
      scheduleOnce('afterRender', this, function () {
        scrollToBottom();
      });
    }

    if (isPresent(this.observedMessageElement)) {
      this.paginationObserver.observe(this.observedMessageElement);
      this.set('observedMessageElement', null);
    }
  },

  actions: {

    processMessageOrCommand () {
      if (this.newMessage.substr(0, 1) === "/") {
        this.onCommand(this.newMessage);
      } else {
        this.onMessage(this.newMessage);
      }
    },

    addMessageElement (domElement, message) {
      if (message.isObservingMessage) {
        this.set('observedMessageElement', domElement);
      }

      debounce(this, this.handleNewMessage, 50);
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
