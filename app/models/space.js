import { alias, sort } from '@ember/object/computed';
import EmberObject, { computed } from '@ember/object';
import { isPresent } from '@ember/utils';

export default EmberObject.extend({

  name    : null,
  protocol: 'IRC',
  server  : null,
  channels: null, // Channel instances
  botkaURL: null, // Kosmos bot

  // Keep a list of all old sockethubPersonIds, because there might
  // still be coming events from Sockethub for those.
  previousSockethubPersonIds: null,

  channelSorting: null,
  sortedChannels: sort('channels', 'channelSorting'),

  init () {
    this.set('channelSorting', ['name']);
    this.set('channels', []);
    this.set('previousSockethubPersonIds', []);

    this.set('server', {
      hostname: null,
      port: 7000,
      secure: true,
      username: null,
      password: null,
      nickname: null,
      nickServ: {
        password: null
      }
    });

    this._super(...arguments);
  },

  channelNames: computed('channels.@each.name', function() {
    return this.channels.mapBy('name');
  }),

  sockethubChannelIds: computed('channels.@each.sockethubChannelId', function() {
    return this.channels.mapBy('sockethubChannelId');
  }),

  loggedChannels: computed('name', 'protocol', function() {
    if (this.name === 'Freenode' && this.protocol === 'IRC') {
      return ['#5apps','#kosmos','#kosmos-dev','#remotestorage','#hackerbeach',
              '#unhosted','#sockethub','#opensourcedesign','#openknot','#emberjs',
              '#indieweb', '#mastodon'];
    } else {
      return [];
    }
  }),

  activeChannel: computed('channels.@each.visible', function () {
    return this.channels.findBy('visible', true);
  }),

  userNickname: alias('server.nickname'),

  updateUsername(username) {
    // keep track of old name for later reference
    this.previousSockethubPersonIds.pushObject(this.sockethubPersonId);

    switch (this.protocol) {
      case 'IRC':
        this.set('server.nickname', username);
        break;
      case 'XMPP':
        this.set('server.username', username);
        break;
    }
  },

  sockethubPersonId: computed('protocol', 'server.{hostname,username,nickname}', function () {
    let personID;
    switch (this.protocol) {
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
  }),

  serialize() {
    let serialized = {
      id: this.id || this.name.dasherize(),
      name: this.name,
      protocol: this.protocol,
      server: {
        hostname: this.get('server.hostname'),
        port: parseInt(this.get('server.port'), 10),
        secure: this.get('server.secure'),
        nickname: this.get('server.nickname')
      },
      channels: this.channelNames || []
    };

    if (isPresent(this.botkaURL)) { serialized.botkaURL = this.botkaURL; }

    ['username', 'password', 'nickname'].forEach(prop => {
      // TODO credentials need to be encrypted and probably stored elsewhere
      if (isPresent(this.get(`server.${prop}`))) {
        serialized.server[prop] = this.get(`server.${prop}`);
      }
    });

    return serialized;
  }

});
