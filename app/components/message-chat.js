import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { tracked } from '@glimmer/tracking';
import { isEmpty } from '@ember/utils';
import formatMessageContent from 'hyperchannel/utils/format-message-content';
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

  get userColorStyle () {
    return htmlSafe(`color: ${this.userColorHex}`);
  }

  get datetime () {
    return moment(this.args.message.date).format('YYYY-MM-DD[T]HH:mm');
  }

  get dateTitle () {
    return moment(this.args.message.date).format('YYYY-MM-DD [at] HH:mm');
  }

  get formattedContent () {
    return formatMessageContent(this.args.message.content);
  }

  get pendingClass () {
    return this.args.message.pending ? 'text-neutral-500' : '';
  }

  get avatarPlaceholderLetter () {
    return this.args.message.nickname.charAt(0).toUpperCase();
  }

  focusInputField (messageId) {
    const inputEl = document.querySelector(`input[name=message-input-${messageId}]`);
    if (!inputEl) return;
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
    requestAnimationFrame(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.focusInputField(this.args.message.id);
    });
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
