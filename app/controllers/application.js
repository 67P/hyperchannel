import Ember from 'ember';

const {
  Controller,
  computed: {
    alias
  },
  inject: {
    service
  }
} = Ember;

export default Controller.extend({
  smt: service(),
  storage: service('remotestorage'),
  spaces: alias('smt.spaces'),

  // Make the RS instance available in the browser console for development
  setRemoteStorageGlobal: function() {
    window.remoteStorage = this.get('storage.rs');
  }.on('init'),

  showGlobalMenu: false,
  showChannelMenu: false

});
