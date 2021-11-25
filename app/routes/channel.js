import BaseChannel from 'hyperchannel/routes/base_channel';

export default class ChannelRoute extends BaseChannel {
  createChannelOrUserChannel(account, channelId) {
    let channel;
    switch (account.protocol) {
      case 'IRC':
        channel = this.coms.createChannel(
          account,
          '#' + channelId.match(/^(.+)@/)[1]
        );
        break;
      case 'XMPP':
        channel = this.coms.createChannel(account, channelId);
        break;
    }
    return channel;
  }
}
