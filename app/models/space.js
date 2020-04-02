import { alias, sort } from '@ember/object/computed';
import { computed } from '@ember/object';
import { A } from '@ember/array';
import { isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';

class Server {
  @tracked hostname = null;
  @tracked port = 7000;
  @tracked secure = true;
  @tracked username = null;
  @tracked password = null;
  @tracked nickname = null;
  @tracked nickServ = {
    password: null
  };
}

export default class Space {

  @tracked name = null;
  @tracked protocol = 'IRC';
  @tracked server = new Server({
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
  @tracked channels = A([]); // Channel instances
  botkaURL = null; // Kosmos bot

  // Keep a list of all old sockethubPersonIds, because there might
  // still be coming events from Sockethub for those.
  previousSockethubPersonIds = A([]);

  channelSorting = ['name'];
  @sort('channels', 'channelSorting') sortedChannels;

  @alias('server.nickname') userNickname;

  constructor (props) {
    Object.assign(this, props);
  }

  @computed('channels.@each.name')
  get channelNames () {
    return this.channels.mapBy('name');
  }

  @computed('channels.@each.sockethubChannelId')
  get sockethubChannelIds () {
    return this.channels.mapBy('sockethubChannelId');
  }

  get loggedChannels () {
    if (this.name === 'Freenode' && this.protocol === 'IRC') {
      return ['#5apps','#kosmos','#kosmos-dev','#remotestorage','#hackerbeach',
              '#unhosted','#sockethub','#opensourcedesign','#openknot','#emberjs',
              '#indieweb', '#mastodon'];
    } else {
      return [];
    }
  }

  @computed('channels.@each.visible')
  get activeChannel () {
    return this.channels.findBy('visible', true);
  }

  @computed('channels.@each.mucDomain')
  get mucDomains () {
    return this.channels.mapBy('mucDomain').uniq().sort();
  }

  get groupedChannelsByMUCDomain () {
    return this.mucDomains.map(domain => {
      return {
        domain: domain,
        channels: this.channels.filterBy('mucDomain', domain).sortBy('name')
      }
    });
  }

  updateUsername (username) {
    // keep track of old name for later reference
    this.previousSockethubPersonIds.pushObject(this.sockethubPersonId);

    switch (this.protocol) {
      case 'IRC':
        this.server.nickname = username;
        break;
      case 'XMPP':
        this.server.username = username;
        break;
    }
  }

  get sockethubPersonId () {
    let personID;
    switch (this.protocol) {
      case 'IRC':
        personID = `${this.server.nickname}@${this.server.hostname}`;
        break;
      case 'XMPP':
        // TODO - why isn't the full JID user+host+resource?
        personID = `${this.server.username}/hyperchannel`;
        break;
    }
    return personID;
  }

  serialize () {
    let serialized = {
      id: this.id || this.name.dasherize(),
      name: this.name,
      protocol: this.protocol,
      server: {
        hostname: this.server.hostname,
        port: parseInt(this.server.port, 10),
        secure: this.server.secure,
        nickname: this.server.nickname
      },
      channels: this.channelNames || []
    };

    if (isPresent(this.botkaURL)) { serialized.botkaURL = this.botkaURL; }

    ['username', 'password', 'nickname'].forEach(prop => {
      // TODO credentials need to be encrypted and probably stored elsewhere
      if (isPresent(this.server[prop])) {
        serialized.server[prop] = this.server[prop];
      }
    });

    return serialized;
  }

}
