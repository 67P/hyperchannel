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
    // Mirror the slug's leading-# rule: strip a single leading '#' only for
    // single-# channels (keeps existing log URLs working); preserve all '#' for
    // multi-# channels and percent-encode them so they don't become URL fragments.
    const channelName = this.name
      .replace(/^#(?=[^#])/, '')
      .replace(/#/g, '%23');
    return `${config.publicLogs.defaultBaseUrl}/${this.account.server.hostname.toLowerCase()}/channels/${channelName}`;
  }

}
