import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

export default class ApplicationRoute extends Route {

  @service('remotestorage') storage;
  @service sockethub;
  @service localData;
  @service logger;
  @service coms;

  async beforeModel () {
    super.beforeModel(...arguments);

    await this.storage.ensureReadiness();
    await this.localData.setDefaultValues();

    await this.sockethub.initialize().then(async () => {
      await this.coms.instantiateAccountsAndChannels();
      this.coms.setupListeners();
    }).catch(error => {
      console.warn('Failed to load Sockethub libs:', error);
    });

    // See a list of allowed types in logger.js
    // Add or remove all your log types here:
    // this.logger.add('message');
    // this.logger.remove('join');
    // this.logger.disable();
    // this.logger.enable();
  }

  redirect (_model, transition) {
    if (isPresent(transition.intent.url) &&
        transition.intent.url.includes('add-account')) {
      return;
    }

    if (!this.sockethub.client) {
      this.transitionTo('configure-sockethub');
    }
    else if (!this.coms.onboardingComplete) {
      this.transitionTo('welcome');
    }
  }

}
