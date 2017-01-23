import Ember from 'ember';
import { storageFor } from 'ember-local-storage';

const {
  Route,
  get
} = Ember;

export default Route.extend({
  userSettings: storageFor('user-settings'),

  beforeModel() {
    let currentSpace = get(this, 'userSettings.currentSpace');
    let currentChannel = get(this, 'userSettings.currentChannel');

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  }
});
