import Component from '@ember/component';
import Space from 'hyperchannel/models/space';

export default Component.extend({

  settings: null,
  space: null,

  init() {
    this._super(...arguments);

    // create a clone of the settings that we can operate on
    this.set('space', Space.create(this.get('settings').serialize()));
  },

  actions: {
    save() {
      this.onSave(this.get('space'));
    },

    cancel() {
      this.onCancel();
    }
  }

});
