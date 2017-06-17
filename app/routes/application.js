import Ember from 'ember';

const {
  Route,
  inject: {
    service
  },
  isEmpty
} = Ember;

export default Route.extend({
  logger: service(),
  coms: service(),
  storage: service('remotestorage'),

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
    this.get('coms').setupListeners();
    return this.get('coms').instantiateSpacesAndChannels();
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

    openNewChannel(space) {
      let channelName = window.prompt('Join channel');

      if (isEmpty(channelName)) {
        return;
      }

      if (space.get('protocol') === 'IRC' && !channelName.match(/^#/)) {
        channelName = `#${channelName}`;
      }
      let channel = this.get('coms').createChannel(space, channelName);
      this.get('storage').saveSpace(space);
      this.transitionTo('space.channel', space, channel);
    }

  }

});
