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
  // @tracked username;
  // @tracked password;
  // @tracked serverPassword;
  @tracked useTls = true;
  @tracked connectError = null;
  @tracked showCredentialFields = false;

  get username () {
    return this.nickname;
  }

  async handleConnectFailure (message) {
    console.debug('handleConnectFailure called') // TODO remove
    if (message.context !== 'irc') return;
    debugger;
  }

  async handleConnectMessage (message) {
    console.debug('handleConnectMessage called') // TODO remove
    if (message.context !== 'irc') return;
    debugger;
  }

  async handleConnectCompleted (message) {
    console.debug('handleConnectComplete called') // TODO remove
    if (message.context !== 'irc') return;
    // if (this.finishedSetup) {
    //   // TODO remove when double events fixed
    //   console.debug('Account setup already finished, nothing to do')
    //   return;
    // }

        // && !['message', 'completed'].includes(eventName)) { return; }

    // if (message['@type'] === 'error' &&
    //     message.object.condition === 'not-authorized'
    //     /* && TODO message.actor['@id'] === actor */) {
    //   this.connectError = {
    //     title: 'Account connection failed',
    //     content: message.object.content
    //   }
    //   this.xmpp.sockethub.socket.offAny();
    // }

    debugger;

    if (message['@type'] === 'connect' &&
        message.actor['@id'] === this.userAddress) {
      // Connected successfully

      const account = await this.addAccount();
      this.addDefaultChannels(account);
      // this.finishedSetup = true;

      // this.router.transitionTo('channel', /* welcome channel */);
    }
  }

  async instantiateAccount () {
    return new IrcAccount({
      server: {
        hostname: this.hostname,
        port: this.port,
        secure: this.useTls
      },
      nickname: this.nickname,
      // username: this.username,
      // password: this.password,
    });
  }

  async createAccount () {
    const account = this.instantiateAccount();
    this.coms.accounts.pushObject(account);
    return this.storage.saveAccount(account).then(() => account);
  }

  addDefaultChannels (account) {
    const defaultChannels = [
      '#kosmos',
      '#kosmos-random'
    ];

    defaultChannels.forEach(name => {
      this.coms.createChannel(account, name, { saveConfig: true })
    });
  }

  @action
  submitForm (e) {
    e.preventDefault();
    this.connectError = null;

    this.irc.sockethub.socket.on('failure', this.handleConnectFailure.bind(this));
    this.irc.sockethub.socket.on('message', this.handleConnectMessage.bind(this));
    this.irc.sockethub.socket.on('completed', this.handleConnectCompleted.bind(this));

    const account = this.instantiateAccount();
    this.irc.connect(account);
  }

}
