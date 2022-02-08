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
        secure: this.server.secure,
        sasl: this.server.sasl
      };
    }

    return serialized;
  }

}
