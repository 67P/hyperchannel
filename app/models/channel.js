/* global linkifyStr */
import { htmlSafe } from '@ember/string';
import { computed } from '@ember/object';
import BaseChannel from 'hyperchannel/models/base_channel';

export default BaseChannel.extend({

  searchedPreviousLogsUntilDate: null,

  formattedTopic: computed('topic', function() {
    if (this.get('topic') !== null) {
      let topic = linkifyStr(this.get('topic'), {
        defaultProtocol: 'https',
        linkAttributes: { rel: 'nofollow' }
      });
      return new htmlSafe(topic);
    } else {
      return '';
    }
  })

});
