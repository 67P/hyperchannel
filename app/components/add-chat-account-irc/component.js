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
  @tracked password;
  @tracked useAuth = false;
  // @tracked useSasl = false;
  @tracked useTls = true;
  @tracked connectError = null;
  @tracked connecting = false;

  get username () {
    return this.nickname;
  }

  get useSasl () {
    return this.useAuth;
  }

  instantiateAccount () {
    const account = new IrcAccount({
      server: {
        hostname: this.hostname,
        port: this.port,
        secure: this.useTls,
        sasl: this.useSasl
      },
      nickname: this.nickname,
      username: this.username,
      password: this.password || null
    });

    return account;
  }

  async addAccount () {
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
  async submitForm (e) {
    e.preventDefault();
    this.connectError = null;
    this.connecting = true;
    const accountDummy = this.instantiateAccount();

    this.irc.connect(accountDummy, async (message) => {
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
