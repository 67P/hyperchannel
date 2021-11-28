import Component from '@glimmer/component';
// import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class JoinChannelComponent extends Component {

  // @service router;
  @service coms;

  get selectedAccount () {
    return this.args.data.selectedAccount;
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
