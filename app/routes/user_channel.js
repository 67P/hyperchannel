import BaseChannel from 'hyperchannel/routes/base_channel';

export default BaseChannel.extend({
  createChannelOrUserChannel: function (account, channelId) {
    let channel;
    switch (account.protocol) {
      case 'IRC':
        channel = this.coms.createUserChannel(
          account,
          channelId.match(/^(.+)@/)[1]
        );
        break;
      case 'XMPP':
        channel = this.coms.createUserChannel(account, channelId);
        break;
    }
    return channel;
  },
});
