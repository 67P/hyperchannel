import Ember from 'ember';

export default Ember.Component.extend({

  tagName: 'div',
  classNames: ['chat-message'],

  formattedContent: function() {
    const content = this.get('message.content');

    var out = content.replace(/\u0003(\d+)/g,'<span class="color-$1">')
                     .replace(/\"color-(\d)\"/g,'"color-0$1"')
                     .replace(/\u000f/, '</span>');

    return Ember.String.htmlSafe(out);
  }.property('message.content')

});
