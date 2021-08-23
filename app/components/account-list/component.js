import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
// import { tracked } from '@glimmer/tracking';

export default class AccountListComponent extends Component {

  @service router;
  @service coms;

  @action
  addAccount () {
    this.args.closeModal();
    this.router.transitionTo('add-account');
  }

  @action
  async deleteAccount (account) {
    if (!window.confirm(`Are you sure you want to delete the account ${account.id}?`)) {
      return;
    }

    await this.coms.removeAccount(account);

    if (this.coms.accounts.length === 0) {
      this.args.closeModal();
      this.router.transitionTo('add-account');
    } else {
      const firstChannel = this.coms.channels.firstObject;
      this.router.transitionTo('channel', firstChannel);
    }
  }

}
