import Ember from 'ember';

export default Ember.Object.extend({

  name      : '',
  ircServer : {
    hostname: 'irc.freenode.net',
    port: 6667,
    secure: false,
    username: null,
    password: null,
    nickname: null,
    nickServ: {
      password: null
    }
  },
  channels  : null,
  users     : null,

  id: function() {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.get('name').toLowerCase();
  }.property('name'),

  userNickname: Ember.computed.alias('ircServer.nickname'),

  sockethubPersonId: function() {
    return `irc://${this.get('ircServer.nickname')}@${this.get('ircServer.hostname')}`;
  }.property('ircServer.hostname', 'ircServer.nickname'),

  channelSorting: ['name'],
  sortedChannels: Ember.computed.sort('channels', 'channelSorting'),

  addChannel(channel) {
    this.get('channels').pushObject(channel);
  }

});
