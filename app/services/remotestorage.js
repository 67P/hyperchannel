import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import RemoteStorage from 'remotestoragejs';
import Kosmos from '@kosmos/remotestorage-module-kosmos';
// import config from 'hyperchannel/config/environment';

export default class RemotestorageService extends Service {

  @service logger;

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

  saveAccount (account) {
    return this.rs.kosmos.accounts.storeConfig(account.serialize())
      .then(() => this.log('storage', `saved account ${account.id}`))
      .catch(err => console.error('saving account failed:', err));
  }

  removeAccount (account) {
    return this.rs.kosmos.accounts.remove(account.id)
      .then(() => this.log('storage', `removed account ${account.id}`));
  }

  saveChannel (channel) {
    return this.rs.kosmos.channels.store(channel.serialize())
      .then(() => this.log('storage', `saved channel ${channel.id}`))
      .catch(err => console.error('saving channel failed:', err));
  }

  removeChannel (channel) {
    return this.rs.kosmos.channels.remove(channel.account.id, channel.id)
      .then(() => this.log('storage', `removed channel ${channel.id}`))
      .catch(err => console.error('removing channel failed:', err));
  }

  /**
   * Utility function for easier logging
   * @private
   */
  log () {
    this.logger.log(...arguments);
  }
}
