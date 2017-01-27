import Ember from 'ember';
import RemoteStorage from 'npm:remotestoragejs';
import 'npm:remotestorage-module-kosmos';

export default Ember.Service.extend({

  rsInstance: null,

  rs: function() {
    let rs = this.get('rsInstance') || new RemoteStorage(/* {logging: true} */);
    rs.access.claim('kosmos', 'rw');
    rs.caching.enable('/kosmos/');
    return rs;
  }.property('rs'),

  addDefaultSpace() {
    this.get('rs').kosmos.spaces.store({
      id: 'freenode',
      name: 'Freenode',
      protocol: 'IRC',
      server: {
        hostname: 'irc.freenode.net',
        port: 6667
      },
      channels: ['#hackerbeach','#kosmos','#kosmos-dev','#kosmos-random','#sockethub']
    }).then(d => console.debug('data', d), e => console.debug('error', e));
  }

});
