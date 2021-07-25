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

  handleConnectError (message) {
    console.debug('[add-chat-account-xmpp] handleConnectError called'); // TODO remove when unregistering handlers is fixed

    if (message.context === 'xmpp' && message['@type'] === 'error' &&
        message.object.condition === 'not-authorized'
    /* && TODO message.actor['@id'] === actor */) {
      this.connectError = {
        title: 'Account connection failed',
        content: message.object.content
      }
      this.unregisterConnectHandlers();
    }
  }

  handleConnectSuccess (message) {
    console.debug('[add-chat-account-xmpp] handleConnectSuccess called'); // TODO remove when unregistering handlers is fixed

    if (message.context === 'xmpp' && message['@type'] === 'connect' &&
        message.actor['@id'] === this.userAddress) {
      console.debug('[add-chat-account-xmpp] connected successfully') // TODO remove

      this.unregisterConnectHandlers();
    }
  }

  registerConnectHandlers () {
    this.xmpp.sockethub.socket._on('message', this.handleConnectError.bind(this));
    this.xmpp.sockethub.socket._on('completed', this.handleConnectSuccess.bind(this));
  }

  unregisterConnectHandlers () {
    // FIXME listeners are not being removed
    this.xmpp.sockethub.socket.off('message', this.handleConnectError.bind(this));
    this.xmpp.sockethub.socket.off('completed', this.handleConnectSuccess.bind(this));
  }

  @action
  submitForm (e) {
    e.preventDefault();
    this.connectError = null;
    this.registerConnectHandlers();
    this.xmpp.connectWithCredentials(this.userAddress, this.password);
  }

}
