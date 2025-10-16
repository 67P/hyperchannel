import Component from '@glimmer/component';
import { isEmpty, isPresent } from '@ember/utils';

export default class MessageUserActionsComponent extends Component {

  get isOwnMessage () {
    return this.args.message.nickname === this.args.channel.account.nickname;
  }

  get isOwnLastMessage () {
    if (isEmpty(this.args.channel.sortedMessages)) return false;

    const lastId = this.args.channel.sortedMessages
                       .filter(msg => msg.nickname === this.args.channel.account.nickname)
                       .at(-1)?.id;
    return isPresent(lastId) && (lastId === this.args.message.id);
  }

}
