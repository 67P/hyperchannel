import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({

  tagName: 'section',
  elementId: 'user-list',
  classNames: ['main'],
  users: null,

  renderedUsersCount: 0,
  renderedUsersAddendumAmount: 50, // number of users to add when scrolling to bottom
  partialRenderingEnabled: true,

  renderedUsers: computed('users.[]', 'renderedUsersCount', function () {
    if (this.partialRenderingEnabled) {
      return this.users.slice(0, this.renderedUsersCount);
    } else {
      return this.users;
    }
  }),

  // called when changing list of users (i.e. when switching channels)
  usersChanged: observer('users', function () {
    this.set('renderedUsersCount', this.renderedUsersAddendumAmount);
    this.set('partialRenderingEnabled', true);
    scheduleOnce('afterRender', this, function () {
      this.element.scrollTop = 0;
    });
  }),

  actions: {
    increaseRenderedUsersCount () {
      let newUsersCount = this.renderedUsersCount + this.renderedUsersAddendumAmount;
      this.set('renderedUsersCount', newUsersCount);
      this.set('partialRenderingEnabled', newUsersCount < this.users.length);
    }
  }

});
