import BaseChannel from 'hyperchannel/routes/base_channel';

export default class ChannelRoute extends BaseChannel {

  // FIXME must select acccount automatically (for IRC)
  createChannelOrUserChannel (account, channelName) {
    // TODO this is IRC only
    return this.coms.createChannel(account, "#" + channelName);
  }

}
