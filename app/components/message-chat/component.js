import Ember from 'ember';

export default Ember.Component.extend({

  tagName: 'div',
  classNames: ['chat-message'],

  formattedContent: function() {
    const content = this.get('message.content');

    let out = linkifyStr(content, {
      linkAttributes: { rel: 'nofollow' },
      validate: {
        url: function (value) {
          return /^(http)s?:\/\//.test(value);
        }
      }
    });

    out = out.replace(/\u0003(\d+)/g,'<span class="color-$1">')
             .replace(/\"color-(\d)\"/g,'"color-0$1"')
             .replace(/\u000f/, '</span>');

    return Ember.String.htmlSafe(out);
  }.property('message.content')

});
