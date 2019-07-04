import Component from '@ember/component';
import { bindKeyboardShortcuts, unbindKeyboardShortcuts } from 'ember-keyboard-shortcuts';
import { isPresent } from '@ember/utils';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({

  tagName: 'section',
  elementId: 'new-message',

  message: '',
  usernames: null,

  keyboardShortcuts: Object.freeze({
    'tab': 'completeUsername'
  }),

  didInsertElement () {
    this._super(...arguments);
    bindKeyboardShortcuts(this);
  },

  willDestroyElement () {
    this._super(...arguments);
    unbindKeyboardShortcuts(this);
  },

  actions: {

    completeUsername () {
      let input = this.element.querySelector('#message-field');
      let cursorPosition = input.selectionStart;
      let textBeforeCursor = this.message.slice(0, cursorPosition);
      let textAfterCursor = this.message.slice(cursorPosition);
      let words = textBeforeCursor.split(' ');
      let searchWord = words.pop();

      if (isPresent(searchWord)) {
        let username = this.usernames.find(username => {
          return username.toLowerCase().startsWith(searchWord.toLowerCase());
        });

        if (isPresent(username)) {
          // add a colon when inserting the username in the beginning
          if (words.length === 0) {
            username = `${username}: `;
          }

          let lengthDiff = username.length - searchWord.length;
          let newCursorPosition = cursorPosition + lengthDiff;

          words.push(username);
          let newMessage = `${words.join(' ')}${textAfterCursor}`;
          this.set('message', newMessage);

          // set the cursor right behind the inserted username,
          // but we have to wait for the update of the input first
          scheduleOnce('afterRender', this, function () {
            input.focus();
            input.setSelectionRange(newCursorPosition, newCursorPosition);
          });
        }
      }
    }

  }

});
