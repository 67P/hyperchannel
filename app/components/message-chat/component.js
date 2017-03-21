import Ember from 'ember';
import moment from 'moment';

const {
  computed,
  String: {
    htmlSafe
  }
} = Ember;

export default Ember.Component.extend({
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
      out = `<br><a href="${content}" target="_blank" rel="nofollow">` +
            `<img src="${content}" class="from-image-url" alt="${content}">` +
            `</a>`;
    }
    // Other links
    else {
      out = linkifyStr(content, {
        linkAttributes: { rel: 'nofollow' },
        validate: {
          url: function (value) {
            return /^(http)s?:\/\//.test(value);
          }
        }
      });
    }

    // Colors
    out = out.replace(/\u0003(\d+)/g,'<span class="color-$1">')
             .replace(/\"color-(\d)\"/g,'"color-0$1"')
             .replace(/\u000f/, '</span>');

    return htmlSafe(out);
  })
});
