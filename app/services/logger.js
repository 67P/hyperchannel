import Ember from 'ember';

const {
  Service,
  get
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
    if (!get(this, 'allowedTypes').includes(type)) {
      throw new Error(`You specified a unknown type: "${type}".`);
    }

    if (get(this, 'showLogsFor').includes(type)) {
      console.log.apply(null, arguments);
    }
  },

  addToLogs(type) {
    get(this, 'showLogsFor').push(type);
  },

  removeFromLogs(type) {
    let types = get(this, 'showLogsFor');
    let index = types.indexOf(type);

    if (index > -1) {
        types.splice(index, 1);
    }
  }
});
