import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isEmpty } from '@ember/utils';
import { action } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { bindKeyboardShortcuts, unbindKeyboardShortcuts } from 'ember-keyboard-shortcuts';

export default class MessageInputComponent extends Component {

  @tracked message = '';

  keyboardShortcuts = {
    'tab': 'completeUsername'
  };

  setCursorPosition (input, newCursorPosition) {
    input.focus();
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  @action
  bindKeyboardShortcuts (element) {
    bindKeyboardShortcuts(this, element);
  }

  @action
  unbindKeyboardShortcuts (element) {
    unbindKeyboardShortcuts(this, element);
  }

  @action
  completeUsername () {
    const input = document.querySelector('input#message-field');
    const message = input.value;
    const cursorPosition = input.selectionStart;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    const words = textBeforeCursor.split(' ');
    const searchWord = words.pop();

    if (isEmpty(searchWord)) return;

    let username = this.args.usernames.find(username => {
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
    input.value = newMessage;

    // set the cursor right behind the inserted username,
    // but we have to wait for the update of the input first
    scheduleOnce('afterRender', this, 'setCursorPosition', input, newCursorPosition);
  }

}
