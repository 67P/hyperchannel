import { tracked } from '@glimmer/tracking';
import { isPresent } from '@ember/utils';

export default class Account {

  @tracked username = null;
  @tracked password = null;
  @tracked nickname = null;
  @tracked server   = null;
  @tracked botkaURL = null; // Kosmos bot

  constructor (props) {
    Object.assign(this, props);
  }

  get id () {
    return this.userAddress;
  }

  // TODO get from bot API; move to libera.chat
  get loggedChannels () {
    // if (this.protocol === 'IRC' && this.name === 'Freenode' &&) {
    //   return ['#5apps','#kosmos','#kosmos-dev','#remotestorage','#hackerbeach',
    //           '#unhosted','#sockethub','#opensourcedesign','#openknot','#emberjs',
    //           '#indieweb', '#mastodon'];
    // } else {
    return [];
    // }
  }

  serialize () {
    const serialized = {
      id: this.id,
      protocol: this.protocol,
      username: this.username,
      password: this.password,
      nickname: this.nickname,
      botkaURL: this.botkaURL
    };

    if (isPresent(this.server)) {
      serialized.server = {
        hostname: this.server.hostname,
        port: parseInt(this.server.port, 10),
        secure: this.server.secure
      };
    }

    return serialized;
  }

}