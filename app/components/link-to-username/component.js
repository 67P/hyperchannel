import Component from '@ember/component';
import { computed } from '@ember/object';
import { isPresent } from '@ember/utils';

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
    const role = this.get('roles')[this.get('username')[0]];

    if (isPresent(role)) {
      return role;
    }

    return 'normal';
  }),

  usernameWithoutPrefix: computed('username', 'roles', function() {
    const regex = RegExp(`^[\\${Object.keys(this.get('roles')).join('\\')}]`);

    return this.get('username').replace(regex, '');
  })

});
