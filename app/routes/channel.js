import BaseChannel from 'hyperchannel/routes/base_channel';

export default class ChannelRoute extends BaseChannel {

  createChannelOrUserChannel (account, channelId) {
    let channel;
    switch(account.protocol) {
      case 'IRC': {
        let name = channelId.match(/^(.+)@/)[1];
        // Old/persisted slugs for single-hash channels have no leading '#';
        // multi-hash slugs already carry their '#' characters.
        if (!name.startsWith('#')) name = `#${name}`;
        channel = this.coms.createChannel(account, name);
        break;
      }
      case 'XMPP':
        channel = this.coms.createChannel(account, channelId);
        break;
    }
    return channel;
  }

}
