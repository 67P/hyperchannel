import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { isEmpty } from '@ember/utils';
import { action } from '@ember/object';
import shortcutMatches from 'hyperchannel/utils/shortcut-matches';

export default class MessageInputComponent extends Component {

  @tracked message = '';

  keyboardShortcuts = {
    'tab': 'completeUsername'
  };

  setCursorPosition (input, newCursorPosition) {
    input.focus();
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }

  handleKeydown = (event) => {
    for (const [shortcut, methodName] of Object.entries(this.keyboardShortcuts)) {
      if (shortcutMatches(event, shortcut)) {
        event.preventDefault();
        this[methodName](event);
      }
    }
  };

  @action
  bindKeyboardShortcuts (event) {
    event.currentTarget.addEventListener('keydown', this.handleKeydown);
  }

  @action
  unbindKeyboardShortcuts (event) {
    event.currentTarget.removeEventListener('keydown', this.handleKeydown);
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
    requestAnimationFrame(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.setCursorPosition(input, newCursorPosition);
    });
  }

}
