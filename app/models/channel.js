import Ember from 'ember';

export default Ember.Object.extend({

  name: '',
  userList: null,
  messages: null,
  connected: false,
  sockethubChannelId: null,
  topic: null,

  slug: function() {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.get('name').replace(/#/g,'');
  }.property('name'),

  formattedTopic: function() {
    if (this.get('topic') !== null) {
      let topic = linkifyStr(this.get('topic'), {
        defaultProtocol: 'https',
        linkAttributes: { rel: 'nofollow' }
      });
      return new Ember.String.htmlSafe(topic);
    } else {
      return "";
    }
  }.property('message'),

});
