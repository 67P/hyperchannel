import Component from '@ember/component';
import { computed } from '@ember/object';
import { isPresent, isEmpty } from '@ember/utils';

export default Component.extend({

  username: null,
  roles: null,

  init () {
    this._super(...arguments);

    this.set('roles', {
      '@': 'op',
      '%': 'half-op',
      '+': 'voice'
    });
  },

  role: computed('username', 'roles', function() {
    if (isEmpty(this.username)) return 'normal';

    const role = this.roles[this.username[0]];
    return isPresent(role) ? role : 'normal';
  }),

  usernameWithoutPrefix: computed('username', 'roles', function() {
    if (isEmpty(this.username)) return null;

    const regex = RegExp(`^[\\${Object.keys(this.roles).join('\\')}]`);
    return this.username.replace(regex, '');
  })

});
