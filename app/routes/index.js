import Ember from 'ember';
import { storageFor as localStorageFor } from 'ember-local-storage';

export default Ember.Route.extend({

  userSettings: localStorageFor('user-settings'),

  redirect() {
    let currentSpace = this.get('userSettings.currentSpace') || 'freenode';
    let currentChannel = this.get('userSettings.currentChannel') || '#kosmos';

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  }

});
