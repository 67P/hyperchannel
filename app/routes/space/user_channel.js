import BaseChannel from 'hyperchannel/routes/space/base_channel';

export default BaseChannel.extend({
  createChannelOrUserChannel: function(space, channelName){
    return this.get('coms').createUserChannel(space, channelName);
  }
});
