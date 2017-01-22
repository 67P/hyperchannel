import Ember from 'ember';

export default Ember.Route.extend({

  smt: Ember.inject.service(),

  model: function() {
    this.get('smt').loadFixtures();
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
