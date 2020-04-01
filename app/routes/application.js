import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class ApplicationRoute extends Route {

  @service logger;
  @service coms;

  beforeModel () {
    super.beforeModel(...arguments);
    // See a list of allowed types in logger.js
    // Add or remove all your log types here:
    // this.logger.add('message');
    // this.logger.remove('join');
    // this.logger.disable();
    // this.logger.enable();
  }

  model () {
    this.coms.setupListeners();
    return this.coms.instantiateSpacesAndChannels();
  }

  @action
  leaveChannel (space, channel) {
    this.coms.removeChannel(space, channel.name);

    // Switch to last channel if the channel parted was currently open
    if (channel.visible) {
      let lastChannel = space.sortedChannels.lastObject;
      this.transitionTo('space.channel', space, lastChannel);
    }
  }

}
