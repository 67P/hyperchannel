import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class AddChatAccountComponent extends Component {

  @service coms;

  @tracked accountType = "xmpp";

  get showCancelButton () {
    return this.coms.onboardingComplete;
  }

  @action
  chooseAccountType (accountType) {
    this.accountType = accountType;
  }
}
