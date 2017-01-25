import Ember from 'ember';
import { storageFor as localStorageFor } from 'ember-local-storage';

const {
  Route
} = Ember;

export default Route.extend({
  userSettings: localStorageFor('user-settings'),

  beforeModel() {
    let currentSpace = this.get('userSettings.currentSpace');
    let currentChannel = this.get('userSettings.currentChannel');

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  }
});
