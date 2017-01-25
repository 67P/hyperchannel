import Ember from 'ember';

const {
  Service
} = Ember;

export default Service.extend({
  allowedTypes: [
    'connection',
    'error',
    'join',
    'leave',
    'message',
    'send'
  ],

  showLogsFor: [
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

    if (this.get('showLogsFor').includes(type)) {
      Ember.Logger.debug.apply(null, arguments);
    }
  },

  addToLogs(type) {
    this.get('showLogsFor').push(type);
  },

  removeFromLogs(type) {
    this.get('showLogsFor').removeObject(type);
  }
});
