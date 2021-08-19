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
  @tracked finishedSetup = false;

  get userAddress () {
    return `${this.username}@${this.hostname}`;
  }

  async handleConnectStatus (eventName, message) {
    console.debug('handleConnectStatus called') // TODO remove
    if (this.finishedSetup) {
      // TODO remove when double events fixed
      console.debug('Account setup already finished, nothing to do')
      return;
    }

    if (message.context !== 'xmpp' ||
        !['message', 'completed'].includes(eventName)) { return; }

    if (message['@type'] === 'error' &&
        message.object.condition === 'not-authorized'
        /* && TODO message.actor['@id'] === actor */) {
      this.connectError = {
        title: 'Account connection failed',
        content: message.object.content
      }
      this.xmpp.sockethub.socket.offAny();
    }

    if (message['@type'] === 'connect' &&
        message.actor['@id'] === this.userAddress) {
      // Connected successfully
      this.xmpp.sockethub.socket.offAny();

      const account = await this.addAccount();
      this.addDefaultChannels(account);
      this.finishedSetup = true;

      // this.router.transitionTo('channel', /* welcome channel */);
    }
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
    this.xmpp.sockethub.socket.onAny(this.handleConnectStatus.bind(this));
    this.xmpp.connectWithCredentials(this.userAddress, this.password);
  }

}
