import Ember from 'ember';

const {
  Route,
  get,
  inject: {
    service
  }
} = Ember;

export default Route.extend({
  logger: service(),
  smt: service(),

  beforeModel() {
    // See a list of allowed types in logger.js
    // Add or remove all your log types here:
    // get(this, 'logger').addToLogs('message');
    // get(this, 'logger').removeFromLogs('join');
  },

  model() {
    get(this, 'smt').loadFixtures();
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
