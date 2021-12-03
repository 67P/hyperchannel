import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class JoinChannelXmppComponent extends Component {
  @service router;
  @service coms;

  @tracked channelName = '';
  @tracked channelDomain = '';
  @tracked nickname = '';

  constructor () {
    super(...arguments);
    // TODO retrieve MUC domain from user's home server,
    // and/or use chat domain of currently active channel
    this.channelDomain = 'kosmos.chat';
    this.nickname = this.args.account.nickname;
  }

  get channelAddress () {
    return `${this.channelName}@${this.channelDomain}`;
  }

  @action
  joinChannel (e) {
    e.preventDefault();

    const channel = this.coms.createChannel(this.args.account, this.channelAddress, { saveConfig: true });

    // TODO wait for join success before transitioning
    this.router.transitionTo('channel', channel);

    this.args.closeModal();
  }
}
