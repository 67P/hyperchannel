import Ember from 'ember';
import { storageFor as localStorageFor } from 'ember-local-storage';

const {
  Route,
  inject: {
    service
  }
} = Ember;

export default Route.extend({
  logger: service(),
  smt: service(),
  userSettings: localStorageFor('user-settings'),

  beforeModel() {
    this._super(...arguments);
    // See a list of allowed types in logger.js
    // Add or remove all your log types here:
    // this.get('logger').add('message');
    // this.get('logger').remove('join');
    // this.get('logger').disable();
    // this.get('logger').enable();
  },

  model() {
    this.get('smt').setupListeners();
    return this.get('smt').instantiateSpacesAndChannels();
  },

  afterModel() {
    let currentSpace = this.get('userSettings.currentSpace') || 'freenode';
    let currentChannel = this.get('userSettings.currentChannel') || '#kosmos';

    if (currentSpace && currentChannel) {
      this.transitionTo('space.channel', currentSpace, currentChannel);
    }
  },

  actions: {

    menu(which, what) {
      let menuProp = `show${which.capitalize()}Menu`;

      switch(what) {
        case 'show':
          this.controller.set(menuProp, true);
          break;
        case 'hide':
          this.controller.set(menuProp, false);
          break;
        case 'toggle':
          this.controller.toggleProperty(menuProp);
          break;
      }
    },

  }

});
