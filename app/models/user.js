import Ember from 'ember';

const {
  computed
} = Ember;

export default Ember.Object.extend({

  role: "normal",
  username: null,

  init() {
    this._super(...arguments);

    if (this.get('username').startsWith("@")) {
      this.set('role', 'op');
      this.set('username', this.get('username').replace("@", ""));
    }
  },

  decoratedUsername: computed('username', function() {
    if (this.get('role') === 'op') {
      return "@" + this.get('username');
    } else {
      return this.get('username');
    }
  }),

});
