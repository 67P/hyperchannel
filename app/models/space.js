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

  // Keep a list of all old sockethubPersonIds, because there might
  // still be coming events from Sockethub for those.
  previousSockethubPersonIds: null,

  init() {
    this._super(...arguments);
    this.set('channels', []);
    this.set('previousSockethubPersonIds', []);
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

  updateUsername(username) {
    // keep track of old name for later reference
    this.get('previousSockethubPersonIds').pushObject(this.get('sockethubPersonId'));

    switch (this.get('protocol')) {
      case 'IRC':
        this.set('server.nickname', username);
        break;
      case 'XMPP':
        this.set('server.username', username);
        break;
    }
  },

  sockethubPersonId: function() {
    let personID;
    switch (this.get('protocol')) {
      case 'IRC':
        // TODO - remove the use of any URI protocol part
        personID = `irc://${this.get('server.nickname')}@${this.get('server.hostname')}`;
        break;
      case 'XMPP':
        // TODO - why isn't the full JID user+host+resource?
        personID = `${this.get('server.username')}/hyperchannel`;
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
        port: parseInt(this.get('server.port'), 10),
        secure: this.get('server.secure'),
        nickname: this.get('server.nickname')
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
  }

});
