import Ember from 'ember';

const {
  computed,
  isPresent,
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
              '#unhosted','#sockethub','#opensourcedesign','#openknot','#emberjs',
              '#indieweb', '#mastodon'];
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
    let personID;
    switch (this.get('protocol')) {
      case 'IRC':
        personID = `irc://${this.get('server.nickname')}@${this.get('server.hostname')}`;
        break;
      case 'XMPP':
        personID = `xmpp://${this.get('server.username')}@${this.get('server.hostname')}`;
        break;
    }
    return personID;
  }.property('protocol', 'server.hostname', 'server.username', 'server.nickname'),

  channelSorting: ['name'],
  sortedChannels: computed.sort('channels', 'channelSorting'),

  serialize() {
    let serialized = {
      id: this.get('id'),
      name: this.get('name'),
      protocol: this.get('protocol'),
      server: {
        hostname: this.get('server.hostname'),
        port: parseInt(this.get('server.port')),
        secure: this.get('server.secure'),
      },
      channels: this.get('channelNames') || []
    };

    ['username', 'password', 'nickname'].forEach(prop => {
      // TODO credentials need to be encrypted and probably stored elsewhere
      if (isPresent(this.get(`server.${prop}`))) {
        serialized.server[prop] = this.get(`server.${prop}`);
      }
    });

    return serialized;
  },

});
