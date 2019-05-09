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
  partialRenderingObserver: null,
  scrollingObserver: null,

  coms: service(),

  didInsertElement () {
    this._super(...arguments);

    scheduleOnce('afterRender', this, function () {
      this.createScrollingObserver();
      this.createPartialRenderingObserver();

      // We need to define an empty handler for swipe events on the
      // #channel-content element, so that the actual handler of the app container
      // component gets triggered
      Hammer(document.getElementById('channel-content')).on('swipe', function(){});
    });
  },

  // disable automatic scrolling when user scrolls away from the bottom
  createScrollingObserver () {
    const config = {
      root: this.element,
      rootMargin: '0px',
      threshold: 1 // full element has to be in view
    };

    let observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.set('automaticScrollingEnabled', true);
        } else {
          this.set('automaticScrollingEnabled', false);
        }
      });
    }, config);

    this.set('scrollingObserver', observer);
  },

  // loads new messages when the last message comes into view
  createPartialRenderingObserver () {
    const config = {
      root: this.element,
      rootMargin: '0px',
      threshold: 0
    };

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.channel.increaseRenderedMessagesCount();
          observer.unobserve(entry.target);
        }
      });
    }, config);

    this.set('partialRenderingObserver', observer);
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

  actions: {

    processMessageOrCommand () {
      if (this.newMessage.substr(0, 1) === "/") {
        this.onCommand(this.newMessage);
      } else {
        this.onMessage(this.newMessage);
      }
    },

    addMessageElement (domElement, message) {
      let scrollingEnabled = this.automaticScrollingEnabled;

      if (message.isObservingMessage) {
        this.partialRenderingObserver.observe(domElement);
      }

      if (message.isLatestMessage) {
        this.scrollingObserver.disconnect(); // unobserve all previous elements
        this.scrollingObserver.observe(domElement);
      }

      if (scrollingEnabled) {
        scheduleOnce('afterRender', this, function () {
          scrollToBottom();
        });
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
