import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';

export default class UserListComponent extends Component {

  @tracked renderedUsersCount = 0;
  renderedUsersAddendumAmount = 50; // number of users to add when scrolling to bottom
  @tracked partialRenderingEnabled = true;

  get renderedUsers () {
    if (this.partialRenderingEnabled) {
      return this.args.users.slice(0, this.renderedUsersCount);
    } else {
      return this.args.users;
    }
  }

  scrollToTop (element) {
    element.scrollTop = 0;
  }

  // called when changing list of users (i.e. when switching channels)
  @action
  usersChanged (element) {
    this.renderedUsersCount = this.renderedUsersAddendumAmount;
    this.partialRenderingEnabled = true;

    scheduleOnce('afterRender', this, this.scrollToTop, element);
  }

  @action
  increaseRenderedUsersCount () {
    let newUsersCount = this.renderedUsersCount + this.renderedUsersAddendumAmount;
    this.renderedUsersCount = newUsersCount;
    this.partialRenderingEnabled = newUsersCount < this.args.users.length;
  }

}
