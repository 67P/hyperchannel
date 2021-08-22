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

}
