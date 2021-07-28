import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class AddChatAccountComponent extends Component {

  @tracked accountType = "xmpp";

  @action
  chooseAccountType (accountType) {
    this.accountType = accountType;
  }
}
