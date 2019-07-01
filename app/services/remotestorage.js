import Service from '@ember/service';
import Space from 'hyperchannel/models/space';
import RemoteStorage from 'remotestoragejs';
import Kosmos from 'remotestorage-module-kosmos';
import config from 'hyperchannel/config/environment';

export default Service.extend({

  rs: null,

  init () {
    this._super(...arguments);

    const rs =  new RemoteStorage({modules: [Kosmos]});
    rs.access.claim('kosmos', 'rw');
    rs.caching.enable('/kosmos/');

    this.set('rs', rs);
  },

  addDefaultSpace() {
    let spaceConfig = config.spacePresets
                            .find(s => s.id === config.defaultSpaceId);

    let params = {
      id: spaceConfig.id,
      name: spaceConfig.name,
      protocol: spaceConfig.protocol,
      server: spaceConfig.server,
      channels: [
        '#hackerbeach',
        '#kosmos',
        '#kosmos-dev',
        '#kosmos-random',
        '#sockethub'
      ],
      botkaURL: spaceConfig.botkaURL
    };

    params.server.nickname = window.prompt("Choose a nickname");

    return this.rs.kosmos.spaces.store(params)
      .then(() => {
        console.debug('[remotestorage]', 'created/stored default space');

        let channels = params.channels;
        delete params.channels;

        const space = Space.create();
        space.setProperties(params);

        return { space, channels };
      });
  },

  saveSpace(space) {
    return this.rs.kosmos.spaces.store(space.serialize())
      .then(() => console.debug('[remotestorage]', `saved space ${space.get('name')}`))
      .catch(err => console.error('saving space failed:', err));
  },

  removeSpace(space) {
    return this.rs.kosmos.spaces.remove(space.get('id'))
      .then(() => console.debug('[remotestorage]', `removed space ${space.get('name')} from RS`));
  }

});
