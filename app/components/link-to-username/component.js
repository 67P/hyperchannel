import Ember from 'ember';

const {
  Component,
  computed,
  isPresent
} = Ember;

export default Component.extend({

  username: null,

  roles: {
    '@': 'op',
    '%': 'half-op',
    '+': 'voice'
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
