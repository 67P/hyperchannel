import Ember from 'ember';

const {
  computed
} = Ember;

export default Ember.Object.extend({

  name      : null,
  protocol  : 'IRC',
  server : {
    hostname: null,
    port: 7000,
    secure: true,
    username: null,
    password: null,
    nickname: null,
    nickServ: {
      password: null
    }
  },
  channels   : null, // Channel instances

  init() {
    this._super(...arguments);
    this.set('channels', []);
  },

  channelNames: computed('channels.@each.name', function() {
    return this.get('channels').mapBy('name');
  }),

  loggedChannels: computed('name', 'protocol', function() {
    if (this.get('name') === 'Freenode' && this.get('protocol') === 'IRC') {
      return ['#5apps','#kosmos','#kosmos-dev','#remotestorage','#hackerbeach',
              '#unhosted','#sockethub','#opensourcedesign','#openknot','#emberjs'];
    } else {
      return [];
    }
  }),

  id: function() {
    // This could be based on server type in the future. E.g. IRC would be
    // server URL, while Campfire would be another id.
    return this.get('name').toLowerCase();
  }.property('name'),

  userNickname: computed.alias('server.nickname'),

  sockethubPersonId: function() {
    return `irc://${this.get('server.nickname')}@${this.get('server.hostname')}`;
  }.property('server.hostname', 'server.nickname'),

  channelSorting: ['name'],
  sortedChannels: computed.sort('channels', 'channelSorting'),

  serialize() {
    return {
      id: this.get('id'),
      name: this.get('name'),
      protocol: this.get('protocol'),
      server: {
        hostname: this.get('server.hostname'),
        port: parseInt(this.get('server.port')),
        secure: this.get('server.secure'),
        nickname: this.get('server.nickname'),
      },
      channels: this.get('channelNames') || []
    };
  },

});
