import Ember from 'ember';

export default Ember.Object.extend({

  name      : null,
  protocol  : 'IRC',
  server : {
    hostname: null,
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

  userNickname: Ember.computed.alias('server.nickname'),

  sockethubPersonId: function() {
    return `irc://${this.get('server.nickname')}@${this.get('server.hostname')}`;
  }.property('server.hostname', 'server.nickname'),

  channelSorting: ['name'],
  sortedChannels: Ember.computed.sort('channels', 'channelSorting'),

  addChannel(channel) {
    this.get('channels').pushObject(channel);
  },

  channelNames: function() {
    if (Ember.isEmpty(this.get('channels'))) { return []; }
    return this.get('channels').mapBy('channelName');
  }.property('channels.[]'),

  serialize() {
    return {
      id: this.get('id'),
      name: this.get('name'),
      protocol: this.get('protocol'),
      server: {
        hostname: this.get('server.hostname'),
        port: parseInt(this.get('server.port')),
        nickname: this.get('server.nickname'),
      },
      channels: this.get('channelNames')
    };
  },

});
