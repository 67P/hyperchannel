import BaseChannel from 'hyperchannel/routes/base_channel';

export default BaseChannel.extend({

  // FIXME must select acccount automatically
  createChannelOrUserChannel: function(account, channelName){
    return this.coms.createUserChannel(account, channelName);
  }

});
