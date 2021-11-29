import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';
// import { action } from '@ember/object';

export default class JoinChannelComponent extends Component {
  // @service router;
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

  // @action
  // createChannel (account, channelName) {
  //   if (isEmpty(channelName)) return;
  //
  //   if (account.protocol === 'IRC' && !channelName.match(/^#/)) {
  //     channelName = `#${channelName}`;
  //   }
  //
  //   const channel = this.coms.createChannel(account, channelName, { saveConfig: true });
  //   this.router.transitionTo('channel', channel);
  // }
}
