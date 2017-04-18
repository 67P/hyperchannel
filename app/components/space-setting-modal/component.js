import Ember from 'ember';
import Space from 'hyperchannel/models/space';

export default Ember.Component.extend({

  settings: null,
  space: null,

  init() {
    this._super(...arguments);

    // create a clone of the settings that we can operate on
    this.set('space', Space.create(this.get('settings').serialize()));
  },

  actions: {
    save() {
      this.attrs.onSave(this.get('space'));
    },

    cancel() {
      this.attrs.onCancel();
    }
  }

});
