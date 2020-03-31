import BaseChannel from 'hyperchannel/routes/space/base_channel';
import { action } from '@ember/object';

export default class ChannelRoute extends BaseChannel {

  createChannelOrUserChannel (space, channelName) {
    return this.coms.createChannel(space, "#" + channelName);
  }

  @action
  willTransition () {
    this.controllerFor('application').showChannelMenu = false;
  }

}
