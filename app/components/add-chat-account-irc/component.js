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

  get username () {
    return this.nickname;
  }

  instantiateAccount () {
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
    const accountDummy = this.instantiateAccount();

    this.irc.connect(accountDummy, async (message) => {
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
