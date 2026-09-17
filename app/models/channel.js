import { htmlSafe } from '@ember/template';
import { isPresent } from '@ember/utils';
import BaseChannel from 'hyperchannel/models/base_channel';
import config from 'hyperchannel/config/environment';
import linkifyStr from 'linkify-string';

export default class Channel extends BaseChannel {

  searchedPreviousLogsUntilDate = null;

  get formattedTopic () {
    if (isPresent(this.topic)) {
      let topic = linkifyStr(this.topic, {
        defaultProtocol: 'https',
        attributes: {
          rel: 'nofollow noopener',
          target: '_blank'
        },
      });
      return htmlSafe(topic);
    } else {
      return '';
    }
  }

  get publicLogsBaseUrl () {
    // Mirror the slug's leading-# rule for IRC: strip a single leading '#' only
    // for single-# channels (keeps existing log URLs working); preserve all '#'
    // for multi-# channels and percent-encode them so they don't become URL
    // fragments. XMPP logs use the local part of the MUC JID, and other
    // protocols use the full channel name.
    let channelName;
    switch (this.protocol) {
      case 'IRC':
        channelName = this.name
          .replace(/^#(?=[^#])/, '')
          .replace(/#/g, '%23');
        break;
      case 'XMPP':
        channelName = this.name.match(/^(.+)@/)[1];
        break;
      default:
        channelName = this.name;
    }
    return `${config.publicLogs.defaultBaseUrl}/${this.account.server.hostname.toLowerCase()}/channels/${channelName}`;
  }

}
