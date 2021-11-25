/* global linkifyStr */
import { htmlSafe } from '@ember/string';
import BaseChannel from 'hyperchannel/models/base_channel';

export default class Channel extends BaseChannel {
  searchedPreviousLogsUntilDate = null;

  get formattedTopic() {
    if (this.topic !== null) {
      let topic = linkifyStr(this.topic, {
        defaultProtocol: 'https',
        linkAttributes: { rel: 'nofollow' },
      });
      return new htmlSafe(topic);
    } else {
      return '';
    }
  }
}
