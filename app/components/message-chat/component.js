/* global linkifyStr */
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import { scheduleOnce } from '@ember/runloop';
import { isEmpty } from '@ember/utils';
import moment from 'moment';
import getRGB from 'consistent-color-generation';

export default class MessageChatComponent extends Component {

  @tracked isEditing = false;
  @tracked editedContent = null;

  constructor () {
    super(...arguments);
    // TODO move to user object when implemented
    // https://github.com/67P/hyperchannel/issues/180
    this.userColorHex = getRGB(this.args.message.nickname).toString();
  }

  get datetime () {
    return moment(this.args.message.date).format('YYYY-MM-DD[T]HH:mm');
  }

  get dateTitle () {
    return moment(this.args.message.date).format('YYYY-MM-DD [at] HH:mm');
  }

  get formattedContent () {
    const content = this.args.message.content;
    let out;

    // Images
    if (content.match(/^(http)s?:\/\/.*(gif|png|jpg|jpeg)$/i)) {
      out = `<a href="${content}" target="_blank" rel="nofollow noopener">` +
            `<img src="${content}" ` +
                 `class="my-1 p-1 h-48 w-auto max-w-full md:max-w-7xl
                         border border-neutral-200 hover:border-neutral-400">` +
            `</a>`;
    }
    // Other links
    else {
      out = linkifyStr(content, {
        linkAttributes: { rel: 'nofollow noopener' },
        validate: {
          url: function (value) {
            return /^(http)s?:\/\//.test(value);
          },
          email: function () { return false; }
        }
      });
    }

    // Colors
    out = out.replace(/\u0003(\d+)/g, '<span class="color-$1">')
             .replace(/"color-(\d)"/g, '"color-0$1"')
             .replace(/\u0002/g, '<span class="bold">')
             .replace(/\u001D/g, '<span class="italic">')
             .replace(/\u000f/g,  '</span>')
             .replace(/(?:\r\n|\r|\n)/g, '<br>');

    return htmlSafe(out);
  }

  get pendingClass () {
    return this.args.message.pending ? 'text-neutral-500' : '';
  }

  get avatarPlaceholderLetter () {
    return this.args.message.nickname.charAt(0).toUpperCase();
  }

  focusInputField(messageId) {
    const inputEl = document.querySelector(`input[name=message-input-${messageId}]`);
    inputEl.focus();
    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  @action
  usernameClick (username) {
    this.args.onUsernameClick(username);
  }

  @action
  startMessageCorrection () {
    this.editedContent = this.args.message.content;
    this.isEditing = true;
    scheduleOnce('afterRender', this, 'focusInputField', this.args.message.id);
  }

  @action
  cancelMessageCorrection () {
    this.editedContent = null;
    this.isEditing = false;
  }

  @action
  correctMessage (ev) {
    ev.preventDefault();
    if (isEmpty(this.editedContent)) {
      console.warn('Message cannot be empty');
      return false;
    }

    this.args.sendMessage(this.editedContent, {
      replaceId: this.args.message.id
    });
    this.cancelMessageCorrection();
  }

}
