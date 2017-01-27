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
    'send',
    'sh_completed'
  ],

  activeTypes: [
    'connection',
    'error',
    'join',
    'leave',
    'send',
    'sh_completed'
  ],

  log(type) {
    if (!this.get('allowedTypes').includes(type)) {
      throw new Error(`You specified a unknown type: "${type}".`);
    }

    if (this.get('activeTypes').includes(type) && this.get('enabled')) {
      var params = Array.prototype.slice.call(arguments);
      params[0] = `[${params[0]}]`;
      Ember.Logger.debug.apply(null, params);
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
