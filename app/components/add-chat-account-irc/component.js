import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import IrcAccount from 'hyperchannel/models/account/irc';

export default class AddChatAccountIrcComponent extends Component {
  @service router;
  @service coms;
  @service('sockethub-irc') irc;
  @service('remotestorage') storage;

  @tracked hostname = 'irc.libera.chat';
  @tracked port = '6697';
  @tracked nickname;
  // TODO Implement authenticated connect using SASL
  // @tracked username;
  // @tracked password;
  // @tracked serverPassword;
  @tracked useTls = true;
  @tracked connectError = null;
  @tracked showCredentialFields = false;

  get username() {
    return this.nickname;
  }

  // TODO Implement once available
  // async handleConnectFailure (message) {
  //   console.debug('handleConnectFailure called with', message);
  // }

  // TODO Implement once available
  // async handleConnectMessage (message) {
  //   console.debug('handleConnectMessage called with', message);
  //
  //   if (message['@type'] === 'error' &&
  //       message.object.condition === 'not-authorized'
  //       && TODO message.actor['@id'] === actor */) {
  //     this.connectError = {
  //       title: 'Account connection failed',
  //       content: message.object.content
  //     }
  //     this.xmpp.sockethub.socket.offAny();
  //   }
  // }

  // TODO Implement once available
  // async handleConnectCompleted (message) {
  //   console.debug('handleConnectComplete called with', message);
  //
  //   if (message['@type'] === 'connect' &&
  //       message.actor['@id'] === this.userAddress) {
  //     // Connected successfully
  //     const account = await this.addAccount();
  //     this.addDefaultChannels(account);
  //     // this.finishedSetup = true;
  //     // this.router.transitionTo('channel', /* welcome channel */);
  //   }
  // }

  instantiateAccount() {
    return new IrcAccount({
      server: {
        hostname: this.hostname,
        port: this.port,
        secure: this.useTls,
      },
      nickname: this.nickname,
      // username: this.username,
      // password: this.password,
    });
  }

  async createAccount() {
    const account = this.instantiateAccount();
    this.coms.accounts.pushObject(account);
    return this.storage.saveAccount(account).then(() => account);
  }

  addDefaultChannels(account) {
    const defaultChannels = ['#kosmos', '#kosmos-random'];

    defaultChannels.forEach((name) => {
      this.coms.createChannel(account, name, { saveConfig: true });
    });
  }

  @action
  async submitForm(e) {
    e.preventDefault();
    this.connectError = null;

    // this.irc.sockethub.socket.onAny(() => console.debug(...arguments));

    // TODO Handle connect status once implemented in Sockethub
    // this.irc.sockethub.socket.on('failure', this.handleConnectFailure.bind(this));
    // this.irc.sockethub.socket.on('message', this.handleConnectMessage.bind(this));
    // this.irc.sockethub.socket.on('completed', this.handleConnectCompleted.bind(this));

    const account = await this.createAccount();
    this.irc.connect(account);

    // TODO Move to connect-completed handler once available; let user change channels to join
    this.addDefaultChannels(account);
    this.router.transitionTo('channel', this.coms.channels.firstObject);
  }
}
