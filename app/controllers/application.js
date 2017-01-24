import Ember from 'ember';

export default Ember.Controller.extend({

  smt: Ember.inject.service(),
  storage: Ember.inject.service('remotestorage'),
  spaces: Ember.computed.alias('smt.spaces'),

  // Make the RS instance available in the browser console for development
  setRemoteStorageGlobal: function() {
    window.remoteStorage = this.get('storage.rs');
  }.on('init'),

  showGlobalMenu: false,
  showChannelMenu: false

});
