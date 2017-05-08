import Ember from 'ember';

const {
  computed
} = Ember;

export default Ember.Component.extend({
  username: null,

  role: computed('username', function() {
    if (this.get('username').startsWith('@')) {
      return 'op';
    } else if (this.get('username').startsWith('%')) {
      return 'half-op';
    } else if (this.get('username').startsWith('+')) {
      return 'voice';
    } else {
      return 'normal';
    }
  }),

  usernameWithoutPrefix: computed('username', function() {
    if (this.get('username').startsWith('@')) {
      return this.get('username').replace('@', '');
    } else if (this.get('username').startsWith('%')) {
      return this.get('username').replace('%', '');
    } else if (this.get('username').startsWith('+')) {
      return this.get('username').replace('+', '');
    } else {
      return this.get('username');
    }
  }),
});
