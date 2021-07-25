import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

export default class AddChatAccountXmppComponent extends Component {

  @service('sockethub-xmpp') xmpp;

  @tracked username;
  @tracked host = 'kosmos.org';
  @tracked password;
  @tracked connectError = null;

  get userAddress () {
    return `${this.username}@${this.host}`
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
      console.debug('[add-chat-account-xmpp] connected successfully') // TODO remove
      this.xmpp.sockethub.socket.offAny();
    }
  }

  @action
  submitForm (e) {
    e.preventDefault(); this.connectError = null; this.xmpp.sockethub.socket.onAny(this.handleConnectStatus.bind(this));
    this.xmpp.connectWithCredentials(this.userAddress, this.password);
  }

}
