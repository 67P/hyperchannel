import BaseChannel from 'hyperchannel/routes/space/base_channel';

export default BaseChannel.extend({

  createChannelOrUserChannel (space, channelName) {
    return this.coms.createChannel(space, "#" + channelName);
  },

  actions: {

    willTransition () {
      this.controllerFor('application')
          .set('showChannelMenu', false);
    }

  }

});
