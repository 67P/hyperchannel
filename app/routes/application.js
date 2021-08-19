import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ApplicationRoute extends Route {

  @service('remotestorage') storage;
  @service localData;
  @service logger;
  @service coms;

  async beforeModel (transition) {
    super.beforeModel(...arguments);

    await this.storage.ensureReadiness();
    await this.localData.setDefaultValues();
    await this.coms.instantiateAccountsAndChannels();
    this.coms.setupListeners();

    if (!this.coms.onboardingComplete &&
        !transition.intent.url.includes('add-account')) {
      this.transitionTo('welcome');
    }

    // See a list of allowed types in logger.js
    // Add or remove all your log types here:
    // this.logger.add('message');
    // this.logger.remove('join');
    // this.logger.disable();
    // this.logger.enable();
  }

  @action
  leaveChannel (channel) {
    this.coms.removeChannel(channel.name);

    // Switch to last channel if the channel parted was currently open
    if (channel.visible) {
      let lastChannel = this.coms.sortedChannels.lastObject;
      this.transitionTo('channel', lastChannel);
    }
  }

}
