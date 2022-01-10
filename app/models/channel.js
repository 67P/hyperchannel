/* global linkifyStr */
import { htmlSafe } from '@ember/string';
import BaseChannel from 'hyperchannel/models/base_channel';
import config from 'hyperchannel/config/environment';

export default class Channel extends BaseChannel {

  searchedPreviousLogsUntilDate = null;

  get formattedTopic () {
    if (this.topic !== null) {
      let topic = linkifyStr(this.topic, {
        defaultProtocol: 'https',
        linkAttributes: { rel: 'nofollow' }
      });
      return new htmlSafe(topic);
    } else {
      return '';
    }
  }

  get publicLogsBaseUrl () {
    // TODO needs to get hostname from channel meta info for federated protocols
    return `${config.publicLogs.defaultBaseUrl}/${this.account.server.hostname.toLowerCase()}/channels/${this.shortName}`;
  }

}
