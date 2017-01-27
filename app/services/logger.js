import Ember from 'ember';

const {
  Service
} = Ember;

export default Service.extend({
  enabled: true,

  allowedTypes: [
    'connection',
    'error',
    'join',
    'leave',
    'message',
    'send'
  ],

  activeTypes: [
    'connection',
    'error',
    'join',
    'leave',
    'send'
  ],

  log(type) {
    if (!this.get('allowedTypes').includes(type)) {
      throw new Error(`You specified a unknown type: "${type}".`);
    }

    if (this.get('activeTypes').includes(type) && this.get('enabled')) {
      Ember.Logger.debug.apply(null, arguments);
    }
  },

  add(type) {
    this.get('activeTypes').addObject(type);
  },

  remove(type) {
    this.get('activeTypes').removeObject(type);
  },

  disable() {
    this.set('enabled', false);
  },

  enable() {
    this.set('enabled', true);
  }
});
