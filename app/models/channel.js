/* global linkifyStr */
import Ember from 'ember';
import BaseChannel from 'hyperchannel/models/base_channel';

export default BaseChannel.extend({

  searchedPreviousLogsUntilDate: null,

  formattedTopic: Ember.computed('topic', function() {
    if (this.get('topic') !== null) {
      let topic = linkifyStr(this.get('topic'), {
        defaultProtocol: 'https',
        linkAttributes: { rel: 'nofollow' }
      });
      return new Ember.String.htmlSafe(topic);
    } else {
      return '';
    }
  })

});
