import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';

export default class JoinChannelComponent extends Component {
  @service coms;

  @tracked selectedAccountId;

  get selectedAccount () {
    if (isPresent(this.selectedAccountId)) {
      return this.coms.accounts.findBy('id', this.selectedAccountId);
    } else {
      return this.preSelectedAccount;
    }
  }

  get preSelectedAccount () {
    if (isPresent(this.coms.activeChannel)) {
      return this.coms.activeChannel.account;
    } else {
      return this.coms.accounts.firstObject;
    }
  }

  get accountSelectionDisabled () {
    return this.coms.accounts.length < 2;
  }

  get componentNameForProtocol () {
    return 'join-channel-' + this.selectedAccount.protocol.toLowerCase();
  }

  // @action
  // createChannel (account, channelName) {
  //   const channel = this.coms.createChannel(account, channelName, { saveConfig: true });
  //   this.router.transitionTo('channel', channel);
  // }
}
