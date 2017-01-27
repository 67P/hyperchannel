import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import RemoteStorage from 'npm:remotestoragejs';
import 'npm:remotestorage-module-kosmos';

export default Ember.Service.extend({

  rsInstance: null,

  rs: function() {
    if (this.get('rsInstance')) { return this.get('rsInstance'); }

    let rs =  new RemoteStorage(/* {logging: true} */);
    rs.access.claim('kosmos', 'rw');
    rs.caching.enable('/kosmos/');
    return rs;
  }.property('rs'),

  addDefaultSpace() {
    let nickname = prompt("Choose a nickname");

    let params = {
      id: 'freenode',
      name: 'Freenode',
      protocol: 'IRC',
      server: {
        hostname: 'irc.freenode.net',
        secure: true,
        port: 7000,
        nickname: nickname,
      },
      channels: [
        '#hackerbeach',
        '#kosmos',
        '#kosmos-dev',
        '#kosmos-random',
        '#sockethub'
      ]
    };

    return this.get('rs').kosmos.spaces.store(params)
      .then(() => {
        Ember.Logger.debug('[remotestorage]', 'created/stored default space');

        params.channelList = params.channels;
        delete params.channels;

        return Space.create(params);
      });
  }

});
