import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class AddChatAccountXmppComponent extends Component {

  @service('sockethub-xmpp') xmpp;

  @tracked username;
  @tracked host = 'kosmos.org';
  @tracked password;

  get userAddress () {
    return `${this.username}@${this.host}`
  }

  @action
  submitForm (e) {
    e.preventDefault();
    this.xmpp.connectWithCredentials(this.userAddress, this.password);
  }

}
