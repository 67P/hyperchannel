/* global linkifyStr */
import Component from '@ember/component';

import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import moment from 'moment';

export default Component.extend({
  tagName: 'div',
  classNames: ['chat-message'],

  message: null,

  datetime: computed('message.date', function() {
    return moment(this.get('message.date')).format('YYYY-MM-DD[T]HH:mm');
  }),

  dateTitle: computed('message.date', function() {
    return moment(this.get('message.date')).format('YYYY-MM-DD [at] HH:mm');
  }),

  formattedContent: computed('message.content', function() {
    const content = this.get('message.content');
    let out;

    // Images
    if (content.match(/^(http)s?:\/\/.*(gif|png|jpg|jpeg)$/i)) {
      out = `<br><a href="${content}" target="_blank" rel="nofollow noopener">` +
            `<img src="${content}" class="from-image-url" alt="${content}">` +
            `</a>`;
    }
    // Other links
    else {
      out = linkifyStr(content, {
        linkAttributes: { rel: 'nofollow noopener' },
        validate: {
          url: function (value) {
            return /^(http)s?:\/\//.test(value);
          },
          email: function () { return false; }
        }
      });
    }

    // Colors
    out = out.replace(/\u0003(\d+)/g, '<span class="color-$1">')
             .replace(/"color-(\d)"/g, '"color-0$1"')
             .replace(/\u0002/g, '<span class="bold">')
             .replace(/\u001D/g, '<span class="italic">')
             .replace(/\u000f/g,  '</span>');

    return htmlSafe(out);
  }),

  didInsertElement () {
    this._super(...arguments);

    let domElement = this.element;
    this.onInsert(domElement, this.message);
  },

  actions: {

    usernameClick (username) {
      this.onUsernameClick(username);
    }

  }
});
