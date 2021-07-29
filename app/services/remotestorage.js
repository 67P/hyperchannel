import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import RemoteStorage from 'remotestoragejs';
import Kosmos from 'remotestorage-module-kosmos';
// import config from 'hyperchannel/config/environment';

export default class RemotestorageService extends Service {

  @tracked rsReady = false;

  constructor () {
    super(...arguments);

    this.rs = new RemoteStorage({modules: [Kosmos]});
    this.rs.access.claim('kosmos', 'rw');
    this.rs.caching.enable('/kosmos/');
  }

  async ensureReadiness () {
    return new Promise(resolve => {
      if (this.rsReady) { resolve(); }
      else { this.rs.on('ready', () => resolve()); }
    });
  }

  // TODO
  // addDefaultSpace () {
  //   const spaceConfig = config.spacePresets
  //                             .find(s => s.id === config.defaultSpaceId);
  //
  //   const params = {
  //     id: spaceConfig.id,
  //     name: spaceConfig.name,
  //     protocol: spaceConfig.protocol,
  //     server: spaceConfig.server,
  //     channels: [
  //       '#hackerbeach',
  //       '#kosmos',
  //       '#kosmos-dev',
  //       '#kosmos-random',
  //       '#sockethub'
  //     ],
  //     botkaURL: spaceConfig.botkaURL
  //   };
  //
  //   params.server.nickname = window.prompt("Choose a nickname");
  //
  //   return this.rs.kosmos.spaces.store(params)
  //     .then(() => {
  //       console.debug('[remotestorage]', 'created/stored default space');
  //
  //       let channels = params.channels;
  //       delete params.channels;
  //
  //       const space = new Space(params);
  //
  //       return { space, channels };
  //     });
  // }

  saveAccount (account) {
    return this.rs.kosmos.accounts.storeConfig(account.serialize())
      .then(() => console.debug('[remotestorage]', `saved account ${account.id}`))
      .catch(err => console.error('saving account failed:', err));
  }

  removeAccount (account) {
    return this.rs.kosmos.accounts.remove(account.id)
      .then(() => console.debug('[remotestorage]', `removed account ${account.id} from RS`));
  }

}
