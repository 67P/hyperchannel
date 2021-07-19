import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class AddChatAccountXmppComponent extends Component {

  @tracked username;
  @tracked host = 'kosmos.org';
  @tracked password;

  get userAddress () {
    return `${this.username}@${this.host}`
  }

  @action
  submitForm (e) {
    e.preventDefault();
    console.debug('Connecting XMPP account', this.userAddress);
  }

}
