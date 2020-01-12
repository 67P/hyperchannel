import Component from '@ember/component';
import {
  bindKeyboardShortcuts,
  unbindKeyboardShortcuts
} from 'ember-keyboard-shortcuts';
import { isEmpty } from '@ember/utils';
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
      const input = this.element.querySelector('#message-field');
      const cursorPosition = input.selectionStart;
      const textBeforeCursor = this.message.slice(0, cursorPosition);
      const textAfterCursor = this.message.slice(cursorPosition);
      const words = textBeforeCursor.split(' ');
      const searchWord = words.pop();

      if (isEmpty(searchWord)) return;

      let username = this.usernames.find(username => {
        return username.toLowerCase().startsWith(searchWord.toLowerCase());
      });

      if (isEmpty(username)) return;

      // add a colon when inserting the username in the beginning
      if (words.length === 0) {
        username = `${username}: `;
      }

      const lengthDiff = username.length - searchWord.length;
      const newCursorPosition = cursorPosition + lengthDiff;

      words.push(username);
      const newMessage = `${words.join(' ')}${textAfterCursor}`;
      this.set('message', newMessage);

      // set the cursor right behind the inserted username,
      // but we have to wait for the update of the input first
      scheduleOnce('afterRender', this, input.focus);
      scheduleOnce('afterRender', this, input.setSelectionRange(newCursorPosition, newCursorPosition));
    }

  }

});
