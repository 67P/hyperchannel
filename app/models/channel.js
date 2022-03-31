import { htmlSafe } from '@ember/string';
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
