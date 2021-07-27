import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import Space from 'hyperchannel/models/space';

export default class AddChatAccountXmppComponent extends Component {

  @service router;
  @service coms;
  @service('sockethub-xmpp') xmpp;
  @service('remotestorage') storage;

  @tracked username;
  @tracked host = 'kosmos.org';
  @tracked password;
  @tracked connectError = null;

  get userAddress () {
    return `${this.username}@${this.host}`;
  }

  handleConnectStatus (eventName, message) {
    console.debug('[add-chat-account-xmpp] handleConnectStatus called') // TODO remove

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

      this.addSpace().then(space => {
        this.router.transitionTo('space.channel', space, space.channels.firstObject);
      });
    }
  }

  // TODO Turn into `addAccount()`
  async addSpace () {
    const space = new Space({
      id: this.userAddress,
      name: this.userAddress,
      protocol: 'XMPP',
      server: {
        hostname: this.host, // TODO remove when not required by RS module anymore
        port: 1234,  // TODO remove when not required by RS module anymore
        secure: true, // TODO remove when not required by RS module anymore
        username: this.userAddress,
        password: this.password,
        nickname: this.username
      },
    });

    const defaultChannels = [
      'kosmos@kosmos.chat',
      'kosmos-random@kosmos.chat'
    ];

    this.coms.spaces.pushObject(space);
    this.coms.instantiateChannels(space, defaultChannels);

    return this.storage.saveSpace(space).then(() => space);
  }

  @action
  submitForm (e) {
    e.preventDefault(); this.connectError = null; this.xmpp.sockethub.socket.onAny(this.handleConnectStatus.bind(this));
    this.xmpp.connectWithCredentials(this.userAddress, this.password);
  }

}
