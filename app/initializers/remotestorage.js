import Ember from 'ember';

export default {
  name: 'remotestorage',
  storage: Ember.inject.service('remotestorage'),
  initialize(/* application */) {
    // let rs = this.get('storage.rs');
    //
    // let rsEvents = [
    //   'ready', 'not-connected', 'connected', 'disconnected', 'error',
    //   'features-loaded', 'connecting', 'authing', 'wire-busy', 'wire-done',
    //   'network-offline', 'network-online'
    // ];
    //
    // rsEvents.forEach(evt => {
    //   rs.on(evt, () => console.debug(`rs ${evt}`));
    // });
  }
};

