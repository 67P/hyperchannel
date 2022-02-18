import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import XmppAccount from 'hyperchannel/models/account/xmpp';

export default class AddChatAccountXmppComponent extends Component {

  @service router;
  @service coms;
  @service('sockethub-xmpp') xmpp;
  @service('remotestorage') storage;

  @tracked username;
  @tracked hostname = 'kosmos.org';
  @tracked password;
  @tracked connectError = null;
  @tracked connecting = false;

  get userAddress () {
    return `${this.username}@${this.hostname}`;
  }

  async addAccount () {
    const account = new XmppAccount({
      username: this.userAddress,
      password: this.password,
      nickname: this.username,
    });

    this.coms.accounts.pushObject(account);
    return this.storage.saveAccount(account).then(() => account);
  }

  addDefaultChannels (account) {
    const defaultChannels = [
      'kosmos@kosmos.chat',
      'kosmos-random@kosmos.chat'
    ];

    defaultChannels.forEach(name => {
      this.coms.createChannel(account, name, { saveConfig: true })
    });
  }

  @action
  submitForm (e) {
    e.preventDefault();
    this.connectError = null;
    this.connecting = true;

    this.xmpp.connectWithCredentials(this.userAddress, this.password, async (message) => {
      this.connecting = false;

      if (message.error) {
        this.connectError = {
          title: 'Account connection failed',
          content: message.error
        }
      } else {
        const account = await this.addAccount();
        this.addDefaultChannels(account);
        const firstChannel = this.coms.channels.filterBy('account', account).firstObject;
        this.router.transitionTo('channel', firstChannel);
      }
    });
  }

}
