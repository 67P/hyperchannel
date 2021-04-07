import BaseChannel from 'hyperchannel/routes/space/base_channel';

export default class ChannelRoute extends BaseChannel {

  createChannelOrUserChannel (space, channelName) {
    return this.coms.createChannel(space, "#" + channelName);
  }

}
